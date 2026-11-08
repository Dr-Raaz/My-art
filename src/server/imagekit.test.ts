/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getImageKitConfig,
  generateUploadAuth,
  deleteImageKitFile,
} from './imagekit';

test('getImageKitConfig correctly reports configuration status based on env vars', () => {
  const origPub = process.env.IMAGEKIT_PUBLIC_KEY;
  const origPriv = process.env.IMAGEKIT_PRIVATE_KEY;
  const origUrl = process.env.IMAGEKIT_URL_ENDPOINT;

  try {
    delete process.env.IMAGEKIT_PUBLIC_KEY;
    delete process.env.IMAGEKIT_PRIVATE_KEY;
    delete process.env.IMAGEKIT_URL_ENDPOINT;

    const unconfigured = getImageKitConfig();
    assert.equal(unconfigured.isConfigured, false);
    assert.throws(() => generateUploadAuth(), /ImageKit is not configured/);

    // Set test credentials
    process.env.IMAGEKIT_PUBLIC_KEY = 'public_test_key_123';
    process.env.IMAGEKIT_PRIVATE_KEY = 'private_test_key_456';
    process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/myartstudio_test';

    const configured = getImageKitConfig();
    assert.equal(configured.isConfigured, true);
    assert.equal(configured.publicKey, 'public_test_key_123');

    const auth = generateUploadAuth();
    assert.ok(auth.token, 'Auth parameters must include token');
    assert.ok(auth.expire, 'Auth parameters must include expire');
    assert.ok(auth.signature, 'Auth parameters must include signature');
    assert.equal(auth.publicKey, 'public_test_key_123');
    assert.equal(auth.urlEndpoint, 'https://ik.imagekit.io/myartstudio_test');

    // SECURITY CHECK: Private key must NEVER be in auth payload
    assert.equal((auth as unknown as Record<string, unknown>).privateKey, undefined);
  } finally {
    if (origPub) process.env.IMAGEKIT_PUBLIC_KEY = origPub;
    else delete process.env.IMAGEKIT_PUBLIC_KEY;
    if (origPriv) process.env.IMAGEKIT_PRIVATE_KEY = origPriv;
    else delete process.env.IMAGEKIT_PRIVATE_KEY;
    if (origUrl) process.env.IMAGEKIT_URL_ENDPOINT = origUrl;
    else delete process.env.IMAGEKIT_URL_ENDPOINT;
  }
});

test('deleteImageKitFile enforces non-empty fileId', async () => {
  await assert.rejects(
    async () => {
      await deleteImageKitFile('');
    },
    /A valid ImageKit file ID is required/
  );

  await assert.rejects(
    async () => {
      await deleteImageKitFile('   ');
    },
    /A valid ImageKit file ID is required/
  );
});
