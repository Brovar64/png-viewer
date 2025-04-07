const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('transparentWindow', {
  loadImage: (callback) => {
    ipcRenderer.on('load-image', (_, data) => callback(data));
  },
  startDrag: () => ipcRenderer.sendSync('window:dragStart'),
  drag: (mouseX, mouseY, offsetX, offsetY) => 
    ipcRenderer.send('window:drag', { 
      mouseX: Number(mouseX), 
      mouseY: Number(mouseY), 
      offsetX: Number(offsetX), 
      offsetY: Number(offsetY) 
    }),
  // Simple resize method - only used for initial window sizing
  resizeWindow: (width, height) => 
    ipcRenderer.send('window:resize', {
      width: Number(width),
      height: Number(height)
    }),
  close: () => ipcRenderer.send('window:close')
});