import { Box, Card, Skeleton, Typography } from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RemoveIcon from '@mui/icons-material/Remove';
import { designTokens } from '@/theme/tokens';
import { useAppTheme } from '@/theme/ThemeProvider';
import { getCurrencyColor } from '@/theme/createTheme';

interface StatCardProps {
  label: string;
  value: string;
  secondaryValue?: string;
  trend?: number;
  trendLabel?: string;
  meta?: string;
  currencyColor?: 'uzs' | 'usd';
  loading?: boolean;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  secondaryValue,
  trend = 0,
  trendLabel = 'vs yesterday',
  meta,
  currencyColor,
  loading,
  onClick,
}: StatCardProps) {
  const { resolvedMode } = useAppTheme();

  const trendDirection = Math.abs(trend) < 0.5 ? 'flat' : trend > 0 ? 'up' : 'down';
  const trendColor =
    trendDirection === 'up'
      ? designTokens[resolvedMode].status.success
      : trendDirection === 'down'
        ? designTokens[resolvedMode].status.error
        : designTokens[resolvedMode].foreground.tertiary;

  const TrendIcon =
    trendDirection === 'up'
      ? TrendingUpIcon
      : trendDirection === 'down'
        ? TrendingDownIcon
        : RemoveIcon;

  if (loading) {
    return (
      <Card sx={{ p: 2, minHeight: 120 }}>
        <Skeleton width="50%" height={16} />
        <Skeleton width="70%" height={36} sx={{ mt: 1 }} />
        <Skeleton width="40%" height={14} sx={{ mt: 1 }} />
      </Card>
    );
  }

  return (
    <Card
      sx={{
        p: 2,
        minHeight: 120,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
        '&:hover': onClick
          ? { boxShadow: designTokens.shadow.md }
          : undefined,
      }}
      onClick={onClick}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          mb: 0.5,
        }}
        noWrap
      >
        {label}
      </Typography>

      <Typography
        variant="h4"
        sx={{
          fontFamily: designTokens.typography.fontFamilyMono,
          fontWeight: 700,
          fontSize: '1.75rem',
          lineHeight: 1.2,
          color: currencyColor ? getCurrencyColor(resolvedMode, currencyColor) : 'text.primary',
        }}
      >
        {value}
      </Typography>

      {secondaryValue && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '1rem',
            color: getCurrencyColor(resolvedMode, 'usd'),
            mt: 0.25,
          }}
        >
          {secondaryValue}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
        <TrendIcon sx={{ fontSize: 14, color: trendColor }} />
        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: trendColor }}>
          {trendDirection === 'flat' ? '—' : `${Math.abs(trend).toFixed(1)}%`} {trendLabel}
        </Typography>
      </Box>

      {meta && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
          {meta}
        </Typography>
      )}
    </Card>
  );
}
