const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const PWA_URL = 'https://monm-secure-messaging.netlify.app';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'MonM - Secure Messaging',
  });

  win.loadURL(PWA_URL);

  // Open DevTools in development (optional)
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
