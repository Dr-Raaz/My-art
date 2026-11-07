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

/**
 * Loads categories from Firestore or fallback storage.
 */
export async function getCategories(): Promise<Category[]> {
  const { db, status } = initFirebase();

  if (status.isConfigured && db) {
    try {
      const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
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
        return JSON.parse(saved);
      } catch {}
    }
  }
  return [...INITIAL_CATEGORIES];
}

/**
 * Loads artworks from Firestore or fallback storage.
 */
export async function getArtworks(includeUnpublished = false): Promise<Artwork[]> {
  const { db, status } = initFirebase();

  if (status.isConfigured && db) {
    try {
      let q = collection(db, 'artworks');
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
 */
export async function deleteArtwork(artworkId: string): Promise<void> {
  const { db, storage, status } = initFirebase();

  if (status.isConfigured && db) {
    try {
      if (storage) {
        try {
          const storageReference = ref(storage, `artworks/${artworkId}/original`);
          await deleteObject(storageReference);
        } catch {}
      }
      await deleteDoc(doc(db, 'artworks', artworkId));
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `artworks/${artworkId}`);
    }
  }

  const current = await getArtworks(true);
  const filtered = current.filter(a => a.id !== artworkId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(filtered));
  }
}

/**
 * Uploads an artwork image file:
 * - Validates file format (PNG, JPG, JPEG, WebP)
 * - Validates file size (max 10MB)
 * - Computes image dimensions
 * - Uploads to Firebase Storage if configured, or converts to Data URL for local preview
 */
export async function uploadArtworkImage(
  artworkId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ imageUrl: string; storagePath?: string; width: number; height: number }> {
  // Validate format
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file format. Please upload a PNG, JPG, or WebP image.');
  }

  // Validate size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File is too large. Maximum allowed size is 10 MB.');
  }

  // Load image to verify dimensions
  const { width, height, dataUrl } = await new Promise<{
    width: number;
    height: number;
    dataUrl: string;
  }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight, dataUrl: result });
      };
      img.onerror = () => reject(new Error('Failed to read image file data.'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

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

  // Fallback to data URL
  onProgress?.(100);
  return { imageUrl: dataUrl, width, height };
}
