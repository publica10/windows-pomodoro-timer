const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomodoroAPI', {
  readData: () => ipcRenderer.invoke('read-data'),
  writeData: (data) => ipcRenderer.invoke('write-data', data),
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body }),
  logCycle: (cycle) => ipcRenderer.invoke('log-cycle', cycle),
  readCycles: () => ipcRenderer.invoke('read-cycles'),
  updateCycleNote: (completedAt, note) => ipcRenderer.invoke('update-cycle-note', completedAt, note),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized')
});