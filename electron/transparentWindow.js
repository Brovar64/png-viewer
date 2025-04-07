const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

let transparentWindows = new Map();

// Store image data temporarily
const imageDataCache = new Map();

function createTransparentWindow(imagePath, imageId) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Create a new BrowserWindow with transparent background and no frame
  const transparentWindow = new BrowserWindow({
    width: 600,
    height: 600,
    transparent: true,
    frame: false,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    useContentSize: true,  // Important: use content size for accurate resizing
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preloadTransparent.js')
    }
  });

  // Position the window in the center of the screen
  transparentWindow.setPosition(
    Math.floor(width / 2 - 300),
    Math.floor(height / 2 - 300)
  );

  // Disable window size constraints
  transparentWindow.setMinimumSize(100, 100);
  transparentWindow.setMaximumSize(10000, 10000);

  // Load the transparent window HTML
  transparentWindow.loadURL(
    isDev
      ? 'http://localhost:3000/transparent.html'
      : `file://${path.join(__dirname, '../build/transparent.html')}`
  );

  // Store the window reference
  transparentWindows.set(imagePath, transparentWindow);
  
  // When window is ready, send the image data
  transparentWindow.webContents.on('did-finish-load', () => {
    // Get the image data from cache
    const imageData = imageDataCache.get(imageId);
    if (!imageData) {
      console.error('Image data not found in cache:', imageId);
      return;
    }
    
    transparentWindow.webContents.send('load-image', {
      imageData,
      imagePath
    });
    
    // Remove from cache after sending
    imageDataCache.delete(imageId);
  });

  // Remove window reference when closed
  transparentWindow.on('closed', () => {
    transparentWindows.delete(imagePath);
  });

  return transparentWindow;
}

function setupTransparentWindowHandlers() {
  // Handle opening a transparent window
  ipcMain.handle('window:openTransparent', async (_, imagePath, imageData) => {
    // If window for this image already exists, focus it instead of creating a new one
    if (transparentWindows.has(imagePath)) {
      transparentWindows.get(imagePath).focus();
      return { success: true };
    }
    
    try {
      // Generate a unique ID for this image data
      const imageId = Date.now().toString();
      
      // Store the image data in cache
      imageDataCache.set(imageId, imageData);
      
      // Create the window with a reference to the cached data
      createTransparentWindow(imagePath, imageId);
      return { success: true };
    } catch (error) {
      console.error('Error creating transparent window:', error);
      return { success: false, error: error.message };
    }
  });

  // Alternative approach - read file directly in main process instead of passing base64 data
  ipcMain.handle('window:openTransparentFile', async (_, imagePath) => {
    // If window for this image already exists, focus it instead of creating a new one
    if (transparentWindows.has(imagePath)) {
      transparentWindows.get(imagePath).focus();
      return { success: true };
    }
    
    try {
      // Read the file directly
      const data = await fs.promises.readFile(imagePath);
      const imageId = Date.now().toString();
      const base64Data = `data:image/png;base64,${data.toString('base64')}`;
      
      // Store the image data in cache
      imageDataCache.set(imageId, base64Data);
      
      // Create window
      createTransparentWindow(imagePath, imageId);
      return { success: true };
    } catch (error) {
      console.error('Error creating transparent window:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle window dragging using manual positioning
  ipcMain.on('window:dragStart', (event) => {
    // Just acknowledge the drag start
    event.returnValue = true;
  });
  
  // Improved drag handler with more defensive checks and type coercion
  ipcMain.on('window:drag', (event, args) => {
    try {
      // Safety checks and number conversion
      if (!args || typeof args !== 'object') {
        console.error('Invalid argument format in window:drag');
        return;
      }
      
      const mouseX = Number(args.mouseX);
      const mouseY = Number(args.mouseY);
      const offsetX = Number(args.offsetX);
      const offsetY = Number(args.offsetY);
      
      // Validate that all values are numbers
      if (isNaN(mouseX) || isNaN(mouseY) || isNaN(offsetX) || isNaN(offsetY)) {
        console.error('Invalid coordinates in window:drag', args);
        return;
      }
      
      const webContents = event.sender;
      const win = BrowserWindow.fromWebContents(webContents);
      if (!win) return;
      
      // Set the window position based on mouse position and offset
      win.setPosition(Math.round(mouseX - offsetX), Math.round(mouseY - offsetY));
    } catch (error) {
      console.error('Error in window:drag handler:', error);
    }
  });

  // Handle window resize based on zoomed image dimensions
  ipcMain.on('window:resize', (event, args) => {
    try {
      if (!args || typeof args !== 'object') {
        console.error('Invalid argument format in window:resize');
        return;
      }
      
      let width = Number(args.width);
      let height = Number(args.height);
      const relativeX = Number(args.relativeX) || 0.5; // Default to center if not provided
      const relativeY = Number(args.relativeY) || 0.5; // Default to center if not provided
      
      // Validate dimensions
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        console.error('Invalid dimensions in window:resize', args);
        return;
      }
      
      // Validate relative position (should be between 0 and 1)
      if (isNaN(relativeX) || isNaN(relativeY) || 
          relativeX < 0 || relativeX > 1 || 
          relativeY < 0 || relativeY > 1) {
        console.error('Invalid relative position in window:resize', args);
        return;
      }
      
      const webContents = event.sender;
      const win = BrowserWindow.fromWebContents(webContents);
      if (!win) return;
      
      // Get screen constraints
      const { workAreaSize } = screen.getPrimaryDisplay();
      const maxScreenWidth = workAreaSize.width;
      const maxScreenHeight = workAreaSize.height;
      
      // Ensure window isn't larger than screen
      width = Math.min(width, maxScreenWidth);
      height = Math.min(height, maxScreenHeight);
      
      // Get current position and size
      const [currentX, currentY] = win.getPosition();
      const [currentWidth, currentHeight] = win.getSize();
      
      // Calculate new position to maintain the position under the mouse cursor
      // This makes zooming feel more natural
      const widthDiff = width - currentWidth;
      const heightDiff = height - currentHeight;
      
      // Move window based on the relative position (where the mouse is)
      // If mouse is in the center (0.5, 0.5), this will center the resize
      // If mouse is at the edge, it will maintain that edge's position
      const newX = Math.round(currentX - (widthDiff * relativeX));
      const newY = Math.round(currentY - (heightDiff * relativeY));
      
      // Make sure the window doesn't go off-screen
      const adjustedX = Math.max(0, Math.min(newX, maxScreenWidth - width));
      const adjustedY = Math.max(0, Math.min(newY, maxScreenHeight - height));
      
      // Apply the new size and position with animation disabled for smoother zooming
      win.setBounds({
        x: adjustedX,
        y: adjustedY,
        width: width,
        height: height
      }, false); // false disables animation for smoother zoom
    } catch (error) {
      console.error('Error in window:resize handler:', error);
    }
  });

  // Handle window close
  ipcMain.on('window:close', (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (win) {
      win.close();
    }
  });
}

module.exports = {
  setupTransparentWindowHandlers
};