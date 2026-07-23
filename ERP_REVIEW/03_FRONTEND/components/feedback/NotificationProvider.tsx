import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';

interface Notification {
  id: string;
  message: string;
  severity: AlertColor;
}

interface NotificationContextValue {
  notify: (message: string, severity?: AlertColor) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Notification[]>([]);
  const current = queue[0] ?? null;

  const notify = useCallback((message: string, severity: AlertColor = 'info') => {
    setQueue((prev) => [...prev, { id: crypto.randomUUID(), message, severity }]);
  }, []);

  const value = useMemo(
    () => ({
      notify,
      success: (m: string) => notify(m, 'success'),
      error: (m: string) => notify(m, 'error'),
      warning: (m: string) => notify(m, 'warning'),
      info: (m: string) => notify(m, 'info'),
    }),
    [notify],
  );

  const handleClose = () => setQueue((prev) => prev.slice(1));

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(current)}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {current ? (
          <Alert onClose={handleClose} severity={current.severity} variant="filled" sx={{ width: '100%' }}>
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
