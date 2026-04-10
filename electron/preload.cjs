const { contextBridge } = require('electron');

// We can expose protected APIs to the renderer process here
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
