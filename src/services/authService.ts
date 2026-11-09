/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { initFirebase } from './firebase';

export const ADMIN_EMAIL = 'raazprasai1996@gmail.com';

export interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthListener = (state: AuthState) => void;
const listeners = new Set<AuthListener>();

let currentAuthState: AuthState = {
  user: null,
  isAdmin: false,
  isLoading: true,
  error: null,
};

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...currentAuthState }));
}

/**
 * Returns the current Firebase ID token if user is signed in.
 */
export async function getActiveFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  const { auth } = initFirebase();
  if (!auth || !auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

/**
 * Verifies with the server whether the current token has confirmed administrator privileges.
 */
async function verifyAdminPrivilegesServerSide(idToken: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/verify-token', {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.valid && data.isAdmin);
    }
    return false;
  } catch (err) {
    console.warn('Server-side admin verification network error:', err);
    return false;
  }
}

// Google Auth Provider setup
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Initiates Google sign-in with popup, falling back to redirect if popup is blocked.
 */
export async function signInWithGoogle(): Promise<User | null> {
  const { auth } = initFirebase();
  if (!auth) {
    const err = 'Firebase Authentication is not configured.';
    currentAuthState = { ...currentAuthState, error: err };
    notifyListeners();
    throw new Error(err);
  }

  currentAuthState = { ...currentAuthState, isLoading: true, error: null };
  notifyListeners();

  try {
    // 1. Primary: Try Popup
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // 2. Fallback: If popup is blocked, cancelled, or unsupported by host iframe
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Popup blocked/closed. Falling back to signInWithRedirect...', error.code);
      try {
        await signInWithRedirect(auth, googleProvider);
        return null; // Page will redirect
      } catch (redirectError: any) {
        currentAuthState = {
          ...currentAuthState,
          isLoading: false,
          error: redirectError?.message || 'Google sign-in redirect failed.',
        };
        notifyListeners();
        throw redirectError;
      }
    }

    currentAuthState = {
      ...currentAuthState,
      isLoading: false,
      error: error?.message || 'Google sign-in failed.',
    };
    notifyListeners();
    throw error;
  }
}

/**
 * Signs out current user from Firebase Auth.
 */
export async function signOutUser(): Promise<void> {
  const { auth } = initFirebase();
  if (auth) {
    await firebaseSignOut(auth);
  }
  // Clear any legacy admin local tokens
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kcs_admin_token');
    localStorage.removeItem('kcs_admin_user');
  }
  currentAuthState = {
    user: null,
    isAdmin: false,
    isLoading: false,
    error: null,
  };
  notifyListeners();
}

/**
 * Subscribe to authentication state changes.
 */
export function subscribeToAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  // Send immediate current state
  listener({ ...currentAuthState });
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Initializes Firebase Auth listener and handles potential redirect results.
 */
export function initAuthListener(): void {
  const { auth } = initFirebase();
  if (!auth) {
    currentAuthState = {
      user: null,
      isAdmin: false,
      isLoading: false,
      error: null,
    };
    notifyListeners();
    return;
  }

  // Check for redirect result on return
  getRedirectResult(auth).catch((err) => {
    if (err.code !== 'auth/null-user') {
      console.warn('Redirect sign-in notice:', err);
    }
  });

  onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) {
      currentAuthState = {
        user: null,
        isAdmin: false,
        isLoading: false,
        error: null,
      };
      notifyListeners();
      return;
    }

    // Check if email matches administrator
    const isEmailCandidate =
      currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    let serverVerifiedAdmin = false;
    if (isEmailCandidate) {
      const idToken = await currentUser.getIdToken();
      serverVerifiedAdmin = await verifyAdminPrivilegesServerSide(idToken);
    }

    currentAuthState = {
      user: currentUser,
      isAdmin: serverVerifiedAdmin,
      isLoading: false,
      error: null,
    };
    notifyListeners();
  });
}
