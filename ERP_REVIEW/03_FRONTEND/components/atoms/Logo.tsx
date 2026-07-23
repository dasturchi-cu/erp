import { Box, Typography } from '@mui/material';
import { designTokens } from '@/theme/tokens';
import { useAppTheme } from '@/theme/ThemeProvider';

interface LogoProps {
  size?: 'sm' | 'md';
}

export function Logo({ size = 'md' }: LogoProps) {
  const { resolvedMode } = useAppTheme();
  const height = size === 'sm' ? 32 : 40;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        userSelect: 'none',
      }}
      aria-label="ERP"
    >
      <Box
        sx={{
          width: height,
          height: height,
          borderRadius: designTokens.radius.md,
          background: `linear-gradient(135deg, ${
            resolvedMode === 'light' ? '#2563EB' : '#3B82F6'
          } 0%, ${resolvedMode === 'light' ? '#1D4ED8' : '#2563EB'} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: size === 'sm' ? '0.875rem' : '1rem',
        }}
      >
        E
      </Box>
      <Typography
        variant="h5"
        component="span"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontSize: size === 'sm' ? '1.125rem' : '1.375rem',
        }}
      >
        ERP
      </Typography>
    </Box>
  );
}
