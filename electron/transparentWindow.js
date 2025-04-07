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
    width: 800,  // Larger default size for better viewing
    height: 600,
    transparent: true,
    frame: false,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preloadTransparent.js')
    }
  });

  // Position the window in the center of the screen
  transparentWindow.setPosition(
    Math.floor(width / 2 - 400),
    Math.floor(height / 2 - 300)
  );

  // Load the transparent window HTML
  const transparentHtmlPath = isDev
    ? 'http://localhost:3000/transparent.html'
    : `file://${path.join(__dirname, '../build/transparent.html')}`;
  
  console.log('Loading transparent window from:', transparentHtmlPath);
  transparentWindow.loadURL(transparentHtmlPath);

  // Store the window reference
  transparentWindows.set(imagePath, transparentWindow);
  
  // Open DevTools in development mode for debugging
  if (isDev) {
    transparentWindow.webContents.openDevTools({ mode: 'detach' });
  }
  
  // When window is ready, send the image data
  transparentWindow.webContents.on('did-finish-load', () => {
    console.log('Transparent window loaded, sending image data...');
    
    // Get the image data from cache
    const imageData = imageDataCache.get(imageId);
    if (!imageData) {
      console.error('Image data not found in cache:', imageId);
      return;
    }
    
    // Send the image data to the renderer
    console.log('Sending image data to renderer, length:', imageData.length);
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
  console.log('Setting up transparent window handlers');
  
  // Handle opening a transparent window
  ipcMain.handle('window:openTransparent', async (_, imagePath, imageData) => {
    console.log('Received request to open transparent window for:', imagePath);
    
    // If window for this image already exists, focus it instead of creating a new one
    if (transparentWindows.has(imagePath)) {
      console.log('Window already exists, focusing it');
      transparentWindows.get(imagePath).focus();
      return { success: true };
    }
    
    try {
      // Generate a unique ID for this image data
      const imageId = Date.now().toString();
      
      // Store the image data in cache
      console.log('Storing image data in cache, length:', imageData.length);
      imageDataCache.set(imageId, imageData);
      
      // Create the window with a reference to the cached data
      console.log('Creating transparent window');
      createTransparentWindow(imagePath, imageId);
      return { success: true };
    } catch (error) {
      console.error('Error creating transparent window:', error);
      return { success: false, error: error.message };
    }
  });

  // Alternative approach - read file directly in main process instead of passing base64 data
  ipcMain.handle('window:openTransparentFile', async (_, imagePath) => {
    console.log('Received request to open transparent file for:', imagePath);
    
    // If window for this image already exists, focus it instead of creating a new one
    if (transparentWindows.has(imagePath)) {
      console.log('Window already exists, focusing it');
      transparentWindows.get(imagePath).focus();
      return { success: true };
    }
    
    try {
      // Read the file directly
      console.log('Reading file from disk');
      const data = await fs.promises.readFile(imagePath);
      const imageId = Date.now().toString();
      const base64Data = `data:image/png;base64,${data.toString('base64')}`;
      
      // Store the image data in cache
      console.log('Storing image data in cache, length:', base64Data.length);
      imageDataCache.set(imageId, base64Data);
      
      // Create window
      console.log('Creating transparent window');
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

  // Handle window resize based on zoomed image dimensions (only used once for initial sizing)
  ipcMain.on('window:resize', (event, args) => {
    try {
      if (!args || typeof args !== 'object') {
        console.error('Invalid argument format in window:resize');
        return;
      }
      
      let width = Number(args.width);
      let height = Number(args.height);
      
      // Validate dimensions
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        console.error('Invalid dimensions in window:resize', args);
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
      
      // Get current position
      const [currentX, currentY] = win.getPosition();
      
      // Calculate center position
      const newX = Math.max(0, Math.floor(currentX - (width - win.getSize()[0]) / 2));
      const newY = Math.max(0, Math.floor(currentY - (height - win.getSize()[1]) / 2));
      
      // Apply the new size and position
      win.setBounds({
        x: newX,
        y: newY,
        width: width,
        height: height
      });
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