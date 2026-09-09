import { Alert, AlertTitle, Button, CircularProgress, Stack } from '@mui/material';
import { useAppUpdate } from '@/hooks/useAppUpdate';

export function UpdateBanner() {
  const { isElectron, available, installState, install, dismiss } = useAppUpdate();

  if (!isElectron || !available) return null;

  return (
    <Alert
      severity={installState.step === 'error' ? 'error' : 'info'}
      onClose={installState.step === 'idle' ? dismiss : undefined}
      sx={{ borderRadius: 0 }}
      action={
        installState.step === 'idle' ? (
          <Button color="inherit" size="small" onClick={install}>
            O'rnatish
          </Button>
        ) : installState.step === 'error' ? (
          <Button color="inherit" size="small" onClick={install}>
            Qayta urinish
          </Button>
        ) : (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ pr: 1 }}>
            <CircularProgress size={16} color="inherit" />
          </Stack>
        )
      }
    >
      <AlertTitle sx={{ mb: 0 }}>
        {installState.step === 'downloading' && 'Yangilanish yuklanmoqda...'}
        {installState.step === 'installing' && "O'rnatilmoqda, dastur qayta ishga tushadi..."}
        {installState.step === 'error' && installState.message}
        {installState.step === 'idle' &&
          `Yangi versiya mavjud: ${available.latestVersion}${available.changelog ? ' — ' + available.changelog : ''}`}
      </AlertTitle>
    </Alert>
  );
}
