import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  appendPilotLog: (line: string) => ipcRenderer.invoke('pilot:append-log', line),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('updates:appVersion'),
  downloadUpdate: (url: string, sha256: string): Promise<string> =>
    ipcRenderer.invoke('updates:download', url, sha256),
  installUpdate: (installerPath: string): Promise<void> =>
    ipcRenderer.invoke('updates:install', installerPath),
});
