// Modules to control application life and create native browser window
const {
  app, Menu, BrowserWindow, dialog, ipcMain, shell,
} = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { issuesURL, releasesURL } = require('./utils/constants');

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
    titleBarStyle: 'hidden',
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

  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    width: 500,
    height: 400,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  aboutWindow.loadFile('src/about/index.html');

  if (env === 'development') {
    aboutWindow.webContents.openDevTools();
  }

  aboutWindow.webContents.on('did-finish-load', () => {
    aboutWindow.webContents.send('appVersion', app.getVersion());
  });
}

function createPermissionErrorWindow() {
  const permissionErrorWindow = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  permissionErrorWindow.loadFile('src/permissions/index.html');

  if (env === 'development') {
    permissionErrorWindow.webContents.openDevTools();
  }
}

const mainMenuTemplate = [
  {
    label: app.name,
    submenu: [
      {
        label: 'About',
        click() {
          createAboutWindow();
        },
      },
      {
        label: 'Quit',
        accelerator: 'Cmd+Q',
        click() {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Check For Updates',
        click() {
          shell.openExternal(releasesURL);
        },
      },
      {
        label: 'Report Issue',
        click() {
          shell.openExternal(issuesURL);
        },
      },
      {
        label: 'Permissions',
        click() {
          createPermissionErrorWindow();
        },
      },
      {
        label: 'Open Dev Tools',
        accelerator: 'Cmd+Alt+I',
        click() {
          mainWindow.webContents.openDevTools();
        },
      },
    ],
  },
];

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

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function handleError(message) {
  try {
    dialog.showErrorBox(
      'An error occurred',
      message,
    );
  } catch (err) {
    console.error(err);
  }
}

ipcMain.on('handleError', (e, message) => {
  handleError(message);
});

ipcMain.handle('selectAppFromFinder', async () => {
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
      return selectedFilePath;
    }
    return false;
  } catch (err) {
    console.error(err);
    handleError(err.message);
    return err;
  }
});

ipcMain.handle('confirmDialog', async (e, message, detail) => {
  try {
    console.log(detail);
    return dialog.showMessageBox({
      message,
      detail,
      type: 'question',
      buttons: ['Yes', 'No'],
    });
  } catch (err) {
    console.error(err);
    handleError(err.message);
    return err;
  }
});

ipcMain.on('openURL', async (e, url) => {
  try {
    shell.openExternal(url);
  } catch (err) {
    console.error(err);
    handleError(err.message);
  }
});
