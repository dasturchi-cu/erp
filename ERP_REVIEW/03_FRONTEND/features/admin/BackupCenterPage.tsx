import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { StatCard } from '@/components/organisms/StatCard';
import { useListState } from '@/hooks/useListState';
import { useAdminStore } from '@/stores/adminStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import type { BackupJob } from '@/types/entities';

const typeLabels: Record<BackupJob['type'], string> = {
  full: 'To\'liq',
  incremental: 'Inkremental',
};

const statusLabels: Record<BackupJob['status'], string> = {
  completed: 'Yakunlangan',
  running: 'Jarayonda',
  failed: 'Xatolik',
};

const statusColors: Record<BackupJob['status'], 'success' | 'info' | 'error'> = {
  completed: 'success',
  running: 'info',
  failed: 'error',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function BackupCenterPage() {
  const backups = useAdminStore((s) => s.backups);
  const backupSchedule = useAdminStore((s) => s.backupSchedule);
  const fetchBackups = useAdminStore((s) => s.fetchBackups);
  const fetchBackupSchedule = useAdminStore((s) => s.fetchBackupSchedule);
  const createBackup = useAdminStore((s) => s.createBackup);
  const restoreBackup = useAdminStore((s) => s.restoreBackup);
  const updateBackupSchedule = useAdminStore((s) => s.updateBackupSchedule);
  const { success, info, error: notifyError } = useNotification();
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    void fetchBackups();
    void fetchBackupSchedule();
  }, [fetchBackups, fetchBackupSchedule]);

  const searchFields = useCallback(
    (b: BackupJob) => [b.type, b.status, b.size, b.trigger ?? ''],
    [],
  );

  const { page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(backups, searchFields);

  const completed = backups.filter((b) => b.status === 'completed').length;
  const lastBackup = backups.find((b) => b.status === 'completed');
  const running = backups.some((b) => b.status === 'running');

  const handleBackup = async () => {
    setCreating(true);
    info('Zaxira nusxa jarayoni boshlandi…');
    try {
      const job = await createBackup('full');
      if (job.status === 'completed') success('Zaxira nusxa muvaffaqiyatli yaratildi');
      else if (job.status === 'failed') notifyError(job.errorMessage ?? 'Zaxira nusxasi xatolik bilan tugadi');
      else success('Zaxira nusxa jarayoni boshlandi');
      await fetchBackups();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Zaxira nusxasi yaratilmadi');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await restoreBackup(id);
      success('Zaxira nusxadan tiklash muvaffaqiyatli');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Tiklash xatolik');
    } finally {
      setRestoringId(null);
    }
  };

  const columns: Column<BackupJob>[] = useMemo(
    () => [
      { id: 'type', label: 'Turi', render: (r) => typeLabels[r.type] },
      {
        id: 'trigger',
        label: 'Manba',
        render: (r) => (r.trigger === 'automatic' ? 'Avtomatik' : 'Qo\'lda'),
      },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => <StatusChip label={statusLabels[r.status]} color={statusColors[r.status]} />,
      },
      { id: 'size', label: 'Hajm', render: (r) => r.size },
      {
        id: 'createdAt',
        label: 'Sana',
        sortable: true,
        render: (r) => formatDateTime(r.createdAt),
      },
      {
        id: 'actions',
        label: '',
        render: (r) =>
          r.status === 'completed' ? (
            <Button
              size="small"
              startIcon={<RestoreIcon />}
              disabled={restoringId === r.id}
              onClick={() => void handleRestore(r.id)}
            >
              Tiklash
            </Button>
          ) : null,
      },
    ],
    [restoringId],
  );

  return (
    <>
      <PageHeader
        title="Zaxira nusxa markazi"
        subtitle="Ma'lumotlar bazasi zaxira nusxalari"
        primaryAction={{
          label: creating || running ? 'Jarayonda…' : 'Zaxira nusxa olish',
          onClick: () => void handleBackup(),
        }}
      />

      {backupSchedule && (
        <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Avtomatik zaxira nusxa
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={backupSchedule.enabled}
                onChange={(_, checked) => void updateBackupSchedule({ enabled: checked })}
              />
            }
            label={
              backupSchedule.enabled
                ? `Yoqilgan — har kuni ${backupSchedule.hourUtc}:00 UTC (${backupSchedule.type})`
                : 'O\'chirilgan'
            }
          />
        </Card>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard label="Muvaffaqiyatli" value={String(completed)} />
        <StatCard
          label="Oxirgi zaxira"
          value={lastBackup ? formatDateTime(lastBackup.createdAt) : '—'}
          meta={lastBackup?.size}
        />
        <StatCard label="Jami yozuvlar" value={String(backups.length)} />
      </Box>

      <DataTable
        columns={columns}
        rows={paginated}
        rowKey={(r) => r.id}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
    </>
  );
}
