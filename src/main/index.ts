import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import simpleGit from 'simple-git'

// Initialize API client
const API_KEY = 'sk-fqtorqeqoafdilkroppjlcidwphfjtkdqdsslzvcgysbqwap'
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'

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
  ipcMain.handle('generate-daily-report', async (_, commits) => {
    try {
      const prompt = `请根据以下Git提交记录生成一份日报。要求:
1. 只总结提交记录中实际体现的工作内容
2. 保持客观、简洁的表述
3. 只是用普通文本输出，不要带任何标记
4. 使用中文输出

提交记录:
${commits.map(commit => `- ${commit.message} (${commit.date})`).join('\n')}

请严格按照以下格式输出:
1. 今日工作内容: 
    1.xxxxx
    2.xxxxx
    3. ...
2. 遇到的问题: 仅列出提交记录中明确提到的问题或改进点`

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
