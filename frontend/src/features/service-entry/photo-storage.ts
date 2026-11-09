const SERVICE_ENTRY_PHOTO_DB = 'rkm-service-entry-photo-store-v1';

const openPhotoDb = (): Promise<IDBDatabase> =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Este navegador não oferece armazenamento local para fotos.'));
      return;
    }

    const request = window.indexedDB.open(SERVICE_ENTRY_PHOTO_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('photos')) {
        request.result.createObjectStore('photos');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Não foi possível abrir o armazenamento de fotos.'));
  });

const runPhotoTransaction = (
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => void,
  errorMessage: string,
): Promise<void> =>
  openPhotoDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('photos', mode);
        operation(transaction.objectStore('photos'));
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error || new Error(errorMessage));
        };
      }),
  );

export const storeServiceEntryPhoto = (id, file) =>
  runPhotoTransaction(
    'readwrite',
    (store) => store.put(file, id),
    'Não foi possível salvar a foto.',
  );

export const deleteServiceEntryPhoto = (id) =>
  runPhotoTransaction('readwrite', (store) => store.delete(id), 'Não foi possível remover a foto.');
