/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminSessionToken, verifyAdminSessionToken } from './auth';
import { getImageKitConfig, generateUploadAuth } from './imagekit';

test('createAdminSessionToken generates token verified by verifyAdminSessionToken', () => {
  const token = createAdminSessionToken('my_art');
  const session = verifyAdminSessionToken(token);
  assert.ok(session);
  assert.equal(session?.username, 'my_art');
  assert.equal(session?.admin, true);

  // Invalid token rejected
  const invalidSession = verifyAdminSessionToken('invalid.token.structure');
  assert.equal(invalidSession, null);
});

test('generateUploadAuth requires active ImageKit configuration and protects privateKey', () => {
  process.env.IMAGEKIT_PUBLIC_KEY = 'public_test_key';
  process.env.IMAGEKIT_PRIVATE_KEY = 'private_secret_key';
  process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test_studio';

  const config = getImageKitConfig();
  assert.equal(config.isConfigured, true);

  const auth = generateUploadAuth();
  assert.ok(auth.token);
  assert.ok(auth.expire);
  assert.ok(auth.signature);
  assert.equal(auth.publicKey, 'public_test_key');
  assert.equal(auth.urlEndpoint, 'https://ik.imagekit.io/test_studio');

  // Strict security check: Ensure private key is NEVER in output
  assert.equal((auth as unknown as Record<string, unknown>).privateKey, undefined);
});
