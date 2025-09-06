const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  generateImage: (prompt, aspectRatio, style, negativePrompt) => ipcRenderer.invoke('generate-image', prompt, aspectRatio, style, negativePrompt),
  downloadImage: (dataUrl) => ipcRenderer.invoke('download-image', dataUrl)
});