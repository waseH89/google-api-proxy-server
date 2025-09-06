const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendToken: (token) => {
        ipcRenderer.send('google-login-token', token);
    }
});