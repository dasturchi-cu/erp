import { Chip, type ChipProps } from '@mui/material';
import { ROLE_COLORS, ROLE_LABELS } from '@/constants';
import type { UserRole } from '@/types';

interface RoleBadgeProps extends Omit<ChipProps, 'label'> {
  role: UserRole;
}

export function RoleBadge({ role, size = 'small', ...props }: RoleBadgeProps) {
  const color = ROLE_COLORS[role] ?? 'default';

  return (
    <Chip
      label={ROLE_LABELS[role] ?? role}
      size={size}
      color={color}
      variant="outlined"
      sx={{
        height: 24,
        fontSize: '0.75rem',
        fontWeight: 500,
        '& .MuiChip-label': { px: 1 },
      }}
      {...props}
    />
  );
}
