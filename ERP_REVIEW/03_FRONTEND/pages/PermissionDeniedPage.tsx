import { Box, Button, Stack, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getHomePathForRole } from '@/utils/auth';

export function PermissionDeniedPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.activeCompany?.role ?? s.user?.role);
  const logout = useAuthStore((s) => s.logout);
  const home = getHomePathForRole(role);

  return (
    <Box sx={{ textAlign: 'center', py: 10, px: 2 }}>
      <LockIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Ruxsat yo&apos;q
      </Typography>
      <Typography variant="body2" color="text.secondary" maxWidth={400} mx="auto" mb={3}>
        Bu sahifaga kirish uchun sizda yetarli ruxsat mavjud emas. Administratorga murojaat qiling.
      </Typography>
      <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={() => navigate(home, { replace: true })}>
          Bosh sahifaga
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          Chiqish
        </Button>
      </Stack>
    </Box>
  );
}
