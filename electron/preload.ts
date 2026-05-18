import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectInputFiles: (filters?: any) => ipcRenderer.invoke('select-input-files', filters),
  getFileMetadata: (filePaths: string[]) => ipcRenderer.invoke('get-file-metadata', filePaths),
  compressImage: (options: any) => ipcRenderer.invoke('compress-image', options),
  createZip: (options: any) => ipcRenderer.invoke('create-zip', options),
  convertBase64: (options: any) => ipcRenderer.invoke('convert-base64', options),
  runCombinedPipeline: (options: any) => ipcRenderer.invoke('run-combined-pipeline', options),
  saveDownloadFile: (options: any) => ipcRenderer.invoke('save-download-file', options),
  getPathForFile: (file: any) => webUtils.getPathForFile(file),
});
