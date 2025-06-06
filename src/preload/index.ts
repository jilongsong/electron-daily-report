import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

interface Commit {
  hash: string
  date: string
  message: string
  author_name: string
  repo: string
}

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
  getGitCommits: (path: string) => ipcRenderer.invoke('git:get-commits', path),
  generateDailyReport: (commits: Commit[]) => ipcRenderer.invoke('generate-daily-report', commits)
})
