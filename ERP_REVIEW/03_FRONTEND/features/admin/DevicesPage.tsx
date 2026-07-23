import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useAdminStore } from '@/stores/adminStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import type { AdminDevice } from '@/types/entities';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function DevicesPage() {
  const devices = useAdminStore((s) => s.devices);
  const fetchDevices = useAdminStore((s) => s.fetchDevices);
  const toggleDeviceStatus = useAdminStore((s) => s.toggleDeviceStatus);
  const { success, error: notifyError } = useNotification();
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    void fetchDevices();
  }, [fetchDevices]);

  const filtered = useMemo(
    () => (statusFilter === 'all' ? devices : devices.filter((d) => d.status === statusFilter)),
    [devices, statusFilter],
  );

  const searchFields = useCallback(
    (d: AdminDevice) => [d.name, d.platform, d.user],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const columns: Column<AdminDevice>[] = useMemo(
    () => [
      { id: 'name', label: 'Qurilma', sortable: true, render: (r) => r.name },
      { id: 'platform', label: 'Platforma', render: (r) => r.platform },
      { id: 'user', label: 'Foydalanuvchi', sortable: true, render: (r) => r.user },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => (
          <StatusChip
            label={r.status === 'active' ? 'Faol' : 'Bloklangan'}
            color={r.status === 'active' ? 'success' : 'error'}
          />
        ),
      },
      {
        id: 'lastSeenAt',
        label: 'Oxirgi faollik',
        sortable: true,
        render: (r) => formatDateTime(r.lastSeenAt),
      },
      {
        id: 'actions',
        label: 'Amallar',
        align: 'right',
        render: (r) => (
          <Button
            size="small"
            variant="outlined"
            color={r.status === 'active' ? 'error' : 'success'}
            onClick={(e) => {
              e.stopPropagation();
              void toggleDeviceStatus(r.id)
                .then(() => success(r.status === 'active' ? 'Qurilma bloklandi' : 'Qurilma ochildi'))
                .catch(() => notifyError('Holat o\'zgartirilmadi'));
            }}
          >
            {r.status === 'active' ? 'Bloklash' : 'Ochish'}
          </Button>
        ),
      },
    ],
    [toggleDeviceStatus, success, notifyError],
  );

  return (
    <>
      <PageHeader
        title="Qurilmalar"
        subtitle="Ro'yxatdan o'tgan kassa va ish stoli qurilmalari"
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Qurilma yoki foydalanuvchi…' }}
        filters={
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Holat</InputLabel>
            <Select value={statusFilter} label="Holat" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">Barchasi</MenuItem>
              <MenuItem value="active">Faol</MenuItem>
              <MenuItem value="blocked">Bloklangan</MenuItem>
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
      />
    </>
  );
}
