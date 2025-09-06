const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Fungsi yang sudah ada
  onShowPage: (callback) => ipcRenderer.on('show-page', (_event, reason, message) => callback(reason, message)),
  closeWindow: () => ipcRenderer.send('close-subscription-window'),
  
  // Fungsi baru untuk pembayaran
  createTransaction: (productId, price) => ipcRenderer.invoke('payment:create-transaction', productId, price)
});