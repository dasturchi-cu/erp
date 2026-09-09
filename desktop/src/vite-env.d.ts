/// <reference types="vite/client" />

export interface ElectronAPI {
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  appendPilotLog?: (line: string) => Promise<void>;
  getAppVersion?: () => Promise<string>;
  downloadUpdate?: (url: string, sha256: string) => Promise<string>;
  installUpdate?: (installerPath: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
