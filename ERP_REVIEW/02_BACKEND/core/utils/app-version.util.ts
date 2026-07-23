import { readFileSync } from 'fs';
import { join } from 'path';

let cachedVersion: string | null = null;

export function getAppVersion(): string {
  if (cachedVersion) return cachedVersion;
  if (process.env.APP_VERSION) {
    cachedVersion = process.env.APP_VERSION;
    return cachedVersion;
  }
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8')) as {
      version?: string;
    };
    cachedVersion = pkg.version ?? '1.0.0';
  } catch {
    cachedVersion = '1.0.0';
  }
  return cachedVersion;
}

export function getFrontendUrl(): string {
  return process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173';
}
