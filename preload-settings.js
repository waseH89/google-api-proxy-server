const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {
  getHotkeys: () => ipcRenderer.invoke('get-hotkeys'),
  setHotkeys: (hotkeys) => ipcRenderer.invoke('set-hotkeys', hotkeys),
  getAccountInfo: () => ipcRenderer.invoke('get-account-info'),
  logout: () => ipcRenderer.send('logout'),
});
