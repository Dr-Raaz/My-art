/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  initFirebase,
  handleFirestoreError,
  OperationType,
  getFirebaseStatus,
} from './firebase';
import {
  INITIAL_CATEGORIES,
  INITIAL_ARTWORKS,
  type Category,
  type Artwork,
} from '../data/defaultArtworks';

// Local storage keys for pre-Firebase configuration mode
const STORAGE_KEY_CATEGORIES = 'kcs_categories_v1';
const STORAGE_KEY_ARTWORKS = 'kcs_artworks_v1';

import { getActiveFirebaseIdToken } from './authService';

/**
 * Loads categories from Firestore or fallback storage.
 * Public queries filter for isActive == true matching security rules.
 */
export async function getCategories(includeInactive = false): Promise<Category[]> {
  const { db, status } = initFirebase();

  if (status.isConfigured && db) {
    try {
      const q = includeInactive
        ? query(collection(db, 'categories'), orderBy('sortOrder', 'asc'))
        : query(collection(db, 'categories'), where('isActive', '==', true), orderBy('sortOrder', 'asc'));

      const snapshot = await getDocs(q);
      const list: Category[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Category, 'id'>) });
      });
      if (list.length > 0) return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'categories');
    }
  }

  // Fallback to local storage or initial defaults
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (saved) {
      try {
        const list: Category[] = JSON.parse(saved);
        return includeInactive ? list : list.filter((c) => c.isActive);
      } catch {}
    }
  }
  return includeInactive ? [...INITIAL_CATEGORIES] : INITIAL_CATEGORIES.filter((c) => c.isActive);
}

/**
 * Loads artworks from Firestore or fallback storage.
 * Public queries filter for isPublished == true matching security rules.
 */
export async function getArtworks(includeUnpublished = false): Promise<Artwork[]> {
  const { db, status } = initFirebase();

  if (status.isConfigured && db) {
    try {
      const q = includeUnpublished
        ? collection(db, 'artworks')
        : query(collection(db, 'artworks'), where('isPublished', '==', true));

      const snapshot = await getDocs(q);
      const list: Artwork[] = [];
      snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...(docSnap.data() as Omit<Artwork, 'id'>) };
        if (includeUnpublished || item.isPublished) {
          list.push(item);
        }
      });
      if (list.length > 0) return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'artworks');
    }
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_ARTWORKS);
    if (saved) {
      try {
        const list: Artwork[] = JSON.parse(saved);
        return includeUnpublished ? list : list.filter(a => a.isPublished);
      } catch {}
    }
  }
  return includeUnpublished ? [...INITIAL_ARTWORKS] : INITIAL_ARTWORKS.filter(a => a.isPublished);
}

/**
 * Saves a category (create or update).
 */
export async function saveCategory(category: Category): Promise<void> {
  const { db, status } = initFirebase();

  if (status.isConfigured && db) {
    try {
      await setDoc(doc(db, 'categories', category.id), category, { merge: true });
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${category.id}`);
    }
  }

  // Local persistence for standalone mode
  const current = await getCategories();
  const index = current.findIndex(c => c.id === category.id);
  if (index >= 0) {
    current[index] = category;
  } else {
    current.push(category);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(current));
  }
}

/**
 * Deletes a category with safety check:
 * Requires administrator to reassign or delete associated artwork first.
 */
export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  const allArtworks = await getArtworks(true);
  const associatedArtworks = allArtworks.filter(a => a.categoryId === categoryId);

  if (associatedArtworks.length > 0) {
    return {
      success: false,
      error: `Cannot delete category: ${associatedArtworks.length} artwork(s) belong to it. Please reassign or delete them first.`,
    };
  }

  const { db, status } = initFirebase();

  if (status.isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
    }
  }

  // Local persistence
  const current = await getCategories();
  const filtered = current.filter(c => c.id !== categoryId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(filtered));
  }
  return { success: true };
}

/**
 * Saves an artwork (create or update).
 */
export async function saveArtwork(artwork: Artwork): Promise<void> {
  const { db, status } = initFirebase();

  if (status.isConfigured && db) {
    try {
      await setDoc(doc(db, 'artworks', artwork.id), artwork, { merge: true });
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `artworks/${artwork.id}`);
    }
  }

  // Local persistence
  const current = await getArtworks(true);
  const index = current.findIndex(a => a.id === artwork.id);
  if (index >= 0) {
    current[index] = artwork;
  } else {
    current.unshift(artwork);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(current));
  }
}

/**
 * Deletes an artwork and its storage file if applicable.
 * If ImageKit deletion fails, Firestore/local metadata is NOT deleted.
 */
export async function deleteArtwork(artworkId: string): Promise<void> {
  // 1. Locate the artwork to identify its storage provider
  const allArtworks = await getArtworks(true);
  const artwork = allArtworks.find((a) => a.id === artworkId);

  const { db, storage, status } = initFirebase();

  if (artwork) {
    // 2. If artwork uses ImageKit, delete via authenticated backend endpoint
    const imagekitFileId =
      artwork.imagekitFileId ||
      (artwork.imageUrl?.includes('ik.imagekit.io') && artwork.storagePath && !artwork.storagePath.startsWith('artworks/')
        ? artwork.storagePath
        : undefined);

    if (imagekitFileId) {
      const firebaseIdToken = await getActiveFirebaseIdToken();
      const adminToken = firebaseIdToken || (typeof window !== 'undefined' ? localStorage.getItem('kcs_admin_token') : null);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const res = await fetch('/api/admin/delete-imagekit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileId: imagekitFileId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          `Failed to delete image from ImageKit (${errorData.error || res.statusText}). Artwork metadata was preserved.`
        );
      }
    } else if (artwork.storagePath && artwork.storagePath.startsWith('artworks/') && status.isConfigured && storage) {
      // 3. If artwork was stored in Firebase Storage, delete from storage
      try {
        const storageReference = ref(storage, artwork.storagePath);
        await deleteObject(storageReference);
      } catch (err) {
        console.warn('Firebase storage file deletion note:', err);
      }
    }
  }

  // 4. Delete metadata from Firestore or local storage only after storage deletion succeeded
  if (status.isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'artworks', artworkId));
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `artworks/${artworkId}`);
    }
  }

  const current = await getArtworks(true);
  const filtered = current.filter((a) => a.id !== artworkId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(filtered));
  }
}

/**
 * Uploads an artwork image file:
 * - Validates file format (PNG, JPG, JPEG, WebP)
 * - Validates file size (max 10MB)
 * - Computes image dimensions
 * - Performs signed direct browser-to-ImageKit upload when ImageKit is configured
 * - Falls back to Firebase Storage if configured
 * - Never stores Base64 image data in Firestore
 */
export async function uploadArtworkImage(
  artworkId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ imageUrl: string; storagePath?: string; imagekitFileId?: string; width: number; height: number }> {
  // 1. Validate format
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file format. Please upload a PNG, JPG, or WebP image.');
  }

  // 2. Validate size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File is too large. Maximum allowed size is 10 MB.');
  }

  // 3. Compute image dimensions
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width: naturalWidth, height: naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file dimensions.'));
    };
    img.src = objectUrl;
  });

  // 4. Try signed direct browser-to-ImageKit upload
  const firebaseIdToken = await getActiveFirebaseIdToken();
  const adminToken = firebaseIdToken || (typeof window !== 'undefined' ? localStorage.getItem('kcs_admin_token') : null);
  let imageKitAuth: {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
    urlEndpoint: string;
  } | null = null;

  try {
    const authHeaders: Record<string, string> = {};
    if (adminToken) {
      authHeaders['Authorization'] = `Bearer ${adminToken}`;
    }
    const authRes = await fetch('/api/admin/imagekit-auth', {
      headers: authHeaders,
    });

    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData.token && authData.signature && authData.publicKey) {
        imageKitAuth = authData;
      }
    }
  } catch {
    // Backend endpoint unreachable or unconfigured
  }

  if (imageKitAuth) {
    onProgress?.(5);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', `${artworkId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    formData.append('publicKey', imageKitAuth.publicKey);
    formData.append('signature', imageKitAuth.signature);
    formData.append('expire', String(imageKitAuth.expire));
    formData.append('token', imageKitAuth.token);
    formData.append('folder', '/artworks/');
    formData.append('useUniqueFileName', 'true');

    interface ImageKitUploadResponse {
      fileId: string;
      name: string;
      url: string;
      width?: number;
      height?: number;
      filePath?: string;
    }

    const uploadResponse = await new Promise<ImageKitUploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const parsed = JSON.parse(xhr.responseText);
            resolve(parsed);
          } catch {
            reject(new Error('Invalid JSON response received from ImageKit upload API.'));
          }
        } else {
          try {
            const errJson = JSON.parse(xhr.responseText);
            reject(new Error(errJson.message || `ImageKit upload failed with HTTP status ${xhr.status}.`));
          } catch {
            reject(new Error(`ImageKit upload failed with HTTP status ${xhr.status}.`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during direct upload to ImageKit.'));
      };

      xhr.send(formData);
    });

    onProgress?.(100);

    return {
      imageUrl: uploadResponse.url,
      storagePath: uploadResponse.fileId,
      imagekitFileId: uploadResponse.fileId,
      width: uploadResponse.width || width,
      height: uploadResponse.height || height,
    };
  }

  // 5. Fallback to Firebase Storage if configured
  const { storage, status } = initFirebase();

  if (status.isConfigured && storage) {
    onProgress?.(30);
    const storagePath = `artworks/${artworkId}/original`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, { contentType: file.type });
    onProgress?.(80);
    const downloadUrl = await getDownloadURL(storageRef);
    onProgress?.(100);
    return { imageUrl: downloadUrl, storagePath, width, height };
  }

  // 6. Safeguard: Never store Base64 payloads into Firestore
  if (status.isConfigured) {
    throw new Error(
      'ImageKit or Firebase Storage must be configured to upload artwork to Firestore. Base64 uploads to database are disabled.'
    );
  }

  // Standalone offline demo preview fallback (local demo mode only)
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file data.'));
    reader.readAsDataURL(file);
  });

  onProgress?.(100);
  return { imageUrl: dataUrl, width, height };
}

