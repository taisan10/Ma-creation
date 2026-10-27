const { contextBridge } = require('electron')

// React frontend ko batane ke liye ki yeh Electron app ke andar chal raha hai
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktopApp: true,
  platform: process.platform,
})
