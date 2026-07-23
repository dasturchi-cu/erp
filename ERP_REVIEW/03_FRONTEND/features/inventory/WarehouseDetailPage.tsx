import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Card, Grid, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { StatCard } from '@/components/organisms/StatCard';
import { useInventoryStore } from '@/stores/inventoryStore';
import { formatUzs } from '@/utils/format';
import type { ProductBatch, StockMovement } from '@/types/entities';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchWarehouseDetail = useInventoryStore((s) => s.fetchWarehouseDetail);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [warehouse, setWarehouse] = useState<Awaited<ReturnType<typeof fetchWarehouseDetail>>['warehouse'] | null>(null);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof fetchWarehouseDetail>>['dashboard'] | null>(null);
  const [reports, setReports] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void fetchWarehouseDetail(id)
      .then((res) => {
        setWarehouse(res.warehouse);
        setBatches(res.batches);
        setMovements(res.movements);
        setDashboard(res.dashboard);
      })
      .finally(() => setLoading(false));
  }, [id, fetchWarehouseDetail]);

  useEffect(() => {
    if (!id || tab !== 2) return;
    import('@/api/services').then(({ inventoryApi }) => {
      void inventoryApi.getWarehouseReports(id).then(setReports);
    });
  }, [id, tab]);

  const batchColumns: Column<ProductBatch>[] = useMemo(
    () => [
      { id: 'id', label: 'Partiya', render: (r) => r.id.slice(0, 8) },
      { id: 'productName', label: 'Mahsulot', render: (r) => r.productName },
      { id: 'remaining', label: 'Qoldiq', align: 'right', render: (r) => r.remaining },
      { id: 'costUzs', label: 'Tannarx', align: 'right', render: (r) => formatUzs(r.costUzs) },
    ],
    [],
  );

  const movementColumns: Column<StockMovement>[] = useMemo(
    () => [
      { id: 'productName', label: 'Mahsulot', render: (r) => r.productName },
      {
        id: 'quantity',
        label: 'Miqdor',
        align: 'right',
        render: (r) => (
          <span style={{ color: r.quantity < 0 ? '#d32f2f' : '#2e7d32', fontWeight: 600 }}>
            {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
          </span>
        ),
      },
      { id: 'user', label: 'Foydalanuvchi', render: (r) => r.user },
      { id: 'createdAt', label: 'Sana', render: (r) => formatDateTime(r.createdAt) },
    ],
    [],
  );

  if (loading) {
    return <Typography sx={{ py: 6, textAlign: 'center' }}>Yuklanmoqda…</Typography>;
  }

  if (!warehouse) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Ombor topilmadi</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/inventory/warehouses')}>Orqaga</Button>
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title={warehouse.name}
        subtitle={warehouse.branch}
        secondaryActions={
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/inventory/warehouses')}>
            Orqaga
          </Button>
        }
      />

      {dashboard && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <StatCard label="Mahsulotlar" value={String(dashboard.productCount)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <StatCard label="Jami qiymat" value={formatUzs(Number(dashboard.totalValueUzs))} currencyColor="uzs" />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <StatCard label="Partiyalar" value={String(dashboard.batchCount)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <StatCard
              label="Past qoldiq"
              value={String(dashboard.lowStockCount)}
              meta={`${dashboard.transfersLast30Days} o'tkazma (30 kun)`}
            />
          </Grid>
        </Grid>
      )}

      <Card variant="outlined">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Partiyalar" />
          <Tab label="Harakatlar" />
          <Tab label="Hisobot" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tab === 0 && (
            <DataTable columns={batchColumns} rows={batches} rowKey={(r) => r.id} dense />
          )}
          {tab === 1 && (
            <DataTable columns={movementColumns} rows={movements} rowKey={(r) => r.id} dense />
          )}
          {tab === 2 && reports && (
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Typography variant="body2">
                Jami zaxira: {(reports.stockSummary as { totalStockQty?: string })?.totalStockQty ?? '—'}
              </Typography>
              <Typography variant="body2">
                O&apos;tkazmalar: {String((reports as { transfersCount?: number }).transfersCount ?? 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Harakat turlari: {JSON.stringify((reports as { movementsByType?: Record<string, number> }).movementsByType ?? {})}
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    </>
  );
}
