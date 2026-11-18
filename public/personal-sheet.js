// Each attached sheet belongs to one song and one browser origin.
function storeAction(method, ...args) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('ukulele-music', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('sheets');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('sheets', method === 'get' ? 'readonly' : 'readwrite');
      const request = tx.objectStore('sheets')[method](...args);
      tx.oncomplete = () => { db.close(); resolve(request.result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
}

export function makePersonalSheet() {
  const $ = id => document.getElementById(id);
  let song, activeUrl, revision = 0;
  const memory = new Map();
  function close() {
    revision++;
    $('attached-sheet').replaceChildren();
    if (activeUrl) URL.revokeObjectURL(activeUrl);
    activeUrl = null; $('pdf-file').value = ''; $('sheet-status').textContent = '';
  }
  function displayFile(file) {
    if (activeUrl) URL.revokeObjectURL(activeUrl);
    activeUrl = URL.createObjectURL(new Blob([file],{type:'application/pdf'}));
    const link = document.createElement('a');
    link.href = activeUrl; link.textContent = 'Open ' + file.name; link.target = '_blank'; link.rel = 'noopener';
    const frame = document.createElement('iframe');
    frame.title = 'Personal score for ' + song.title; frame.src = activeUrl;
    const remove = document.createElement('button');
    remove.textContent = 'Remove from songbook';
    remove.onclick = async () => {
      const id = song.id, stamp = ++revision;
      memory.delete(id);
      try {
        await storeAction('delete',id);
        if (revision === stamp) { close(); $('sheet-label').textContent = 'Choose PDF'; $('sheet-status').textContent = 'Sheet removed.'; }
      } catch { if (revision === stamp) $('sheet-status').textContent = 'Couldn’t remove the saved sheet. Try again.'; }
    };
    $('attached-sheet').replaceChildren(link,frame,remove);
    $('sheet-label').textContent = 'Replace PDF';
  }
  async function sheet(current) {
    close(); song = current;
    document.querySelector('.personal-sheet').open = false;
    $('sheet-label').textContent = 'Choose PDF';
    const stamp = revision;
    try {
      const file = memory.get(song.id) || await storeAction('get',song.id);
      if (stamp === revision && file) {
        const pdf = file instanceof Blob ? file : new File([file.bytes],file.name,{type:'application/pdf'});
        displayFile(pdf);
        document.querySelector('.personal-sheet').open = true;
      }
    } catch { /* A fresh file still works when browser storage is unavailable. */ }
  }
  $('pdf-file').onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const stamp = ++revision, id = song.id;
    if (file.size > 25 * 1024 * 1024 || !(await file.slice(0,1024).text()).includes('%PDF-')) {
      if (stamp === revision) $('sheet-status').textContent = 'Choose a PDF under 25 MB.';
      return;
    }
    if (stamp !== revision) return;
    memory.set(id,file); displayFile(file);
    try {
      await storeAction('put',{ name:file.name, bytes:await file.arrayBuffer() },id);
      if (stamp === revision) $('sheet-status').textContent = 'Saved in this browser.';
    } catch { if (stamp === revision) $('sheet-status').textContent = 'Available for this visit. Browser storage is unavailable.'; }
  };
  return { close, sheet };
}
