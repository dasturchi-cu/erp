import { Box, Typography } from '@mui/material';
import { Logo } from '@/components/atoms/Logo';
import { APP_VERSION } from '@/constants';
import { designTokens } from '@/theme/tokens';

interface AuthLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ children, footer }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) =>
          theme.palette.mode === 'light'
            ? designTokens.light.background.sunken
            : designTokens.dark.background.sunken,
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 6 },
        position: 'relative',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Logo />
      </Box>

      {children}

      {footer ?? (
        <Typography
          variant="body2"
          color="text.disabled"
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.75rem',
          }}
        >
          v{APP_VERSION}
        </Typography>
      )}
    </Box>
  );
}
