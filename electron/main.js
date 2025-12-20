const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

let mainWindow;
let backendProcess;
let tray;

const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 8001;
const FRONTEND_URL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../frontend/build/index.html')}`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'HotelPro - Hotelverwaltung',
    show: false,
    backgroundColor: '#fafaf9'
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(FRONTEND_URL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(FRONTEND_URL.split('#')[0])) {
      event.preventDefault();
    }
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend server...');
    
    let backendCmd;
    let backendArgs;
    
    if (isDev) {
      // Development: Run uvicorn
      backendCmd = 'uvicorn';
      backendArgs = ['server:app', '--host', '0.0.0.0', '--port', String(BACKEND_PORT)];
    } else {
      // Production: Run compiled executable
      const backendExe = path.join(process.resourcesPath, 'backend', 'server.exe');
      backendCmd = backendExe;
      backendArgs = [];
    }

    backendProcess = spawn(backendCmd, backendArgs, {
      cwd: isDev ? path.join(__dirname, '../backend') : path.join(process.resourcesPath, 'backend'),
      stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data.toString()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data.toString()}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      reject(error);
    });

    // Wait for backend to be ready
    waitOn({
      resources: [`http://localhost:${BACKEND_PORT}/api`],
      timeout: 30000,
      interval: 500
    })
    .then(() => {
      console.log('Backend is ready!');
      resolve();
    })
    .catch((err) => {
      console.error('Backend failed to start:', err);
      reject(err);
    });
  });
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets/tray-icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'HotelPro öffnen',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Beenden',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('HotelPro - Hotelverwaltung');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
    createTray();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on window close - keep running in tray
  // Uncomment below to quit when all windows are closed
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});
