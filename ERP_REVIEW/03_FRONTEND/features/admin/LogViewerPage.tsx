import { useCallback, useEffect } from 'react';
import { Chip } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useAdminStore } from '@/stores/adminStore';
import type { SystemLogEntry } from '@/types/entities';

const levelColors: Record<SystemLogEntry['level'], 'default' | 'warning' | 'error' | 'info'> = {
  info: 'info',
  warn: 'warning',
  error: 'error',
};

const levelLabels: Record<SystemLogEntry['level'], string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'medium' });
}

export function LogViewerPage() {
  const systemLogs = useAdminStore((s) => s.systemLogs);
  const fetchSystemLogs = useAdminStore((s) => s.fetchSystemLogs);

  useEffect(() => {
    void fetchSystemLogs();
  }, [fetchSystemLogs]);

  const searchFields = useCallback(
    (l: SystemLogEntry) => [l.message, l.source, l.user, l.level, l.ip],
    [],
  );

  const { page, setPage, pageSize, setPageSize, paginated, total } = useListState(
    systemLogs,
    searchFields,
  );

  const columns: Column<SystemLogEntry>[] = [
    {
      id: 'level',
      label: 'Daraja',
      render: (r) => (
        <Chip label={levelLabels[r.level]} size="small" color={levelColors[r.level]} variant="outlined" />
      ),
    },
    { id: 'message', label: 'Xabar', render: (r) => r.message },
    { id: 'source', label: 'Manba', render: (r) => r.source },
    { id: 'user', label: 'Foydalanuvchi', render: (r) => r.user },
    { id: 'ip', label: 'IP', render: (r) => r.ip },
    {
      id: 'createdAt',
      label: 'Vaqt',
      sortable: true,
      render: (r) => formatDateTime(r.createdAt),
    },
  ];

  return (
    <>
      <PageHeader
        title="Log ko'ruvchi"
        subtitle="Tizim va audit loglari"
        primaryAction={{
          label: 'Yangilash',
          onClick: () => void fetchSystemLogs(),
        }}
      />

      <DataTable
        columns={columns}
        rows={paginated}
        rowKey={(r) => r.id}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </>
  );
}
