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
  // Using fixed size window
  const transparentWindow = new BrowserWindow({
    width: 600,
    height: 600,
    transparent: true,
    frame: false,
    resizable: false, // Changed to false to prevent resizing
    skipTaskbar: true,
    hasShadow: false,
    // Disable resize animation to prevent momentary jumps
    animateAppIcon: false,
    autoHideMenuBar: true,
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
      const offsetX = Number(args.offsetX || 0);
      const offsetY = Number(args.offsetY || 0);
      
      // Validate that all values are numbers
      if (isNaN(mouseX) || isNaN(mouseY)) {
        console.error('Invalid coordinates in window:drag', args);
        return;
      }
      
      const webContents = event.sender;
      const win = BrowserWindow.fromWebContents(webContents);
      if (!win) return;
      
      // Get current position
      const [x, y] = win.getPosition();
      
      // Set the window position - using the mouse position and optional offsets
      win.setPosition(x + offsetX, y + offsetY);
    } catch (error) {
      console.error('Error in window:drag handler:', error);
    }
  });

  // Handle window resize - disabled since we're keeping window size fixed
  ipcMain.on('window:resize', (event) => {
    // Nothing to do - window is non-resizable
    return;
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