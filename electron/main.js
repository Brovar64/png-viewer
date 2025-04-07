const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const { setupTransparentWindowHandlers } = require('./transparentWindow');

// Disable GPU acceleration to prevent GPU process errors
app.disableHardwareAcceleration();

let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  console.log('Creating main application window');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const loadUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;
    
  console.log(`Loading main window URL: ${loadUrl}`);
  mainWindow.loadURL(loadUrl);

  if (isDev) {
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
    console.log('DevTools opened for main window');
  }

  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });
}

/**
 * Initialize all IPC handlers
 */
function setupIPCHandlers() {
  console.log('Setting up main process IPC handlers');

  // Directory selection dialog
  ipcMain.handle('dialog:openDirectory', async (event) => {
    console.log('Handling dialog:openDirectory request');
    const sender = event.sender;
    const win = sender ? BrowserWindow.fromWebContents(sender) : mainWindow;
    
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
    
    if (canceled) {
      console.log('Directory selection canceled');
      return { canceled };
    }
    
    console.log(`Directory selected: ${filePaths[0]}`);
    return { canceled, filePath: filePaths[0] };
  });

  // Read directory contents
  ipcMain.handle('fs:readDirectory', async (_, directoryPath) => {
    console.log(`Reading directory: ${directoryPath}`);
    try {
      const files = await fs.promises.readdir(directoryPath);
      const pngFiles = [];
      
      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.promises.stat(filePath);
        
        if (stats.isFile() && file.toLowerCase().endsWith('.png')) {
          pngFiles.push({
            name: file,
            path: filePath,
            size: stats.size
          });
        }
      }
      
      console.log(`Found ${pngFiles.length} PNG files in ${directoryPath}`);
      return pngFiles;
    } catch (err) {
      console.error('Failed to read directory:', err);
      throw err;
    }
  });

  // Read file contents
  ipcMain.handle('fs:readFile', async (_, filePath) => {
    console.log(`Reading file: ${filePath}`);
    try {
      const data = await fs.promises.readFile(filePath);
      console.log(`File read successfully: ${filePath} (${data.length} bytes)`);
      return data.toString('base64');
    } catch (err) {
      console.error('Failed to read file:', err);
      throw err;
    }
  });

  // Setup transparent window handlers
  console.log('Initializing transparent window handlers');
  setupTransparentWindowHandlers();

  // Log registered handlers
  const mainHandlers = ['dialog:openDirectory', 'fs:readDirectory', 'fs:readFile'];
  const windowHandlers = ['window:openTransparent', 'window:openTransparentFile', 'window:dragStart', 'window:drag', 'window:close'];
  
  console.log('Main process handlers:', mainHandlers);
  console.log('Window handlers:', windowHandlers);
  console.log('All registered IPC handlers:', ipcMain.eventNames());
}

// Wait for app to be ready
app.whenReady().then(() => {
  console.log('Electron app is ready');
  
  // Setup IPC handlers first
  setupIPCHandlers();
  
  // Then create the window
  createWindow();
  
  // Check handlers after everything is initialized
  console.log('IPC handlers after initialization:', ipcMain.eventNames());
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (mainWindow === null) {
    createWindow();
  }
});

// Log any uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});