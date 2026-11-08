/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';

// Rate Limiter tracking in-memory (per IP)
interface AttemptRecord {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number;
}

const attemptsMap = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Modern scrypt password hashing (64-byte key, 16-byte random salt, N=16384, r=8, p=1).
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt$N=16384,r=8,p=1$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Synchronous scrypt password hashing for setup scripts.
 */
export function hashPasswordSync(password: string, customSalt?: string): string {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$N=16384,r=8,p=1$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Timing-safe scrypt password verification.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parts = storedHash.split('$');
      if (parts.length < 4 || parts[0] !== 'scrypt') {
        return resolve(false);
      }
      const salt = parts[2];
      const originalKeyHex = parts[3];
      const originalKey = Buffer.from(originalKeyHex, 'hex');

      crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return resolve(false);
        if (derivedKey.length !== originalKey.length) return resolve(false);
        const match = crypto.timingSafeEqual(derivedKey, originalKey);
        resolve(match);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Pre-computed scrypt hash for initial admin:
 * Username: my_art
 * Password: myart67
 * Generated with salt 'c81f7e9a2b4d6e0f'
 */
const DEFAULT_INITIAL_HASH = hashPasswordSync('myart67', 'c81f7e9a2b4d6e0f');

export function getAdminCredentials(): { username: string; passwordHash: string; isConfigured: boolean } {
  const envUsername = process.env.ADMIN_USERNAME?.trim();
  const envPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (!envPasswordHash || !envUsername) {
      return {
        username: envUsername || '',
        passwordHash: '',
        isConfigured: false,
      };
    }
    return {
      username: envUsername,
      passwordHash: envPasswordHash,
      isConfigured: true,
    };
  }

  // Development mode fallback
  return {
    username: envUsername || 'my_art',
    passwordHash: envPasswordHash || DEFAULT_INITIAL_HASH,
    isConfigured: true,
  };
}

/**
 * Checks rate limiting for an identifier (e.g. client IP).
 * Returns { allowed: boolean, remainingAttempts: number, retryAfterSec?: number }
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const record = attemptsMap.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently locked out
  if (record.lockedUntil > now) {
    const retryAfterSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  // Check if window has expired
  if (now - record.firstAttempt > WINDOW_MS) {
    attemptsMap.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

/**
 * Records a failed login attempt.
 */
export function recordFailedAttempt(identifier: string): {
  locked: boolean;
  remainingAttempts: number;
  retryAfterSec?: number;
} {
  const now = Date.now();
  let record = attemptsMap.get(identifier);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    record = { attempts: 1, firstAttempt: now, lockedUntil: 0 };
    attemptsMap.set(identifier, record);
    return { locked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    const retryAfterSec = Math.ceil(LOCKOUT_MS / 1000);
    return { locked: true, remainingAttempts: 0, retryAfterSec };
  }

  return { locked: false, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}

/**
 * Resets failed attempts upon successful authentication.
 */
export function clearRateLimit(identifier: string): void {
  attemptsMap.delete(identifier);
}

// Session secret getter with strict production enforcement
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is strictly required for administrative operations in production.');
  }
  return 'dev-local-session-secret-key-do-not-use-in-production';
}

export interface AdminSession {
  username: string;
  admin: boolean;
  issuedAt: number;
  expiresAt: number;
}

export function createAdminSessionToken(username: string): string {
  const session: AdminSession = {
    username,
    admin: true,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const secret = getSessionSecret();
  const payloadBase64 = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');
  return `${payloadBase64}.${signature}`;
}

export function verifyAdminSessionToken(token: string): AdminSession | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const secret = getSessionSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const session: AdminSession = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (Date.now() > session.expiresAt || !session.admin) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
