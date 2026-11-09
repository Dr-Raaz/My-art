/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FirebaseServerConfig {
  isConfigured: boolean;
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  oAuthClientId?: string;
}

/**
 * Reads Firebase configuration from native AI Studio firebase-applet-config.json
 * or environment variables without exposing private keys.
 */
export function getServerFirebaseConfig(): FirebaseServerConfig {
  // 1. Primary: Native AI Studio configuration file at project root
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed.projectId && parsed.apiKey) {
        return {
          isConfigured: true,
          projectId: parsed.projectId,
          appId: parsed.appId,
          apiKey: parsed.apiKey,
          authDomain: parsed.authDomain,
          firestoreDatabaseId: parsed.firestoreDatabaseId,
          storageBucket: parsed.storageBucket,
          messagingSenderId: parsed.messagingSenderId,
          oAuthClientId: parsed.oAuthClientId,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to read firebase-applet-config.json:', err);
  }

  // 2. Fallback: Environment variables
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (apiKey && projectId) {
    return {
      isConfigured: true,
      projectId,
      apiKey,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    };
  }

  return { isConfigured: false };
}
