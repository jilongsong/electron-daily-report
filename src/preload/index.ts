import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getGitLogs: () => ipcRenderer.invoke('git:get-logs')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ...api
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = {
    ...electronAPI,
    ...api
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  getGitCommits: (path: string, since?: string, until?: string) =>
    ipcRenderer.invoke('git:get-commits', path, since, until),
  generateReport: (request: any, aiConfig: any, promptTemplate: string) =>
    ipcRenderer.invoke('generate-report', request, aiConfig, promptTemplate),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  loadReportHistory: () => ipcRenderer.invoke('history:load'),
  saveReportHistory: (history: any) => ipcRenderer.invoke('history:save', history)
})
