const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(app.getPath('userData'), 'pomodoro-data.json');

function readData() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!Array.isArray(data.cycles)) data.cycles = [];
    return data;
  } catch {
    return { taskLabel: '', workMinutes: 25, breakMinutes: 5, cycles: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 680,
    minWidth: 320,
    minHeight: 400,
    frame: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.handle('read-data', () => readData());

ipcMain.handle('write-data', (_event, data) => {
  writeData(data);
});

ipcMain.handle('log-cycle', (_event, cycle) => {
  const data = readData();
  data.cycles.push(cycle);
  writeData(data);
  return data.cycles;
});

ipcMain.handle('update-cycle-note', (_event, completedAt, note) => {
  const data = readData();
  const cycle = data.cycles.find((c) => c.completedAt === completedAt);
  if (cycle) {
    cycle.note = note;
    writeData(data);
  }
  return data.cycles;
});

ipcMain.handle('read-cycles', () => {
  const data = readData();
  return data.cycles;
});

ipcMain.handle('notify', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    const n = new Notification({ title, body });
    n.show();
    return true;
  }
  return false;
});

ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  }
  mainWindow.maximize();
  return true;
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  if (mainWindow) return mainWindow.isMaximized();
  return false;
});