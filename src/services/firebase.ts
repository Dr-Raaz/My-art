/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  auth?: Auth
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirebaseStatus {
  isConfigured: boolean;
  projectId?: string;
  databaseId?: string;
  authDomain?: string;
  storageBucket?: string;
  reason?: string;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let cachedStatus: FirebaseStatus | null = null;

export function getFirebaseStatus(): FirebaseStatus {
  if (cachedStatus) return cachedStatus;

  // Check Vite client environment variables or global config
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)';

  if (!apiKey || !projectId) {
    cachedStatus = {
      isConfigured: false,
      reason: 'Firebase credentials (VITE_FIREBASE_API_KEY & VITE_FIREBASE_PROJECT_ID) are not configured.',
    };
    return cachedStatus;
  }

  cachedStatus = {
    isConfigured: true,
    projectId,
    databaseId: firestoreDatabaseId,
    authDomain,
    storageBucket,
  };
  return cachedStatus;
}

export function initFirebase(): {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  status: FirebaseStatus;
} {
  const status = getFirebaseStatus();

  if (!status.isConfigured) {
    return { app: null, db: null, auth: null, storage: null, status };
  }

  if (!app && getApps().length === 0) {
    try {
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      app = initializeApp(config);
      const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
      db = dbId ? getFirestore(app, dbId) : getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
    } catch (e) {
      console.warn('Failed to initialize Firebase SDK:', e);
      status.isConfigured = false;
      status.reason = e instanceof Error ? e.message : 'Initialization failed';
    }
  } else if (!app && getApps().length > 0) {
    app = getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  }

  return { app, db, auth, storage, status };
}

export { app, db, auth, storage };
