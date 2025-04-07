const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const { setupTransparentWindowHandlers } = require('./transparentWindow');

// Disable GPU acceleration to prevent GPU process errors
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    // Uncomment this line if you need DevTools
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupTransparentWindowHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (canceled) {
    return { canceled };
  }
  
  return { canceled, filePath: filePaths[0] };
});

ipcMain.handle('fs:readDirectory', async (_, directoryPath) => {
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
    
    return pngFiles;
  } catch (err) {
    console.error('Failed to read directory:', err);
    throw err;
  }
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try {
    const data = await fs.promises.readFile(filePath);
    return data.toString('base64');
  } catch (err) {
    console.error('Failed to read file:', err);
    throw err;
  }
});