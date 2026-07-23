import { alpha } from '@mui/material/styles';
import {
  Box,
  Card,
  CardActionArea,
  Typography,
} from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';

interface AdminNavCardProps {
  title: string;
  description: string;
  path: string;
  icon: SvgIconComponent;
  color: string;
}

export function AdminNavCard({ title, description, path, icon: Icon, color }: AdminNavCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
        '&:hover': {
          borderColor: color,
          boxShadow: (theme) => `0 4px 20px ${alpha(color, 0.15)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(path)}
        sx={{
          p: 2.5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(color, theme.palette.mode === 'dark' ? 0.18 : 0.1),
            mb: 2,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ color, fontSize: 26 }} />
        </Box>

        <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }}>
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flex: 1, lineHeight: 1.5 }}
        >
          {description}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 2,
            color,
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          Ochish
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </Box>
      </CardActionArea>
    </Card>
  );
}
