/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

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
  activeAuth?: Auth | null
): never {
  const currentAuth = activeAuth || auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid ?? null,
      email: currentAuth?.currentUser?.email ?? null,
      emailVerified: currentAuth?.currentUser?.emailVerified ?? null,
      isAnonymous: currentAuth?.currentUser?.isAnonymous ?? null,
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
  appId?: string;
  reason?: string;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let cachedStatus: FirebaseStatus | null = null;

/**
 * Resolves Firebase configuration dynamically from native AI Studio configuration
 * (firebase-applet-config.json) with fallback to Vite client environment variables.
 */
function resolveFirebaseConfig() {
  const cfg = firebaseAppletConfig as {
    projectId?: string;
    appId?: string;
    apiKey?: string;
    authDomain?: string;
    firestoreDatabaseId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
  };

  const apiKey = cfg?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = cfg?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const authDomain = cfg?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const storageBucket = cfg?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = cfg?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = cfg?.appId || import.meta.env.VITE_FIREBASE_APP_ID;
  const firestoreDatabaseId = cfg?.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID;

  return {
    apiKey,
    projectId,
    authDomain,
    storageBucket,
    messagingSenderId,
    appId,
    firestoreDatabaseId,
  };
}

export function getFirebaseStatus(): FirebaseStatus {
  if (cachedStatus) return cachedStatus;

  const config = resolveFirebaseConfig();

  if (!config.apiKey || !config.projectId) {
    cachedStatus = {
      isConfigured: false,
      reason: 'Firebase credentials are not configured in firebase-applet-config.json or environment.',
    };
    return cachedStatus;
  }

  cachedStatus = {
    isConfigured: true,
    projectId: config.projectId,
    databaseId: config.firestoreDatabaseId || '(default)',
    authDomain: config.authDomain,
    storageBucket: config.storageBucket,
    appId: config.appId,
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
      const config = resolveFirebaseConfig();

      app = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });

      // Pass designated firestoreDatabaseId per AI Studio skill guidelines
      if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
        db = getFirestore(app, config.firestoreDatabaseId);
      } else {
        db = getFirestore(app);
      }

      auth = getAuth(app);
      storage = getStorage(app);
    } catch (e) {
      console.warn('Failed to initialize Firebase SDK:', e);
      status.isConfigured = false;
      status.reason = e instanceof Error ? e.message : 'Initialization failed';
    }
  } else if (!app && getApps().length > 0) {
    app = getApps()[0];
    const config = resolveFirebaseConfig();
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
      db = getFirestore(app, config.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    auth = getAuth(app);
    storage = getStorage(app);
  }

  return { app, db, auth, storage, status };
}

/**
 * Validates connection to Firestore by testing server round-trip.
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; message: string }> {
  const { db, status } = initFirebase();
  if (!status.isConfigured || !db) {
    return { connected: false, message: 'Firebase is not configured.' };
  }

  try {
    // Attempt to read from server to verify connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true, message: 'Connected successfully to Cloud Firestore.' };
  } catch (error: any) {
    // If permission is denied or document does not exist, server communication succeeded!
    if (error?.code === 'permission-denied' || error?.code === 'not-found') {
      return { connected: true, message: 'Connected successfully to Cloud Firestore (Security rules active).' };
    }
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      return { connected: false, message: 'Please check your Firebase configuration: Firestore client is offline.' };
    }
    return { connected: true, message: `Connected to Cloud Firestore (${error?.code || 'ready'}).` };
  }
}

export { app, db, auth, storage };
