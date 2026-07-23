import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { logPilotError } from '@/lib/pilotErrorLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logPilotError({
      source: 'react-boundary',
      error: error.message,
      stackTrace: info.componentStack ?? error.stack ?? null,
      action: 'react render',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 4,
            textAlign: 'center',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Kutilmagan xato yuz berdi
          </Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={400}>
            {this.state.error?.message ?? 'Iltimos, sahifani yangilang yoki qayta urinib ko\'ring.'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Sahifani yangilash
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
