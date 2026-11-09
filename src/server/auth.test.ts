/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from './auth';

test('scrypt password hash and verification works accurately', async () => {
  const password = 'myart67';
  const hash = await hashPassword(password);

  assert.ok(hash.startsWith('scrypt$'));
  const valid = await verifyPassword(password, hash);
  assert.equal(valid, true);

  const invalid = await verifyPassword('wrongpassword', hash);
  assert.equal(invalid, false);
});

test('Rate limiter limits failed attempts and allows clearing', () => {
  const testIp = '127.0.0.99';
  clearRateLimit(testIp);

  const initial = checkRateLimit(testIp);
  assert.equal(initial.allowed, true);
  assert.equal(initial.remainingAttempts, 5);

  for (let i = 0; i < 4; i++) {
    const rec = recordFailedAttempt(testIp);
    assert.equal(rec.locked, false);
  }

  // 5th failed attempt should lock
  const locked = recordFailedAttempt(testIp);
  assert.equal(locked.locked, true);
  assert.equal(locked.remainingAttempts, 0);

  const checkedAfterLock = checkRateLimit(testIp);
  assert.equal(checkedAfterLock.allowed, false);

  // Clear resets
  clearRateLimit(testIp);
  const afterClear = checkRateLimit(testIp);
  assert.equal(afterClear.allowed, true);
});

test('verifyPassword handles exact PowerShell Buffer-based generation method', async () => {
  const password = 'myProductionSecurePassword123!';
  // Exact PowerShell generation logic
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  const output = salt.toString('hex') + ':' + hash.toString('hex');

  // Verify valid password
  assert.equal(await verifyPassword(password, output), true);

  // Verify wrong password fails
  assert.equal(await verifyPassword('wrongPassword999', output), false);
});

test('verifyPassword verifies Modular Crypt Format correctly', async () => {
  const password = 'custom_mcf_pass';
  const mcfHash = await hashPassword(password);
  assert.ok(mcfHash.startsWith('scrypt$N=16384,r=8,p=1$'));

  // Valid password matches
  assert.equal(await verifyPassword(password, mcfHash), true);
  // Wrong password fails
  assert.equal(await verifyPassword('wrong_pass', mcfHash), false);
});

test('verifyPassword rejects malformed and invalid hashes safely', async () => {
  const password = 'test_password';

  // Empty or invalid types
  assert.equal(await verifyPassword(password, ''), false);
  assert.equal(await verifyPassword(password, null as unknown as string), false);
  assert.equal(await verifyPassword(password, undefined as unknown as string), false);
  assert.equal(await verifyPassword(password, 'invalid-random-string'), false);

  // Colon format with invalid salt length (not 32 hex chars)
  assert.equal(await verifyPassword(password, 'abcd:0123456789abcdef'), false);

  // Colon format with invalid key length (not 128 hex chars)
  const validSaltHex = crypto.randomBytes(16).toString('hex');
  assert.equal(await verifyPassword(password, `${validSaltHex}:shortkey`), false);

  // Colon format with non-hex characters in salt
  const nonHexSalt = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
  const validKeyHex = crypto.randomBytes(64).toString('hex');
  assert.equal(await verifyPassword(password, `${nonHexSalt}:${validKeyHex}`), false);

  // Colon format with non-hex characters in key
  const nonHexKey = 'z'.repeat(128);
  assert.equal(await verifyPassword(password, `${validSaltHex}:${nonHexKey}`), false);

  // Malformed MCF
  assert.equal(await verifyPassword(password, 'scrypt$invalid$format'), false);
  assert.equal(await verifyPassword(password, 'bcrypt$invalid'), false);
});

test('Session token generation and verification works with tamper resistance', () => {
  const token = createAdminSessionToken('my_art');
  assert.ok(token.includes('.'));

  const verified = verifyAdminSessionToken(token);
  assert.ok(verified !== null);
  assert.equal(verified?.username, 'my_art');
  assert.equal(verified?.admin, true);

  // Tampered token fails
  const tampered = token + 'tamper';
  assert.equal(verifyAdminSessionToken(tampered), null);
});

