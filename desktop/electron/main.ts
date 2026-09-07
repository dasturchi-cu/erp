import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { appendFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !app.isPackaged;
const pilotLogPath = () => path.join(app.getPath('userData'), 'pilot-errors.jsonl');

async function appendPilotLog(line: string): Promise<void> {
  const file = pilotLogPath();
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${line}\n`, 'utf8');
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
