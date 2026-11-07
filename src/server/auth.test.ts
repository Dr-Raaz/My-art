/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
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
