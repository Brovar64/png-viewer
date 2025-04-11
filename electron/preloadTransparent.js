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
  // Added keepCentered param to control centering behavior
  resize: (width, height, keepCentered = true) => 
    ipcRenderer.send('window:resize', { 
      width: Number(width), 
      height: Number(height),
      keepCentered: keepCentered
    }),
  // Method to resize and position in one operation
  resizeAndPosition: (width, height, x, y) =>
    ipcRenderer.send('window:resizeAndPosition', {
      width: Number(width),
      height: Number(height),
      x: Number(x),
      y: Number(y)
    }),
  // New optimized setBounds method
  setBounds: (width, height, x, y) =>
    ipcRenderer.send('window:setBounds', {
      width: Number(width),
      height: Number(height),
      x: Number(x),
      y: Number(y)
    }),
  close: () => ipcRenderer.send('window:close')
});