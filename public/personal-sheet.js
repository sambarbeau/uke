// Older songbooks saved personal PDFs in IndexedDB. Keep an explicit download
// for an existing file without opening documents during practice.
export function savedSheetLink(container) {
  let revision = 0, url;
  return async id => {
    const current = ++revision;
    container.replaceChildren();
    if (url) { URL.revokeObjectURL(url); url = undefined; }
    try {
      const file = await new Promise((resolve,reject) => {
        const open = indexedDB.open('ukulele-music',1);
        open.onupgradeneeded = () => open.result.createObjectStore('sheets');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result, tx = db.transaction('sheets');
          const read = tx.objectStore('sheets').get(id);
          tx.oncomplete = () => { db.close(); resolve(read.result); };
          tx.onabort = () => { db.close(); reject(tx.error); };
        };
      });
      if (current !== revision || !file) return;
      const link = document.createElement('a');
      url = URL.createObjectURL(file instanceof Blob ? file : new Blob([file.bytes],{type:'application/pdf'}));
      link.href = url; link.download = file.name || 'song.pdf'; link.textContent = 'Saved PDF';
      container.append(link);
    } catch { /* Practice also works with browser storage disabled. */ }
  };
}
