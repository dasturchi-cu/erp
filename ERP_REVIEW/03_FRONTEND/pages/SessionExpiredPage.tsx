import { Button, Typography } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthCard } from '@/components/molecules/AuthCard';

export function SessionExpiredPage() {
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl');

  return (
    <AuthLayout>
      <AuthCard variant="narrow">
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Sessiya tugadi
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Xavfsizlik uchun sessiyangiz yakunlandi. Davom etish uchun qayta kiring.
        </Typography>
        <Button
          component={RouterLink}
          to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
          variant="contained"
          fullWidth
        >
          Qayta kirish
        </Button>
      </AuthCard>
    </AuthLayout>
  );
}
