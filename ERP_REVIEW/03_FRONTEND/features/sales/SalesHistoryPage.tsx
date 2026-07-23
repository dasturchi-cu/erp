import { useCallback, useMemo, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useSalesStore } from '@/stores/salesStore';
import { useAuthStore } from '@/stores/authStore';
import { formatUzs, formatUsd } from '@/utils/format';
import type { Sale } from '@/types/entities';
import { hasPermission } from '@/config/permissions';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';

const statusLabels: Record<Sale['status'], string> = {
  completed: 'Yakunlangan',
  partially_returned: 'Qisman qaytarilgan',
  voided: 'Bekor qilingan',
  returned: 'Qaytarilgan',
};

const statusColors: Record<Sale['status'], 'success' | 'error' | 'warning'> = {
  completed: 'success',
  partially_returned: 'warning',
  voided: 'error',
  returned: 'warning',
};

const paymentLabels: Record<Sale['paymentType'], string> = {
  cash: 'Naqd',
  credit: 'Nasiya',
  mixed: 'Aralash',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function SalesHistoryPage() {
  const navigate = useNavigate();
  const sales = useSalesStore((s) => s.sales);
  const permissions = useEffectivePermissions();
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState('all');

  const scopedSales = useMemo(() => {
    let list = sales;
    if (!hasPermission(permissions, 'sales.view_all') && user) {
      const name = `${user.firstName} ${user.lastName}`;
      list = list.filter((s) => s.cashier === name);
    }
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter);
    }
    return list;
  }, [sales, permissions, user, statusFilter]);

  const searchFields = useCallback(
    (s: Sale) => [s.number, s.customerName, s.cashier],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(scopedSales, searchFields);

  const columns: Column<Sale>[] = useMemo(
    () => [
      { id: 'number', label: 'Raqam', sortable: true, width: 130, render: (r) => r.number },
      { id: 'customerName', label: 'Mijoz', sortable: true, render: (r) => r.customerName },
      {
        id: 'totalUzs',
        label: 'Summa (UZS)',
        sortable: true,
        align: 'right',
        render: (r) => formatUzs(r.totalUzs),
      },
      {
        id: 'totalUsd',
        label: 'Summa (USD)',
        align: 'right',
        render: (r) => formatUsd(r.totalUsd),
      },
      {
        id: 'paymentType',
        label: "To'lov",
        render: (r) => paymentLabels[r.paymentType],
      },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => <StatusChip label={statusLabels[r.status]} color={statusColors[r.status]} />,
      },
      { id: 'cashier', label: 'Kassir', render: (r) => r.cashier },
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
        title="Sotuvlar tarixi"
        subtitle="Barcha savdolar va to'lov turlari"
        primaryAction={{
          label: 'Yangi sotuv',
          onClick: () => navigate('/sales/new'),
        }}
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Raqam, mijoz yoki kassir…' }}
        filters={
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Holat</InputLabel>
            <Select value={statusFilter} label="Holat" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">Barchasi</MenuItem>
              <MenuItem value="completed">Yakunlangan</MenuItem>
              <MenuItem value="partially_returned">Qisman qaytarilgan</MenuItem>
              <MenuItem value="voided">Bekor qilingan</MenuItem>
              <MenuItem value="returned">Qaytarilgan</MenuItem>
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
        onRowClick={(r) => navigate(`/sales/history/${r.id}`)}
      />
    </>
  );
}
