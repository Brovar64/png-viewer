const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('transparentWindow', {
  loadImage: (callback) => {
    ipcRenderer.on('load-image', (_, data) => callback(data));
  },
  startDrag: () => ipcRenderer.sendSync('window:dragStart'),
  // Fix the drag method to ensure all parameters are converted to numbers
  drag: (mouseX, mouseY, offsetX, offsetY) => 
    ipcRenderer.send('window:drag', { 
      mouseX: Number(mouseX), 
      mouseY: Number(mouseY), 
      offsetX: Number(offsetX), 
      offsetY: Number(offsetY) 
    }),
  // Added resetSize method to force window size reset after drag operations
  resetSize: (width, height) => 
    ipcRenderer.send('window:resetSize', { 
      width: Number(width), 
      height: Number(height)
    }),
  // Added keepCentered param to control centering behavior
  resize: (width, height, keepCentered = true) => 
    ipcRenderer.send('window:resize', { 
      width: Number(width), 
      height: Number(height),
      keepCentered: keepCentered
    }),
  close: () => ipcRenderer.send('window:close')
});