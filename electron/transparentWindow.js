const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

let transparentWindows = new Map();

// Store image data temporarily
const imageDataCache = new Map();

function createTransparentWindow(imagePath, imageId) {
  console.log(`Creating transparent window for: ${imagePath} with ID: ${imageId}`);
  
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Create a new BrowserWindow with transparent background and no frame
  // Using larger default size for better viewing experience
  const transparentWindow = new BrowserWindow({
    width: Math.min(800, width * 0.8),
    height: Math.min(800, height * 0.8),
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preloadTransparent.js')
    }
  });

  // Position the window in the center of the screen
  transparentWindow.setPosition(
    Math.floor(width / 2 - transparentWindow.getBounds().width / 2),
    Math.floor(height / 2 - transparentWindow.getBounds().height / 2)
  );

  const htmlPath = isDev
    ? 'http://localhost:3000/transparent.html'
    : `file://${path.join(__dirname, '../build/transparent.html')}`;
  
  console.log(`Loading transparent window HTML from: ${htmlPath}`);

  // Load the transparent window HTML
  transparentWindow.loadURL(htmlPath);

  // Store the window reference
  transparentWindows.set(imagePath, transparentWindow);
  
  // When window is ready, send the image data
  transparentWindow.webContents.on('did-finish-load', () => {
    console.log(`Transparent window loaded for: ${imagePath}`);
    
    // Get the image data from cache
    const imageData = imageDataCache.get(imageId);
    if (!imageData) {
      console.error('Image data not found in cache:', imageId);
      return;
    }
    
    console.log(`Sending image data to transparent window: ${imagePath}`);
    transparentWindow.webContents.send('load-image', {
      imageData,
      imagePath
    });
    
    // Remove from cache after sending
    imageDataCache.delete(imageId);
  });

  // Remove window reference when closed
  transparentWindow.on('closed', () => {
    console.log(`Transparent window closed for: ${imagePath}`);
    transparentWindows.delete(imagePath);
  });

  return transparentWindow;
}

function setupTransparentWindowHandlers() {
  console.log('Setting up transparent window handlers');
  
  // Handle opening a transparent window
  ipcMain.handle('window:openTransparent', async (_, imagePath, imageData) => {
    console.log(`Received request to open transparent window for: ${imagePath}`);
    
    // If window for this image already exists, focus it instead of creating a new one
    if (transparentWindows.has(imagePath)) {
      console.log(`Focusing existing transparent window for: ${imagePath}`);
      transparentWindows.get(imagePath).focus();
      return { success: true };
    }
    
    try {
      // Generate a unique ID for this image data
      const imageId = Date.now().toString();
      
      // Store the image data in cache
      imageDataCache.set(imageId, imageData);
      console.log(`Stored image data in cache with ID: ${imageId}`);
      
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
    console.log(`Received request to open transparent window for file: ${imagePath}`);
    
    // If window for this image already exists, focus it instead of creating a new one
    if (transparentWindows.has(imagePath)) {
      console.log(`Focusing existing transparent window for: ${imagePath}`);
      transparentWindows.get(imagePath).focus();
      return { success: true };
    }
    
    try {
      // Read the file directly
      console.log(`Reading file: ${imagePath}`);
      const data = await fs.promises.readFile(imagePath);
      const imageId = Date.now().toString();
      const base64Data = `data:image/png;base64,${data.toString('base64')}`;
      
      // Store the image data in cache
      imageDataCache.set(imageId, base64Data);
      console.log(`Stored file data in cache with ID: ${imageId}`);
      
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
    console.log('Starting window drag');
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

  // Handle window close
  ipcMain.on('window:close', (event) => {
    console.log('Closing transparent window');
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (win) {
      win.close();
    }
  });
  
  console.log('Transparent window handlers setup complete');
}

module.exports = {
  setupTransparentWindowHandlers
};