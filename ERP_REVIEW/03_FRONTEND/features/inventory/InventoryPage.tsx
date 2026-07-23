import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { StatCard } from '@/components/organisms/StatCard';
import { useListState } from '@/hooks/useListState';
import { useInventoryStore } from '@/stores/inventoryStore';
import { formatUzs } from '@/utils/format';

type InventoryRow = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  warehouseId: string;
  warehouse: string;
  quantity: number;
  minStock: number;
  status: 'ok' | 'low' | 'out';
};

const statusLabels: Record<InventoryRow['status'], string> = {
  ok: 'Yetarli',
  low: 'Past',
  out: 'Tugagan',
};

const statusColors: Record<InventoryRow['status'], 'success' | 'warning' | 'error'> = {
  ok: 'success',
  low: 'warning',
  out: 'error',
};

const MIN_STOCK = 15;

export function InventoryPage() {
  const stockLevels = useInventoryStore((s) => s.stockLevels);
  const warehouses = useInventoryStore((s) => s.warehouses);
  const products = useInventoryStore((s) => s.products);
  const fetchStockLevels = useInventoryStore((s) => s.fetchStockLevels);
  const fetchWarehouses = useInventoryStore((s) => s.fetchWarehouses);
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    void fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    const whId = warehouseFilter === 'all' ? undefined : warehouseFilter;
    void fetchStockLevels(whId);
  }, [warehouseFilter, fetchStockLevels]);

  const productPriceMap = useMemo(
    () => new Map(products.map((p) => [p.id, p.priceUzs * 0.72])),
    [products],
  );

  const inventoryRows = useMemo<InventoryRow[]>(
    () =>
      stockLevels.map((s) => ({
        id: `${s.productId}-${s.warehouseId}`,
        productId: s.productId,
        sku: s.sku,
        name: s.productName,
        warehouseId: s.warehouseId,
        warehouse: s.warehouseName ?? warehouses.find((w) => w.id === s.warehouseId)?.name ?? '—',
        quantity: s.stock,
        minStock: MIN_STOCK,
        status: s.stock === 0 ? 'out' : s.stock < MIN_STOCK ? 'low' : 'ok',
      })),
    [stockLevels, warehouses],
  );

  const filtered = useMemo(() => {
    return inventoryRows.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return true;
    });
  }, [inventoryRows, statusFilter]);

  const searchFields = useCallback(
    (i: InventoryRow) => [i.sku, i.name, i.warehouse],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const lowCount = inventoryRows.filter((i) => i.status === 'low').length;
  const outCount = inventoryRows.filter((i) => i.status === 'out').length;
  const totalValue = inventoryRows.reduce(
    (s, i) => s + i.quantity * (productPriceMap.get(i.productId) ?? 0),
    0,
  );

  const columns: Column<InventoryRow>[] = useMemo(
    () => [
      { id: 'sku', label: 'SKU', sortable: true, width: 110, render: (r) => r.sku },
      { id: 'name', label: 'Mahsulot', sortable: true, render: (r) => r.name },
      { id: 'warehouse', label: 'Ombor', sortable: true, render: (r) => r.warehouse },
      { id: 'quantity', label: 'Miqdor', sortable: true, align: 'right', render: (r) => r.quantity },
      { id: 'minStock', label: 'Min. qoldiq', align: 'right', render: (r) => r.minStock },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => <StatusChip label={statusLabels[r.status]} color={statusColors[r.status]} />,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Ombor"
        subtitle="Ombor bo'yicha zaxira holati"
        secondaryActions={
          lowCount + outCount > 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main' }}>
              <WarningAmberIcon fontSize="small" />
              {lowCount + outCount} ta ogohlantirish
            </Box>
          ) : undefined
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard label="Jami pozitsiyalar" value={String(inventoryRows.length)} />
        <StatCard label="Past qoldiq" value={String(lowCount)} meta={`${outCount} ta tugagan`} />
        <StatCard label="Taxminiy qiymat" value={formatUzs(totalValue)} currencyColor="uzs" />
      </Box>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Mahsulot yoki SKU…' }}
        filters={
          <>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Ombor</InputLabel>
              <Select
                value={warehouseFilter}
                label="Ombor"
                onChange={(e) => setWarehouseFilter(e.target.value)}
              >
                <MenuItem value="all">Barchasi</MenuItem>
                {warehouses.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Holat</InputLabel>
              <Select value={statusFilter} label="Holat" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">Barchasi</MenuItem>
                <MenuItem value="ok">Yetarli</MenuItem>
                <MenuItem value="low">Past</MenuItem>
                <MenuItem value="out">Tugagan</MenuItem>
              </Select>
            </FormControl>
          </>
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
