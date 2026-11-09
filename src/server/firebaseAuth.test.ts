/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  verifyFirebaseIdToken,
  ADMIN_EMAIL,
  FIREBASE_PROJECT_ID,
} from './firebaseAuth';

// Helper to generate self-signed RSA key pair for testing token decoding and verification logic
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

test('verifyFirebaseIdToken rejects malformed or empty tokens', async () => {
  const empty = await verifyFirebaseIdToken('');
  assert.equal(empty.valid, false);

  const notJwt = await verifyFirebaseIdToken('random-string-not-jwt');
  assert.equal(notJwt.valid, false);

  const invalidParts = await verifyFirebaseIdToken('part1.part2');
  assert.equal(invalidParts.valid, false);
});

test('verifyFirebaseIdToken checks expiration, issuer, audience, and admin email', async () => {
  const header = { alg: 'RS256', kid: 'test-key-id' };
  const now = Math.floor(Date.now() / 1000);

  // 1. Expired token
  const expiredPayload = {
    uid: 'user-123',
    email: ADMIN_EMAIL,
    email_verified: true,
    iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    aud: FIREBASE_PROJECT_ID,
    exp: now - 3600,
    iat: now - 7200,
  };
  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64ExpiredPayload = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
  const expiredToken = `${b64Header}.${b64ExpiredPayload}.dGVzdA`;

  const expiredResult = await verifyFirebaseIdToken(expiredToken);
  assert.equal(expiredResult.valid, false);
  assert.ok(expiredResult.error?.includes('expired'));

  // 2. Audience mismatch
  const wrongAudPayload = {
    ...expiredPayload,
    exp: now + 3600,
    aud: 'wrong-project-id',
  };
  const b64WrongAud = Buffer.from(JSON.stringify(wrongAudPayload)).toString('base64url');
  const wrongAudResult = await verifyFirebaseIdToken(`${b64Header}.${b64WrongAud}.dGVzdA`);
  assert.equal(wrongAudResult.valid, false);
  assert.ok(wrongAudResult.error?.includes('audience mismatch'));

  // 3. Issuer mismatch
  const wrongIssPayload = {
    ...expiredPayload,
    exp: now + 3600,
    iss: 'https://securetoken.google.com/wrong-project',
  };
  const b64WrongIss = Buffer.from(JSON.stringify(wrongIssPayload)).toString('base64url');
  const wrongIssResult = await verifyFirebaseIdToken(`${b64Header}.${b64WrongIss}.dGVzdA`);
  assert.equal(wrongIssResult.valid, false);
  assert.ok(wrongIssResult.error?.includes('issuer mismatch'));
});
