/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getAdminCredentials,
  verifyPassword,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from './src/server/auth.js';
import {
  getImageKitConfig,
  generateUploadAuth,
  deleteImageKitFile,
} from './src/server/imagekit.js';
import {
  verifyFirebaseIdToken,
  ADMIN_EMAIL,
} from './src/server/firebaseAuth.js';
import { getServerFirebaseConfig } from './src/server/firebaseConfig.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Prevent aggressive browser/iframe caching of app code in AI Studio development
app.use((_req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Helper to get client IP for rate limiting
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown-client';
}

// Helper to enforce valid administrator authorization on protected endpoints.
// Supports Firebase ID tokens (primary) and legacy scrypt session tokens (fallback during migration).
async function requireAdminAuth(req: express.Request, res: express.Response): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized. Administrator authorization token is required.' });
    return false;
  }

  const token = authHeader.substring(7);

  // 1. Primary: Verify Firebase ID token
  if (token.split('.').length === 3) {
    const fbVerification = await verifyFirebaseIdToken(token);
    if (fbVerification.valid) {
      if (fbVerification.isAdmin) {
        return true;
      }
      res.status(403).json({ error: 'Forbidden. Administrator privileges required.' });
      return false;
    }
  }

  // 2. Migration fallback: Verify scrypt HMAC session token
  const legacySession = verifyAdminSessionToken(token);
  if (legacySession && legacySession.admin) {
    return true;
  }

  res.status(401).json({ error: 'Unauthorized. Valid administrator authentication is required.' });
  return false;
}

// API Routes
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  const clientIp = getClientIp(req);

  // 1. Check rate limit
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many failed login attempts. Account temporarily locked. Please try again in ${rateLimit.retryAfterSec} seconds.`,
      locked: true,
      retryAfterSec: rateLimit.retryAfterSec,
    });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const adminCreds = getAdminCredentials();
  if (!adminCreds.isConfigured) {
    return res.status(503).json({
      error: 'Administrative access is not configured on this server. Required credentials are missing.',
    });
  }

  // 2. Check username
  if (username !== adminCreds.username) {
    const attempt = recordFailedAttempt(clientIp);
    return res.status(401).json({
      error: 'Invalid administrator credentials.',
      remainingAttempts: attempt.remainingAttempts,
      locked: attempt.locked,
      retryAfterSec: attempt.retryAfterSec,
    });
  }

  // 3. Verify scrypt password hash
  const isValidPassword = await verifyPassword(password, adminCreds.passwordHash);
  if (!isValidPassword) {
    const attempt = recordFailedAttempt(clientIp);
    return res.status(401).json({
      error: 'Invalid administrator credentials.',
      remainingAttempts: attempt.remainingAttempts,
      locked: attempt.locked,
      retryAfterSec: attempt.retryAfterSec,
    });
  }

  // 4. Success -> Clear rate limit & create admin session token
  clearRateLimit(clientIp);
  const sessionToken = createAdminSessionToken(username);

  return res.json({
    success: true,
    sessionToken,
    username,
    admin: true,
  });
});

app.get('/api/admin/session', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, error: 'No authorization token provided.' });
  }

  const token = authHeader.substring(7);
  const session = verifyAdminSessionToken(token);

  if (!session) {
    return res.status(401).json({ valid: false, error: 'Session is invalid or has expired.' });
  }

  return res.json({
    valid: true,
    username: session.username,
    admin: true,
    expiresAt: session.expiresAt,
  });
});

app.post('/api/admin/logout', (_req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * Returns authentication parameters for direct browser-to-ImageKit uploads.
 * Requires an active admin session (Firebase ID token or legacy scrypt session).
 * Never exposes the ImageKit private key.
 */
app.get('/api/admin/imagekit-auth', async (req, res) => {
  if (!(await requireAdminAuth(req, res))) return;

  const config = getImageKitConfig();
  if (!config.isConfigured) {
    return res.status(503).json({
      error: 'ImageKit is not configured on this server.',
    });
  }

  try {
    const authParams = generateUploadAuth();
    return res.json({
      success: true,
      ...authParams,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to generate ImageKit upload parameters.',
    });
  }
});

/**
 * Deletes a file from ImageKit given its file ID.
 * Requires an active admin session (Firebase ID token or legacy scrypt session).
 */
app.post('/api/admin/delete-imagekit', async (req, res) => {
  if (!(await requireAdminAuth(req, res))) return;

  const { fileId } = req.body || {};
  if (!fileId || typeof fileId !== 'string' || !fileId.trim()) {
    return res.status(400).json({
      error: 'A valid fileId string is required.',
    });
  }

  const config = getImageKitConfig();
  if (!config.isConfigured) {
    return res.status(503).json({
      error: 'ImageKit is not configured on this server.',
    });
  }

  try {
    await deleteImageKitFile(fileId.trim());
    return res.json({
      success: true,
      fileId: fileId.trim(),
    });
  } catch (err: any) {
    return res.status(502).json({
      error: err?.message || 'Failed to delete file from ImageKit.',
    });
  }
});

/**
 * Server-side endpoint to verify a Firebase ID token.
 * Confirms whether the token belongs to the authorized administrator.
 */
app.get('/api/auth/verify-token', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, isAdmin: false, error: 'No authorization token provided.' });
  }

  const token = authHeader.substring(7);
  const result = await verifyFirebaseIdToken(token);
  return res.json(result);
});

app.get('/api/config-status', (_req, res) => {
  const fbConfig = getServerFirebaseConfig();
  const ikConfig = getImageKitConfig();

  return res.json({
    firebaseConfigured: fbConfig.isConfigured,
    firebaseProjectId: fbConfig.projectId || null,
    firestoreDatabaseId: fbConfig.firestoreDatabaseId || null,
    imagekitConfigured: ikConfig.isConfigured,
    adminUsername: getAdminCredentials().username,
    adminEmail: ADMIN_EMAIL,
    appVersion: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
  });
});

/**
 * Public client configuration endpoint for Firebase.
 * Returns only public configuration parameters.
 */
app.get('/api/firebase-config', (_req, res) => {
  const fbConfig = getServerFirebaseConfig();
  if (!fbConfig.isConfigured) {
    return res.status(404).json({ error: 'Firebase is not configured.' });
  }
  return res.json({
    projectId: fbConfig.projectId,
    appId: fbConfig.appId,
    apiKey: fbConfig.apiKey,
    authDomain: fbConfig.authDomain,
    firestoreDatabaseId: fbConfig.firestoreDatabaseId,
    storageBucket: fbConfig.storageBucket,
    messagingSenderId: fbConfig.messagingSenderId,
    oAuthClientId: fbConfig.oAuthClientId,
  });
});

// Mount Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`My Art Studio server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
