import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useAdminStore } from '@/stores/adminStore';
import type { AuditLog } from '@/types/entities';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function AuditLogsPage() {
  const auditLogs = useAdminStore((s) => s.auditLogs);
  const fetchAuditLogs = useAdminStore((s) => s.fetchAuditLogs);
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    void fetchAuditLogs();
  }, [fetchAuditLogs]);

  const actions = useMemo(
    () => [...new Set(auditLogs.map((l) => l.action))],
    [auditLogs],
  );

  const filtered = useMemo(
    () =>
      actionFilter === 'all'
        ? auditLogs
        : auditLogs.filter((l) => l.action === actionFilter),
    [auditLogs, actionFilter],
  );

  const searchFields = useCallback(
    (l: AuditLog) => [l.action, l.entity, l.user, l.details ?? ''],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const columns: Column<AuditLog>[] = useMemo(
    () => [
      { id: 'action', label: 'Harakat', sortable: true, width: 110, render: (r) => r.action },
      { id: 'entity', label: 'Ob\'ekt', sortable: true, render: (r) => r.entity },
      { id: 'user', label: 'Foydalanuvchi', render: (r) => r.user },
      { id: 'ip', label: 'IP', render: (r) => r.ip },
      { id: 'details', label: 'Tafsilot', render: (r) => r.details ?? '—' },
      {
        id: 'createdAt',
        label: 'Sana',
        sortable: true,
        render: (r) => formatDateTime(r.createdAt),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Audit jurnali"
        subtitle="Tizimdagi barcha muhim harakatlar yozuvi"
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Ob\'ekt yoki foydalanuvchi…' }}
        filters={
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Harakat</InputLabel>
            <Select value={actionFilter} label="Harakat" onChange={(e) => setActionFilter(e.target.value)}>
              <MenuItem value="all">Barchasi</MenuItem>
              {actions.map((action) => (
                <MenuItem key={action} value={action}>
                  {action}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
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
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        dense
      />
    </>
  );
}
