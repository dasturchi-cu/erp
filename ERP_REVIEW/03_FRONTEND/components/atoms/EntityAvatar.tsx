import { Avatar, type AvatarProps } from '@mui/material';
import { getInitials } from '@/utils/format';

interface EntityAvatarProps extends Omit<AvatarProps, 'children' | 'variant'> {
  name: string;
  src?: string;
  size?: number;
  entityVariant?: 'user' | 'company';
}

const variantColors: Record<string, string> = {
  user: '#2563EB',
  company: '#475569',
};

export function EntityAvatar({
  name,
  src,
  size = 40,
  entityVariant = 'company',
  sx,
  ...props
}: EntityAvatarProps) {
  return (
    <Avatar
      src={src}
      alt={name}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 600,
        bgcolor: variantColors[entityVariant],
        ...sx,
      }}
      {...props}
    >
      {getInitials(name)}
    </Avatar>
  );
}
