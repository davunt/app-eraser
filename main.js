// Modules to control application life and create native browser window
const {
  app, BrowserWindow, dialog, ipcMain,
} = require('electron');
const path = require('path');

const env = process.env.NODE_ENV;
if (env === 'development') {
  // eslint-disable-next-line
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
  });
}

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile('src/index/index.html');

  if (env === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('selectAppFromFinder', async () => {
  try {
    const selection = await dialog.showOpenDialog({
      defaultPath: '/Applications',
      buttonLabel: 'Select',
      filters: [
        { name: 'Apps', extensions: ['.app'] },
      ],
      properties: ['openFile'],
    });

    if (!selection.canceled) {
      const selectedFilePath = selection.filePaths[0];
      mainWindow.webContents.send('selectAppFromFinder', selectedFilePath);
    }
  } catch (err) {
    console.error(err);
  }
});
