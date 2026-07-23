import { Box, Button, Typography, type SxProps, type Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  primaryAction?: { label: string; onClick: () => void; icon?: ReactNode };
  secondaryActions?: ReactNode;
  sx?: SxProps<Theme>;
}

export function PageHeader({ title, subtitle, primaryAction, secondaryActions, sx }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
        minHeight: 64,
        ...sx,
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {secondaryActions}
        {primaryAction && (
          <Button
            variant="contained"
            startIcon={primaryAction.icon ?? <AddIcon />}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
        )}
      </Box>
    </Box>
  );
}
