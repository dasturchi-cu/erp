import { Box, Skeleton, type SxProps, type Theme } from '@mui/material';
import { designTokens } from '@/theme/tokens';

interface AuthCardProps {
  children: React.ReactNode;
  variant?: 'narrow' | 'wide';
  sx?: SxProps<Theme>;
}

export function AuthCard({ children, variant = 'narrow', sx }: AuthCardProps) {
  const maxWidth = variant === 'wide' ? 640 : 480;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth,
        bgcolor: 'background.paper',
        borderRadius: `${designTokens.radius.lg}px`,
        border: 1,
        borderColor: 'divider',
        boxShadow: designTokens.shadow.lg,
        p: { xs: 3, sm: 4 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function AuthCardSkeleton({ variant = 'narrow' }: { variant?: 'narrow' | 'wide' }) {
  const maxWidth = variant === 'wide' ? 640 : 480;

  return (
    <Box sx={{ width: '100%', maxWidth, p: { xs: 3, sm: 4 } }}>
      <Skeleton variant="text" width="60%" height={36} />
      <Skeleton variant="text" width="80%" height={24} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={44} />
    </Box>
  );
}
