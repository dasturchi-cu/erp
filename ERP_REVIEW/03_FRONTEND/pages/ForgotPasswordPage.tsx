import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthCard } from '@/components/molecules/AuthCard';

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard variant="narrow">
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Parolni tiklash
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Administratoringizga murojaat qiling yoki tizim administratoriga yozing.
        </Typography>
        <Button component={RouterLink} to="/login" variant="contained" fullWidth>
          Kirish sahifasiga qaytish
        </Button>
      </AuthCard>
    </AuthLayout>
  );
}
