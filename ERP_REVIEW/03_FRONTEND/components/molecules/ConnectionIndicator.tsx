import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { t } from '@/i18n';

type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

export function ConnectionIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    const check = () => {
      setStatus(navigator.onLine ? 'connected' : 'disconnected');
    };
    check();
    window.addEventListener('online', check);
    window.addEventListener('offline', check);
    const interval = setInterval(check, 30000);
    return () => {
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
      clearInterval(interval);
    };
  }, []);

  const colors: Record<ConnectionStatus, string> = {
    connected: '#16A34A',
    disconnected: '#D97706',
    checking: '#94A3B8',
  };

  const labels: Record<ConnectionStatus, string> = {
    connected: t('nav.connected'),
    disconnected: t('nav.offline'),
    checking: t('nav.checking'),
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        fontSize: '0.75rem',
        color: 'text.secondary',
        zIndex: 1,
      }}
      role="status"
      aria-live="polite"
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: colors[status],
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
        {labels[status]}
      </Typography>
    </Box>
  );
}
