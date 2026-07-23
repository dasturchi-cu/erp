import { Box, Button, Typography } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthCard } from '@/components/molecules/AuthCard';

export function DeviceBlockedPage() {
  return (
    <AuthLayout>
      <AuthCard variant="narrow">
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <BlockIcon sx={{ fontSize: 64, color: 'error.main' }} />
        </Box>
        <Typography variant="h5" fontWeight={600} gutterBottom align="center">
          Qurilma bloklangan
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Bu qurilmadan tizimga kirish administrator tomonidan cheklangan. Yordam uchun administratorga murojaat qiling.
        </Typography>
        <Button variant="outlined" fullWidth disabled>
          Administrator bilan bog&apos;lanish
        </Button>
      </AuthCard>
    </AuthLayout>
  );
}
