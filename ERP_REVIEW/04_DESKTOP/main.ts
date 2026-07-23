import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { appendFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !app.isPackaged;
const pilotLogPath = () => path.join(app.getPath('userData'), 'pilot-errors.jsonl');

let backendProcess: ChildProcess | null = null;

async function appendPilotLog(line: string): Promise<void> {
  const file = pilotLogPath();
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${line}\n`, 'utf8');
}

function startBackend(): void {
  if (isDev) return;
  
  // Prodda bundled node va backend dist ni ishga tushirish
  const resourcesPath = process.resourcesPath;
  const nodePath = path.join(resourcesPath, 'node', 'node.exe');
  const mainJsPath = path.join(resourcesPath, 'backend', 'dist', 'src', 'main.js');
  
  try {
    backendProcess = spawn(nodePath, [mainJsPath], {
      cwd: path.join(resourcesPath, 'backend'),
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        PORT: '3000'
      }
    });
    
    backendProcess.stdout?.on('data', (data) => {
      console.log(`Backend stdout: ${data}`);
    });
    
    backendProcess.stderr?.on('data', (data) => {
      console.error(`Backend stderr: ${data}`);
    });
  } catch (err) {
    console.error('Failed to start backend process:', err);
  }
}

function stopBackend(): void {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    title: 'ERP',
    backgroundColor: '#F8FAFC',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Backendni ishga tushiramiz (faqat productionda ishlaydi)
  startBackend();

  ipcMain.handle('pilot:append-log', async (_event, line: string) => {
    await appendPilotLog(line);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

