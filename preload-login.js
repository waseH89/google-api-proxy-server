// preload-login.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loginAPI', {
    authGoogle: () => ipcRenderer.send('login:google')
});
