const { contextBridge, ipcRenderer } = require('electron');

// Log that this file is being loaded
console.log('preloadTransparent.js is being loaded');

// Expose specific Electron APIs to the renderer process
contextBridge.exposeInMainWorld('transparentWindow', {
  loadImage: (callback) => {
    console.log('Setting up loadImage callback');
    ipcRenderer.on('load-image', (_, data) => {
      console.log('Received load-image event with data:', data.imagePath);
      callback(data);
    });
  },
  startDrag: () => {
    console.log('Starting window drag');
    return ipcRenderer.sendSync('window:dragStart');
  },
  drag: (mouseX, mouseY, offsetX, offsetY) => {
    // Convert all values to numbers for consistency
    const args = { 
      mouseX: Number(mouseX), 
      mouseY: Number(mouseY), 
      offsetX: Number(offsetX), 
      offsetY: Number(offsetY) 
    };
    ipcRenderer.send('window:drag', args);
  },
  close: () => {
    console.log('Closing window');
    ipcRenderer.send('window:close');
  }
});

console.log('preloadTransparent.js APIs exposed:', ['loadImage', 'startDrag', 'drag', 'close']);
