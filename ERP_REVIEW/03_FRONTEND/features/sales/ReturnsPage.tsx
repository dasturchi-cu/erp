import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useSalesStore } from '@/stores/salesStore';
import type { SaleReturn } from '@/types/entities';
import { formatUzs, formatUsd } from '@/utils/format';

const statusLabels: Record<SaleReturn['status'], string> = {
  pending: 'Kutilmoqda',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
};

const statusColors: Record<SaleReturn['status'], 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function ReturnsPage() {
  const navigate = useNavigate();
  const returns = useSalesStore((s) => s.returns);
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(
    () => (statusFilter === 'all' ? returns : returns.filter((r) => r.status === statusFilter)),
    [returns, statusFilter],
  );

  const searchFields = useCallback(
    (r: SaleReturn) => [r.saleNumber, r.customerName, r.reason],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const columns: Column<SaleReturn>[] = useMemo(
    () => [
      { id: 'saleNumber', label: 'Savdo raqami', sortable: true, render: (r) => r.saleNumber },
      { id: 'customerName', label: 'Mijoz', sortable: true, render: (r) => r.customerName },
      {
        id: 'amountUzs',
        label: 'Summa (UZS)',
        sortable: true,
        align: 'right',
        render: (r) => formatUzs(r.amountUzs),
      },
      {
        id: 'amountUsd',
        label: 'Summa (USD)',
        align: 'right',
        render: (r) => formatUsd(r.amountUsd),
      },
      { id: 'reason', label: 'Sabab', render: (r) => r.reason },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => <StatusChip label={statusLabels[r.status]} color={statusColors[r.status]} />,
      },
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
        title="Qaytarishlar"
        subtitle="Mijoz qaytarish so'rovlari va holati"
        primaryAction={{ label: 'Yangi qaytarish', onClick: () => navigate('/sales/returns/new') }}
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Savdo raqami yoki mijoz…' }}
        filters={
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Holat</InputLabel>
            <Select value={statusFilter} label="Holat" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">Barchasi</MenuItem>
              <MenuItem value="pending">Kutilmoqda</MenuItem>
              <MenuItem value="approved">Tasdiqlangan</MenuItem>
              <MenuItem value="rejected">Rad etilgan</MenuItem>
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
        onRowClick={(r) => navigate(`/sales/returns/${r.id}`)}
      />
    </>
  );
}
