import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { appendFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { spawn, exec, ChildProcess } from 'child_process';
import net from 'net';

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
        PORT: '3000',
        DATABASE_URL: 'postgresql://erp:erp_secret@127.0.0.1:5433/erp?schema=public',
        JWT_ACCESS_SECRET: 'change-me-access-secret-min-32-chars-long',
        JWT_REFRESH_SECRET: 'change-me-refresh-secret-min-32-chars-long',
        JWT_ACCESS_EXPIRES_IN: '315360000',
        JWT_REFRESH_EXPIRES_IN: '3153600000',
        THROTTLE_TTL: '900000',
        THROTTLE_LIMIT: '1000'
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

function checkDatabasePort(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(5433, '127.0.0.1');
  });
}

function startPostgres(): Promise<void> {
  return new Promise((resolve, reject) => {
    const pgCtl = 'D:\\erp1\\.tools\\pgsql\\bin\\pg_ctl.exe';
    const pgData = 'D:\\erp1\\.tools\\pgsql\\data';
    const pgLog = 'D:\\erp1\\.tools\\pg.log';
    
    const cmd = `"${pgCtl}" -D "${pgData}" -o "-p 5433" -l "${pgLog}" start`;
    exec(cmd, (error) => {
      if (error) {
        console.error('Failed to start Postgres:', error);
        reject(error);
      } else {
        console.log('Postgres started successfully');
        setTimeout(resolve, 2000);
      }
    });
  });
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
      webSecurity: false,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch (err) {
      console.error('Failed to parse URL in setWindowOpenHandler:', err);
    }
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // Check and start database if needed (only in production)
  if (app.isPackaged) {
    const dbRunning = await checkDatabasePort();
    if (!dbRunning) {
      try {
        await startPostgres();
      } catch (e) {
        console.error('Failed to auto-start Postgres:', e);
      }
    }
  }

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

