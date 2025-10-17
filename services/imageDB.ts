const DB_NAME = 'landscaping-images-db';
const STORE_NAME = 'images';
const DB_VERSION = 1;

interface StoredImage {
  id: string;
  base64: string;
  type: string;
}

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const getStore = (mode: IDBTransactionMode): Promise<IDBObjectStore> => {
  return initDB().then(dbInstance => {
    const transaction = dbInstance.transaction(STORE_NAME, mode);
    return transaction.objectStore(STORE_NAME);
  });
};

export const saveImage = async (image: StoredImage): Promise<void> => {
  const store = await getStore('readwrite');
  const request = store.put(image);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getImage = async (id: string): Promise<StoredImage | undefined> => {
  const store = await getStore('readonly');
  const request = store.get(id);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteImage = async (id: string): Promise<void> => {
  const store = await getStore('readwrite');
  const request = store.delete(id);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
