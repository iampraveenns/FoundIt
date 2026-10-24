/**
 * IndexedDB Offline Draft Queue for FoundIt
 * Allows users to draft found item reports even without internet connection,
 * storing them locally and automatically syncing them when connectivity returns.
 */

export interface OfflineDraft {
  id: string;
  itemName: string;
  category: string;
  color: string;
  locationName: string;
  lat: number;
  lng: number;
  description: string;
  searchTags: string[];
  claimQuestion: string;
  imageUrl: string;
  timestamp: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
}

const DB_NAME = 'FoundIt_Offline_DB';
const DB_VERSION = 1;
const STORE_NAME = 'item_drafts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineDraftStore = {
  async saveDraft(draft: Omit<OfflineDraft, 'id' | 'timestamp' | 'syncStatus'>): Promise<OfflineDraft> {
    const db = await openDB();
    const newDraft: OfflineDraft = {
      ...draft,
      id: 'draft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      syncStatus: 'pending',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(newDraft);

      req.onsuccess = () => resolve(newDraft);
      req.onerror = () => reject(req.error);
    });
  },

  async getAllDrafts(): Promise<OfflineDraft[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB unavailable:', e);
      return [];
    }
  },

  async removeDraft(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async syncAllPending(
    onItemSynced?: (item: any) => void
  ): Promise<{ syncedCount: number; errors: number }> {
    const drafts = await this.getAllDrafts();
    const pending = drafts.filter((d) => d.syncStatus === 'pending');
    let syncedCount = 0;
    let errors = 0;

    for (const draft of pending) {
      try {
        const formData = new FormData();
        formData.append('imageUrlInput', draft.imageUrl);
        formData.append('textNote', `${draft.itemName} - ${draft.description}`);
        formData.append('locationName', draft.locationName);
        formData.append('lat', String(draft.lat));
        formData.append('lng', String(draft.lng));
        formData.append('reportedBy', 'Citizen (Synced Offline Draft)');

        const res = await fetch('/api/items/found', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          await this.removeDraft(draft.id);
          syncedCount++;
          if (onItemSynced) onItemSynced(data.item);
        } else {
          errors++;
        }
      } catch (err) {
        errors++;
      }
    }

    return { syncedCount, errors };
  },
};
