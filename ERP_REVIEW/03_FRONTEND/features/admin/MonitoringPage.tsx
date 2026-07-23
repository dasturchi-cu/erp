import { useEffect, useState } from 'react';
import { Box, Card, Grid, LinearProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { PageHeader } from '@/components/common/PageHeader';
import { useAdminStore } from '@/stores/adminStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import type { SystemMetric } from '@/types/entities';

const statusIcons: Record<SystemMetric['status'], typeof CheckCircleIcon> = {
  healthy: CheckCircleIcon,
  warning: WarningIcon,
  critical: ErrorIcon,
};

const statusColors: Record<SystemMetric['status'], string> = {
  healthy: 'success.main',
  warning: 'warning.main',
  critical: 'error.main',
};

const statusLabels: Record<SystemMetric['status'], string> = {
  healthy: 'Sog\'lom',
  warning: 'Ogohlantirish',
  critical: 'Kritik',
};

const systemStatusLabels = {
  healthy: 'Sog\'lom',
  degraded: 'Pasaygan',
  critical: 'Kritik',
} as const;

function MetricCard({ metric }: { metric: SystemMetric }) {
  const Icon = statusIcons[metric.status];
  const progress =
    metric.status === 'healthy' ? 90 : metric.status === 'warning' ? 55 : 25;

  return (
    <Card variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {metric.label}
        </Typography>
        <Icon sx={{ color: statusColors[metric.status], fontSize: 22 }} />
      </Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        {metric.value}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={metric.status === 'healthy' ? 'success' : metric.status === 'warning' ? 'warning' : 'error'}
        sx={{ mb: 1, height: 6, borderRadius: 1 }}
      />
      <Typography variant="caption" color="text.secondary">
        {statusLabels[metric.status]}
      </Typography>
    </Card>
  );
}

export function MonitoringPage() {
  const metrics = useAdminStore((s) => s.metrics);
  const systemStatus = useAdminStore((s) => s.systemStatus);
  const fetchMonitoring = useAdminStore((s) => s.fetchMonitoring);
  const { success } = useNotification();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void fetchMonitoring();
  }, [fetchMonitoring]);

  const healthy = metrics.filter((m) => m.status === 'healthy').length;
  const warnings = metrics.filter((m) => m.status === 'warning').length;
  const critical = metrics.filter((m) => m.status === 'critical').length;

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchMonitoring().finally(() => {
      setRefreshing(false);
      success('Metrikalar yangilandi');
    });
  };

  return (
    <>
      <PageHeader
        title="Monitoring"
        subtitle={
          systemStatus
            ? `Tizim holati: ${systemStatusLabels[systemStatus]}`
            : 'Tizim holati va resurslar'
        }
        primaryAction={{
          label: refreshing ? 'Yangilanmoqda…' : 'Yangilash',
          onClick: handleRefresh,
        }}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card variant="outlined" sx={{ px: 2.5, py: 1.5, flex: '1 1 120px', minWidth: 120 }}>
          <Typography variant="caption" color="text.secondary">
            Sog&apos;lom
          </Typography>
          <Typography variant="h6" color="success.main" fontWeight={700}>
            {healthy}
          </Typography>
        </Card>
        <Card variant="outlined" sx={{ px: 2.5, py: 1.5, flex: '1 1 120px', minWidth: 120 }}>
          <Typography variant="caption" color="text.secondary">
            Ogohlantirish
          </Typography>
          <Typography variant="h6" color="warning.main" fontWeight={700}>
            {warnings}
          </Typography>
        </Card>
        <Card variant="outlined" sx={{ px: 2.5, py: 1.5, flex: '1 1 120px', minWidth: 120 }}>
          <Typography variant="caption" color="text.secondary">
            Kritik
          </Typography>
          <Typography variant="h6" color="error.main" fontWeight={700}>
            {critical}
          </Typography>
        </Card>
      </Box>

      <Grid container spacing={2}>
        {metrics.map((metric) => (
          <Grid key={metric.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <MetricCard metric={metric} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
