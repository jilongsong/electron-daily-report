import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import simpleGit from 'simple-git'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

interface Commit {
  hash: string
  date: string
  message: string
  body?: string
  author_name: string
  repo: string
  repoName?: string
}

interface AIConfig {
  apiUrl: string
  apiKey: string
  model: string
}

interface ReportRequest {
  commits: Commit[]
  manualContent: string
  reportType: 'daily' | 'weekly' | 'monthly'
  dateRange: { since: string; until: string }
}

// --- Persistence helpers ---
const dataDir = join(app.getPath('userData'), 'gitreport-data')

function ensureDataDir(): void {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function loadJSON<T>(filename: string, fallback: T): T {
  try {
    ensureDataDir()
    const filePath = join(dataDir, filename)
    if (!existsSync(filePath)) return fallback
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T
  } catch {
    return fallback
  }
}

function saveJSON(filename: string, data: unknown): void {
  ensureDataDir()
  writeFileSync(join(dataDir, filename), JSON.stringify(data, null, 2), 'utf-8')
}

// --- Build prompt from template + request data ---
function buildPrompt(request: ReportRequest, promptTemplate: string): string {
  const { commits, manualContent, dateRange } = request

  const groupedCommits = commits.reduce((acc: Record<string, Commit[]>, commit) => {
    const repoLabel = commit.repoName || commit.repo || '未命名项目'
    if (!acc[repoLabel]) acc[repoLabel] = []
    acc[repoLabel].push(commit)
    return acc
  }, {})

  const commitSection = Object.entries(groupedCommits)
    .map(([repoLabel, repoCommits]) => {
      const lines = repoCommits
        .map((commit) => {
          const base = `- ${commit.message} (${commit.date})`
          if (commit.body) {
            const bodyLines = commit.body.split('\n').filter((l) => l.trim()).map((l) => `  ${l.trim()}`).join('\n')
            return `${base}\n${bodyLines}`
          }
          return base
        })
        .join('\n')
      return `【${repoLabel}】\n${lines}`
    })
    .join('\n\n')

  const trimmedManual = manualContent?.trim() || '（无）'
  const dateRangeStr = `${dateRange.since} 至 ${dateRange.until}`

  return promptTemplate
    .replace(/\{\{dateRange\}\}/g, dateRangeStr)
    .replace(/\{\{commits\}\}/g, commitSection)
    .replace(/\{\{manual\}\}/g, trimmedManual)
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // --- Settings persistence ---
  ipcMain.handle('settings:load', async () => {
    return loadJSON('settings.json', {})
  })

  ipcMain.handle('settings:save', async (_, settings: unknown) => {
    saveJSON('settings.json', settings)
  })

  // --- Report history persistence ---
  ipcMain.handle('history:load', async () => {
    return loadJSON('report-history.json', [])
  })

  ipcMain.handle('history:save', async (_, history: unknown) => {
    saveJSON('report-history.json', history)
  })

  // --- Git commits with date range (full message including body) ---
  ipcMain.handle('git:get-commits', async (_, path: string, since?: string, until?: string) => {
    try {
      const git = simpleGit(path)

      const DELIM = '---GR_DELIM---'
      const RECORD_SEP = '---GR_RECORD---'
      // %H=hash, %aI=authorDateISO, %an=authorName, %s=subject, %b=body
      const format = `${RECORD_SEP}%H${DELIM}%aI${DELIM}%an${DELIM}%s${DELIM}%b`

      const args = ['log', `--pretty=format:${format}`]
      if (since) args.push(`--since=${since} 00:00:00`)
      else if (!until) args.push('--since=1 day ago')
      if (until) args.push(`--until=${until} 23:59:59`)

      const raw = await git.raw(args)
      if (!raw || !raw.trim()) return []

      const records = raw.split(RECORD_SEP).filter((s) => s.trim())
      const commits = records.map((record) => {
        const parts = record.split(DELIM)
        const hash = (parts[0] || '').trim()
        const date = (parts[1] || '').trim()
        const author_name = (parts[2] || '').trim()
        const message = (parts[3] || '').trim()
        const body = (parts[4] || '').trim()
        return { hash, date, message, body, author_name }
      })

      return commits
    } catch (error) {
      return { error }
    }
  })

  // --- Report generation with configurable AI ---
  ipcMain.handle('generate-report', async (_, request: ReportRequest, aiConfig: AIConfig, promptTemplate: string) => {
    try {
      if (!aiConfig.apiKey) {
        throw new Error('请先在设置中配置 API Key')
      }
      if (!aiConfig.apiUrl) {
        throw new Error('请先在设置中配置 API URL')
      }

      const prompt = buildPrompt(request, promptTemplate)

      const requestBody = {
        model: aiConfig.model || 'Qwen/Qwen3-32B',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1
      }

      const response = await fetch(aiConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`API 请求失败 (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('API 返回格式异常')
      }

      const report = data.choices[0].message.content
      return { report }
    } catch (error: unknown) {
      console.error('Error generating report:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return { error: errorMessage }
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
