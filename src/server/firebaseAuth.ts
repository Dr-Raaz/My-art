/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';

export const ADMIN_EMAIL = 'raazprasai1996@gmail.com';
export const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'my-art-studio-67';

// In-memory cache for Google's public x509 certificates for Firebase ID token verification
interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}

let certCache: CertCache | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certCache && certCache.expiresAt > now) {
    return certCache.certs;
  }

  try {
    const res = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch Google public certs: ${res.status}`);
    }

    // Parse Cache-Control max-age header if available
    const cacheControl = res.headers.get('cache-control');
    let maxAgeMs = 6 * 60 * 60 * 1000; // default 6 hours
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match) {
        maxAgeMs = parseInt(match[1], 10) * 1000;
      }
    }

    const certs = (await res.json()) as Record<string, string>;
    certCache = {
      certs,
      expiresAt: now + maxAgeMs,
    };
    return certs;
  } catch (err) {
    if (certCache) {
      return certCache.certs;
    }
    throw err;
  }
}

export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

export interface VerificationResult {
  valid: boolean;
  isAdmin: boolean;
  user?: DecodedFirebaseToken;
  error?: string;
}

/**
 * Verifies a Firebase ID token issued by Google for the project.
 * Checks signature, issuer, audience, expiration, and admin email authorization.
 */
export async function verifyFirebaseIdToken(
  token: string,
  targetProjectId = FIREBASE_PROJECT_ID
): Promise<VerificationResult> {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, isAdmin: false, error: 'Token missing or invalid format' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, isAdmin: false, error: 'Invalid JWT structure' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    const payload: DecodedFirebaseToken = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    // 1. Verify header algorithm & key ID
    if (header.alg !== 'RS256' || !header.kid) {
      return { valid: false, isAdmin: false, error: 'Invalid token header algorithm or missing kid' };
    }

    // 2. Verify claims
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSec) {
      return { valid: false, isAdmin: false, error: 'Token has expired' };
    }

    if (payload.iss !== `https://securetoken.google.com/${targetProjectId}`) {
      return {
        valid: false,
        isAdmin: false,
        error: `Token issuer mismatch. Expected https://securetoken.google.com/${targetProjectId}`,
      };
    }

    if (payload.aud !== targetProjectId) {
      return {
        valid: false,
        isAdmin: false,
        error: `Token audience mismatch. Expected ${targetProjectId}`,
      };
    }

    // 3. Verify cryptographic RSA signature using Google public key
    const certs = await getGooglePublicCerts();
    const cert = certs[header.kid];
    if (!cert) {
      return { valid: false, isAdmin: false, error: 'Public certificate for token key ID not found' };
    }

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    const signatureBuffer = Buffer.from(signatureB64, 'base64url');
    const isSignatureValid = verifier.verify(cert, signatureBuffer);

    if (!isSignatureValid) {
      return { valid: false, isAdmin: false, error: 'Cryptographic signature verification failed' };
    }

    // 4. Determine admin status strictly by verified email
    const isAdmin =
      payload.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      payload.email_verified === true;

    return {
      valid: true,
      isAdmin,
      user: payload,
    };
  } catch (err) {
    return {
      valid: false,
      isAdmin: false,
      error: err instanceof Error ? err.message : 'Unknown token verification error',
    };
  }
}
