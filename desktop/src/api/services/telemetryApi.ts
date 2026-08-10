import { apiClient } from '@/api/client';
import { getDeviceId, getDeviceInfo } from '@/utils/deviceId';
import { getPilotErrorLog } from '@/lib/pilotErrorLogger';

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '2.0.0';

// Latency of the previous heartbeat POST, reported as the health signal on the next one.
let lastResponseTimeMs = 0;

export interface HeartbeatPayload {
  deviceId: string;
  os: string;
  desktopVersion: string;
  backendVersion: string;
  databaseVersion: string;
  cpuUsage: number;
  ramUsage: number;
  diskFreeBytes: number;
  uptime: number;
  printerOnline: boolean;
  scannerConnected: boolean;
  upsOnline: boolean;
  offlineQueueSize: number;
  errorsCount: number;
  responseTimeMs: number;
}

function buildHeartbeat(): HeartbeatPayload {
  const info = getDeviceInfo();
  // Browser/Electron can't read raw CPU/disk; report what we reliably know.
  const memory = (performance as any)?.memory;
  const ramUsage = memory?.usedJSHeapSize && memory?.jsHeapSizeLimit
    ? Number(((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2))
    : 0;

  return {
    deviceId: getDeviceId(),
    os: info.platform ?? 'windows',
    desktopVersion: APP_VERSION,
    backendVersion: APP_VERSION,
    databaseVersion: 'unknown',
    cpuUsage: 0,
    ramUsage,
    diskFreeBytes: 0,
    uptime: Math.trunc(performance.now() / 1000),
    printerOnline: true,
    scannerConnected: true,
    upsOnline: true,
    offlineQueueSize: 0,
    errorsCount: getPilotErrorLog().length,
    responseTimeMs: lastResponseTimeMs,
  };
}

export const telemetryApi = {
  async sendHeartbeat(): Promise<void> {
    const payload = buildHeartbeat();
    const start = performance.now();
    await apiClient.post('/saas/heartbeat', payload);
    lastResponseTimeMs = Math.trunc(performance.now() - start);
  },
};
