/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ImageKit from 'imagekit';

export interface ImageKitConfig {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
  isConfigured: boolean;
}

export interface ImageKitUploadAuth {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

/**
 * Reads ImageKit configuration from server-side environment variables
 * without exposing or logging secrets.
 */
export function getImageKitConfig(): ImageKitConfig {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim() || '';
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim() || '';
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim() || '';

  const isConfigured = Boolean(publicKey && privateKey && urlEndpoint);
  return {
    publicKey,
    privateKey,
    urlEndpoint,
    isConfigured,
  };
}

let cachedClient: ImageKit | null = null;
let lastConfigFingerprint = '';

/**
 * Returns a cached ImageKit instance if configured, or null.
 */
export function getImageKitClient(): ImageKit | null {
  const config = getImageKitConfig();
  if (!config.isConfigured) {
    return null;
  }

  // Create or refresh client if environment changed
  const fingerprint = `${config.publicKey}:${config.urlEndpoint}`;
  if (!cachedClient || lastConfigFingerprint !== fingerprint) {
    cachedClient = new ImageKit({
      publicKey: config.publicKey,
      privateKey: config.privateKey,
      urlEndpoint: config.urlEndpoint,
    });
    lastConfigFingerprint = fingerprint;
  }

  return cachedClient;
}

/**
 * Generates signed direct-upload authentication parameters.
 * NEVER includes the ImageKit private key.
 */
export function generateUploadAuth(): ImageKitUploadAuth {
  const config = getImageKitConfig();
  const client = getImageKitClient();

  if (!config.isConfigured || !client) {
    throw new Error('ImageKit is not configured on this server.');
  }

  const authParams = client.getAuthenticationParameters();

  return {
    token: authParams.token,
    expire: authParams.expire,
    signature: authParams.signature,
    publicKey: config.publicKey,
    urlEndpoint: config.urlEndpoint,
  };
}

/**
 * Deletes an artwork file from ImageKit given its file ID.
 */
export async function deleteImageKitFile(fileId: string): Promise<void> {
  const cleanId = fileId?.trim();
  if (!cleanId) {
    throw new Error('A valid ImageKit file ID is required for deletion.');
  }

  const client = getImageKitClient();
  if (!client) {
    throw new Error('ImageKit is not configured on this server.');
  }

  await client.deleteFile(cleanId);
}
