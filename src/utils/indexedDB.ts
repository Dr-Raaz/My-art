/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'KidsColoringStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'artwork_progress';

export interface SavedArtworkProgress {
  artworkId: string;
  paintDataUrl: string; // Base64 data URL of the paint layer
  previewDataUrl?: string; // Base64 composite preview (white bg + paint + outlines)
  paintedPercentage?: number; // Approximate coverage 0-100%
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'artworkId' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Saves child's coloring paint layer, composite preview, and coverage for an artwork ID.
 */
export async function saveColoringProgress(
  artworkId: string,
  paintDataUrl: string,
  previewDataUrl?: string,
  paintedPercentage?: number
): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record: SavedArtworkProgress = {
        artworkId,
        paintDataUrl,
        previewDataUrl,
        paintedPercentage,
        updatedAt: Date.now(),
      };
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not save progress to IndexedDB:', err);
  }
}

/**
 * Loads child's saved coloring paint layer for an artwork ID.
 */
export async function loadColoringProgress(
  artworkId: string
): Promise<SavedArtworkProgress | null> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(artworkId);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not load progress from IndexedDB:', err);
    return null;
  }
}

/**
 * Clears saved coloring progress for a specific artwork.
 */
export async function clearColoringProgress(artworkId: string): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(artworkId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not clear progress in IndexedDB:', err);
  }
}

/**
 * Gets a list of all artwork IDs that have saved progress.
 */
export async function getSavedArtworkIds(): Promise<string[]> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = () => {
        resolve((request.result as string[]) || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Loads all saved artwork progress entries mapped by artworkId.
 * Fast, single-transaction retrieval for gallery view without individual queries.
 */
export async function getAllSavedProgress(): Promise<Record<string, SavedArtworkProgress>> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const list = (request.result as SavedArtworkProgress[]) || [];
        const map: Record<string, SavedArtworkProgress> = {};
        for (const item of list) {
          if (item && item.artworkId) {
            map[item.artworkId] = item;
          }
        }
        resolve(map);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not load all progress from IndexedDB:', err);
    return {};
  }
}
