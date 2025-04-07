const { contextBridge, ipcRenderer } = require('electron');

console.log('preload.js: Loading and exposing APIs');

// Expose specific Electron APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  openDirectory: async () => {
    console.log('preload.js: Invoking dialog:openDirectory');
    return await ipcRenderer.invoke('dialog:openDirectory');
  },
  
  readDirectory: async (path) => {
    console.log('preload.js: Invoking fs:readDirectory for', path);
    return await ipcRenderer.invoke('fs:readDirectory', path);
  },
  
  readFile: async (path) => {
    console.log('preload.js: Invoking fs:readFile for', path);
    return await ipcRenderer.invoke('fs:readFile', path);
  },
  
  openTransparentWindow: async (imagePath, imageData) => {
    console.log('preload.js: Invoking window:openTransparent for', imagePath);
    try {
      const result = await ipcRenderer.invoke('window:openTransparent', imagePath, imageData);
      return result;
    } catch (error) {
      console.error('Error opening transparent window:', error);
      throw error;
    }
  },
  
  openTransparentFile: async (imagePath) => {
    console.log('preload.js: Invoking window:openTransparentFile for', imagePath);
    try {
      const result = await ipcRenderer.invoke('window:openTransparentFile', imagePath);
      return result;
    } catch (error) {
      console.error('Error opening transparent file:', error);
      throw error;
    }
  }
});

console.log('preload.js: APIs exposed successfully');
