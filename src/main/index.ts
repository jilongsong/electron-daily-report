import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import simpleGit from 'simple-git'

// Initialize API client
const API_KEY = 'sk-fqtorqeqoafdilkroppjlcidwphfjtkdqdsslzvcgysbqwap'
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'

interface Commit {
  hash: string
  date: string
  message: string
  author_name: string
  repo: string
  repoName?: string
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
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

  ipcMain.handle('git:get-commits', async (_, path: string) => {
    try {
      const git = simpleGit(path);
      const log = await git.log({ '--since': '1 day ago' });
      return log.all;
    } catch (error) {
      return { error };
    }
  });

  // Add API call handler
  ipcMain.handle('generate-daily-report', async (_, commits: Commit[], manualContent: string) => {
    try {
      const groupedCommits = commits.reduce((acc: Record<string, Commit[]>, commit) => {
        const repoLabel = commit.repoName || commit.repo || '未命名项目'
        if (!acc[repoLabel]) {
          acc[repoLabel] = []
        }
        acc[repoLabel].push(commit)
        return acc
      }, {})

      const commitSection = Object.entries(groupedCommits)
        .map(([repoLabel, repoCommits]) => {
          const lines = repoCommits
            .map((commit) => `- ${commit.message} (${commit.date})`)
            .join('\n')
          return `【${repoLabel}】\n${lines}`
        })
        .join('\n\n')

      const trimmedManual = manualContent?.trim() || '（无）'

      const prompt = `请根据以下按项目归类的Git提交记录以及额外手动记录生成一份日报。要求:
1. 按项目名称对工作内容进行分组输出，将同一项目下的提交记录归类在一起
2. 仅总结提交记录及额外记录中实际体现的工作内容，不要臆测
3. 使用中文输出，保持专业、客观
4. 输出纯文本，不要包含 Markdown 标记

按项目分类的提交记录:
${commitSection}

额外记录:
${trimmedManual}

请严格按照以下格式输出:
1. 今日工作内容:
    【项目名称】
    1. xxxxx
    2. xxxxx
    3. ...
  【项目名称】
    1. xxxxx
    2. xxxxx
    3. ... 
2. 遇到的问题: 仅列出提交记录或额外记录中明确提到的问题或改进点`

      const requestBody = {
        model: 'Qwen/Qwen3-32B',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
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
        throw new Error(`API request failed with status ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response format')
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
