import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { appendFile, mkdir, unlink } from 'fs/promises';
import { createWriteStream } from 'fs';
import { createHash } from 'crypto';
import { spawn } from 'child_process';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !app.isPackaged;
const pilotLogPath = () => path.join(app.getPath('userData'), 'pilot-errors.jsonl');

async function appendPilotLog(line: string): Promise<void> {
  const file = pilotLogPath();
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${line}\n`, 'utf8');
}

/**
 * Downloads an update package to a temp file, verifying its SHA-256 as it
 * streams — never leaves a partially-written or checksum-mismatched file
 * behind for the caller to accidentally run. Follows a handful of redirects
 * since the actual host isn't guaranteed to be redirect-free forever.
 */
function downloadUpdate(url: string, expectedSha256: string, redirectsLeft = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) {
          reject(new Error('Too many redirects while downloading update'));
          return;
        }
        downloadUpdate(new URL(res.headers.location, url).toString(), expectedSha256, redirectsLeft - 1)
          .then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`Update download failed: HTTP ${res.statusCode}`));
        return;
      }

      const ext = path.extname(new URL(url).pathname) || '.exe';
      const destPath = path.join(app.getPath('temp'), `erp-update-${Date.now()}${ext}`);
      const hash = createHash('sha256');
      const fileStream = createWriteStream(destPath);

      res.on('data', (chunk) => hash.update(chunk));
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        const actual = hash.digest('hex');
        if (actual.toLowerCase() !== expectedSha256.toLowerCase()) {
          unlink(destPath).finally(() => {
            reject(new Error('Update checksum mismatch — download may be corrupt or tampered with'));
          });
          return;
        }
        resolve(destPath);
      });
      fileStream.on('error', (err) => {
        unlink(destPath).finally(() => reject(err));
      });
      res.on('error', (err) => {
        fileStream.close();
        unlink(destPath).finally(() => reject(err));
      });
    });
    req.on('error', reject);
  });
}

/**
 * Spawns the downloaded NSIS installer in silent mode and quits this app
 * right after so Windows releases the running app's file locks before the
 * installer starts copying — electron-builder's NSIS output relaunches the
 * app itself once installed (runAfterFinish is on by default for the
 * oneClick installer this app already ships).
 */
function installUpdateAndRestart(installerPath: string): void {
  const child = spawn(installerPath, ['/S'], { detached: true, stdio: 'ignore' });
  child.unref();
  setTimeout(() => app.quit(), 300);
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

  ipcMain.handle('updates:download', async (_event, url: string, sha256: string) => {
    return downloadUpdate(url, sha256);
  });

  ipcMain.handle('updates:install', async (_event, installerPath: string) => {
    installUpdateAndRestart(installerPath);
  });

  ipcMain.handle('updates:appVersion', () => app.getVersion());

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
