import { Box, Card, CircularProgress, Grid, Typography } from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/organisms/StatCard';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { formatUzs } from '@/utils/format';

function formatCompact(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} mlrd`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} mln`;
  return value.toLocaleString('uz-UZ');
}

export function AnalyticsPage() {
  const { data, loading, error } = useAnalyticsData('monthly');
  const chart = data?.chart ?? [];
  const metrics = data?.metrics ?? [];
  const highlights = data?.highlights;
  const maxRevenue = chart.length > 0 ? Math.max(...chart.map((p) => p.revenue)) : 1;

  if (error) {
    return (
      <>
        <PageHeader title="Analitika" subtitle="Daromad, foyda va savdo ko'rsatkichlari" />
        <Typography color="error">{error}</Typography>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Analitika"
        subtitle="Daromad, foyda va savdo ko'rsatkichlari"
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard label="..." value="..." loading />
              </Grid>
            ))
          : metrics.map((metric) => (
              <Grid key={metric.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard
                  label={metric.label}
                  value={metric.value}
                  trend={metric.change}
                  trendLabel={metric.period}
                  meta={metric.period}
                />
              </Grid>
            ))}
      </Grid>

      <Card variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Oylik daromad va foyda
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          So&apos;nggi 6 oy statistikasi
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {chart.map((point) => {
              const widthPct = (point.revenue / maxRevenue) * 100;
              const profitPct = point.revenue > 0 ? (point.profit / point.revenue) * 100 : 0;
              return (
                <Box key={point.month}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {point.month}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCompact(point.revenue)} so&apos;m · {point.orders} buyurtma
                    </Typography>
                  </Box>
                  <Box sx={{ position: 'relative', height: 28, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${widthPct}%`,
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        opacity: 0.85,
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${(widthPct * profitPct) / 100}%`,
                        bgcolor: 'success.main',
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Foyda: {formatUzs(point.profit)} ({profitPct.toFixed(0)}%)
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', borderRadius: 0.5 }} />
            <Typography variant="caption">Daromad</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: 0.5 }} />
            <Typography variant="caption">Foyda</Typography>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Eng yuqori oylik daromad
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {highlights
                  ? `${highlights.peakMonth.label} — ${formatUzs(highlights.peakMonth.revenue)}`
                  : '—'}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingDownIcon color="warning" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                O&apos;rtacha chek o&apos;zgarishi
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {highlights
                  ? `${highlights.avgCheckChange.percent > 0 ? '+' : ''}${highlights.avgCheckChange.percent}% (${highlights.avgCheckChange.period})`
                  : '—'}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
