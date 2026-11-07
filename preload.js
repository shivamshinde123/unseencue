// Narrow bridge between the windows and the main process.
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  onSettings: (fn) => ipcRenderer.on('settings', (_e, s) => fn(s)),

  openScript: () => ipcRenderer.invoke('script:open'),
  lastScript: () => ipcRenderer.invoke('script:last'),
  saveDraft: (text) => ipcRenderer.invoke('script:draft', text),
  loadPath: (file) => ipcRenderer.invoke('script:load-path', file),
  pathForFile: (file) => { try { return webUtils.getPathForFile(file); } catch { return ''; } },
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  platform: process.platform,
  askMedia: (kind) => ipcRenderer.invoke('media:ask', kind),
  openPrivacy: (kind) => ipcRenderer.invoke('open:privacy', kind),
  onMenu: (fn) => ipcRenderer.on('menu', (_e, cmd) => fn(cmd)),
  sampleScript: () => ipcRenderer.invoke('script:sample'),
  savePosition: (key, fraction) => ipcRenderer.invoke('position:save', key, fraction),

  openSettings: () => ipcRenderer.invoke('window:settings'),
  close: () => ipcRenderer.invoke('window:close'),
  resetWindow: () => ipcRenderer.invoke('window:reset'),
  setHome: () => ipcRenderer.invoke('window:set-home'),
  getBounds: () => ipcRenderer.invoke('window:bounds'),
  setBounds: (b) => ipcRenderer.send('window:set-bounds', b),

  sendLevel: (db, talking, trigger) => ipcRenderer.send('voice:level', db, talking, trigger),
  onLevel: (fn) => ipcRenderer.on('voice:level', (_e, db, talking, trigger) => fn(db, talking, trigger)),

  captureTest: () => ipcRenderer.invoke('capture:test'),
  selftestDone: (report) => ipcRenderer.invoke('selftest:done', report),
  selftestPressPaste: (text) => ipcRenderer.invoke('selftest:press-paste', text),
});
