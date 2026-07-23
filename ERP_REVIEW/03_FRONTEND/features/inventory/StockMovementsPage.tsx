import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useInventoryStore } from '@/stores/inventoryStore';
import type { StockMovement } from '@/types/entities';

const typeLabels: Record<StockMovement['type'], string> = {
  receive: 'Kirim',
  sale: 'Sotuv',
  adjustment: 'Tuzatish',
  transfer: 'Ko\'chirish',
};

const typeColors: Record<StockMovement['type'], 'success' | 'error' | 'warning' | 'info'> = {
  receive: 'success',
  sale: 'error',
  adjustment: 'warning',
  transfer: 'info',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function StockMovementsPage() {
  const navigate = useNavigate();
  const movements = useInventoryStore((s) => s.movements);
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(
    () => (typeFilter === 'all' ? movements : movements.filter((m) => m.type === typeFilter)),
    [movements, typeFilter],
  );

  const searchFields = useCallback(
    (m: StockMovement) => [m.productName, m.warehouse, m.user],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const columns: Column<StockMovement>[] = useMemo(
    () => [
      {
        id: 'type',
        label: 'Turi',
        render: (r) => <StatusChip label={typeLabels[r.type]} color={typeColors[r.type]} />,
      },
      { id: 'productName', label: 'Mahsulot', sortable: true, render: (r) => r.productName },
      {
        id: 'quantity',
        label: 'Miqdor',
        sortable: true,
        align: 'right',
        render: (r) => (
          <span style={{ color: r.quantity < 0 ? '#d32f2f' : '#2e7d32', fontWeight: 600 }}>
            {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
          </span>
        ),
      },
      { id: 'warehouse', label: 'Ombor', sortable: true, render: (r) => r.warehouse },
      { id: 'user', label: 'Foydalanuvchi', render: (r) => r.user },
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
        title="Zaxira harakatlari"
        subtitle="Kirim, chiqim va ko'chirishlar jurnali"
        primaryAction={{ label: 'Zaxira qabul qilish', onClick: () => navigate('/inventory/receive') }}
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Mahsulot yoki foydalanuvchi…' }}
        filters={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Turi</InputLabel>
            <Select value={typeFilter} label="Turi" onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="all">Barchasi</MenuItem>
              <MenuItem value="receive">Kirim</MenuItem>
              <MenuItem value="sale">Sotuv</MenuItem>
              <MenuItem value="transfer">Ko&apos;chirish</MenuItem>
              <MenuItem value="adjustment">Tuzatish</MenuItem>
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
