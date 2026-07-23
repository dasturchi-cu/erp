import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthCard } from '@/components/molecules/AuthCard';
import { ConnectionIndicator } from '@/components/molecules/ConnectionIndicator';
import { useAuthStore } from '@/stores/authStore';
import { getHomePathForRole } from '@/utils/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email talab qilinadi').email('To\'g\'ri email kiriting'),
  password: z.string().min(1, 'Parol talab qilinadi'),
  rememberDevice: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error, clearError, setRememberDevice } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@erp.uz',
      password: '',
      rememberDevice: true,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    clearError();
    setRememberDevice(data.rememberDevice);
    await login(data.email, data.password);

    const state = useAuthStore.getState();
    if (state.error === 'BLOCKED') {
      navigate('/device-blocked');
      return;
    }
    if (state.error) return;

    const returnUrl = searchParams.get('returnUrl');
    const updated = useAuthStore.getState();
    const role = updated.activeCompany?.role ?? updated.user?.role;
    const home = getHomePathForRole(role);

    if (updated.companies.length > 1) {
      navigate('/company-select');
    } else if (updated.companies.length === 1) {
      await updated.selectCompany(updated.companies[0].id);
      const afterSelect = useAuthStore.getState();
      const selectedRole = afterSelect.activeCompany?.role ?? afterSelect.user?.role;
      navigate(returnUrl ?? getHomePathForRole(selectedRole));
    } else {
      navigate(returnUrl ?? home);
    }
  };

  return (
    <AuthLayout>
      <AuthCard variant="narrow" sx={{ position: 'relative' }}>
        <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
          Tizimga kirish
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Davom etish uchun ma&apos;lumotlaringizni kiriting
        </Typography>

        {error && (
          <Alert severity="error" role="alert" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Kirish formasi">
          <TextField
            fullWidth
            label="Email"
            type="email"
            placeholder="name@company.com"
            {...register('email')}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Parol"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            disabled={isLoading}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />

          <FormControlLabel
            control={<Checkbox {...register('rememberDevice')} disabled={isLoading} />}
            label="Bu qurilmani eslab qolish"
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{ mb: 2, height: 44 }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Kirilmoqda…
              </>
            ) : (
              'Kirish'
            )}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Link component={RouterLink} to="/forgot-password" underline="hover" variant="body2" color="primary">
            Parolni unutdingizmi?
          </Link>
        </Box>
      </AuthCard>

      <ConnectionIndicator />
    </AuthLayout>
  );
}
