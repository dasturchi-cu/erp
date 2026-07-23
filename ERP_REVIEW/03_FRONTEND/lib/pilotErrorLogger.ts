export interface PilotErrorEntry {
  timestamp: string;
  source: 'frontend' | 'api' | 'react-boundary' | 'unhandled';
  user: string | null;
  screen: string;
  action: string;
  error: string;
  stackTrace: string | null;
  requestId?: string;
  statusCode?: number;
}

const STORAGE_KEY = 'erp-pilot-error-log';
const MAX_ENTRIES = 200;

let lastAction = '';

export function setPilotAction(action: string): void {
  lastAction = action;
}

export function getPilotScreen(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

function resolveUser(): string | null {
  try {
    const raw = localStorage.getItem('erp-auth-v2');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { user?: { email?: string } } };
    return parsed.state?.user?.email ?? null;
  } catch {
    return null;
  }
}

function persist(entry: PilotErrorEntry): void {
  try {
    const existing = getPilotErrorLog();
    existing.push(entry);
    const trimmed = existing.slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* storage full or unavailable */
  }

  const line = JSON.stringify(entry);
  void window.electronAPI?.appendPilotLog?.(line);
  console.error('[PilotError]', entry);
}

export function logPilotError(params: {
  source: PilotErrorEntry['source'];
  error: string;
  stackTrace?: string | null;
  action?: string;
  screen?: string;
  requestId?: string;
  statusCode?: number;
}): void {
  persist({
    timestamp: new Date().toISOString(),
    source: params.source,
    user: resolveUser(),
    screen: params.screen ?? getPilotScreen(),
    action: params.action ?? (lastAction || `${params.source} error`),
    error: params.error,
    stackTrace: params.stackTrace ?? null,
    requestId: params.requestId,
    statusCode: params.statusCode,
  });
}

export function getPilotErrorLog(): PilotErrorEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PilotErrorEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function exportPilotErrorLog(): string {
  return JSON.stringify(getPilotErrorLog(), null, 2);
}

export function initPilotErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    logPilotError({
      source: 'unhandled',
      error: event.message,
      stackTrace: event.error?.stack ?? null,
      action: `${event.filename}:${event.lineno}`,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Unhandled rejection';
    logPilotError({
      source: 'unhandled',
      error: message,
      stackTrace: reason instanceof Error ? reason.stack ?? null : null,
      action: 'unhandledrejection',
    });
  });
}
