const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

let transparentWindows = new Map();

// Store image data temporarily
const imageDataCache = new Map();

// Find the bounding box of non-transparent pixels in the image
async function findBoundingBox(imagePath) {
  try {
    // Load the image
    const img = await loadImage(imagePath);
    
    // Create a canvas with the image dimensions
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0);
    
    // Get the image data
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const { data, width, height } = imageData;
    
    // Find the boundaries of non-transparent pixels
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasNonTransparentPixels = false;
    
    // Loop through all pixels to find non-transparent ones
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Check alpha value (non-transparent)
        if (data[idx + 3] > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          hasNonTransparentPixels = true;
        }
      }
    }
    
    return hasNonTransparentPixels ? {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    } : null;
  } catch (error) {
    console.error('Error finding bounding box:', error);
    return null;
  }
}

function createTransparentWindow(imagePath, imageId, boundingBox) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Calculate window dimensions based on the bounding box with padding
  const padding = 20; // Padding around the non-transparent content
  
  // Use bounding box dimensions if available, otherwise use defaults
  const windowWidth = boundingBox 
    ? Math.min(window.screen.availWidth * 0.9, boundingBox.width + padding * 2) 
    : 600;
  const windowHeight = boundingBox 
    ? Math.min(window.screen.availHeight * 0.9, boundingBox.height + padding * 2) 
    : 600;
  
  // Create a new BrowserWindow with transparent background and no frame
  // Using calculated size for better zooming experience
  const transparentWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    transparent: true,
    frame: false,
    resizable: true,
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

  // Add red outline to the window
  transparentWindow.setBackgroundColor('#FF000000'); // Transparent background with red tint
  
  // Position the window in the center of the screen
  transparentWindow.setPosition(
    Math.floor(width / 2 - windowWidth / 2),
    Math.floor(height / 2 - windowHeight / 2)
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
      imagePath,
      boundingBox
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
      
      // Find the bounding box of non-transparent pixels
      const boundingBox = await findBoundingBox(imagePath);
      
      // Create the window with a reference to the cached data
      createTransparentWindow(imagePath, imageId, boundingBox);
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
      
      // Find the bounding box of non-transparent pixels
      const boundingBox = await findBoundingBox(imagePath);
      
      // Store the image data in cache
      imageDataCache.set(imageId, base64Data);
      
      // Create window
      createTransparentWindow(imagePath, imageId, boundingBox);
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
  
  // Improved drag handler to prevent size changes during dragging
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
      
      // Get current position and size
      const [x, y] = win.getPosition();
      const currentSize = win.getSize();
      
      // Set the window position explicitly
      win.setPosition(x + offsetX, y + offsetY);
      
      // Force the size to remain constant - this is critical to prevent size creep
      win.setSize(currentSize[0], currentSize[1]);
    } catch (error) {
      console.error('Error in window:drag handler:', error);
    }
  });

  // New handler for explicit size reset (used to prevent size creep during dragging)
  ipcMain.on('window:resetSize', (event, { width, height }) => {
    try {
      const webContents = event.sender;
      const win = BrowserWindow.fromWebContents(webContents);
      if (!win) return;
      
      // Ensure values are numbers and have minimums
      const newWidth = Math.max(200, Number(width) || 600);
      const newHeight = Math.max(200, Number(height) || 600);
      
      // Get current position
      const [x, y] = win.getPosition();
      
      // Force an exact size with setBounds (no animation)
      win.setBounds({
        x: x,
        y: y,
        width: newWidth,
        height: newHeight
      }, false); // false = no animation
    } catch (error) {
      console.error('Error in window:resetSize handler:', error);
    }
  });

  // Handle window resize with combined position adjustment
  ipcMain.on('window:resize', (event, { width, height, keepCentered = true }) => {
    try {
      const webContents = event.sender;
      const win = BrowserWindow.fromWebContents(webContents);
      if (!win) return;
      
      // Ensure values are numbers and have minimums
      const newWidth = Math.max(200, Number(width) || 600);
      const newHeight = Math.max(200, Number(height) || 600);
      
      // Calculate position adjustments to maintain the same center
      if (keepCentered) {
        // Get current position and size
        const [x, y] = win.getPosition();
        const [oldWidth, oldHeight] = win.getSize();
        
        // Calculate position deltas to maintain center point
        const deltaX = Math.floor((newWidth - oldWidth) / 2);
        const deltaY = Math.floor((newHeight - oldHeight) / 2);
        
        // Set new position and size simultaneously to prevent flicker
        win.setBounds({
          x: x - deltaX,
          y: y - deltaY,
          width: newWidth,
          height: newHeight
        }, true); // true = animate (but animation is disabled in window config)
      } else {
        // Just resize without repositioning
        win.setSize(Math.round(newWidth), Math.round(newHeight));
      }
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