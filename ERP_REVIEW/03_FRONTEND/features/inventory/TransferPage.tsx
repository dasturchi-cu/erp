import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import type { StockTransfer } from '@/types/entities';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function TransferPage() {
  const warehouses = useInventoryStore((s) => s.warehouses);
  const products = useInventoryStore((s) => s.products);
  const transfers = useInventoryStore((s) => s.transfers);
  const fetchAll = useInventoryStore((s) => s.fetchAll);
  const fetchTransfers = useInventoryStore((s) => s.fetchTransfers);
  const transferStock = useInventoryStore((s) => s.transferStock);
  const { success, error: notifyError } = useNotification();

  const [tab, setTab] = useState(0);
  const [productId, setProductId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const sameBranchTargets = useMemo(() => {
    const from = warehouses.find((w) => w.id === fromWarehouseId);
    if (!from?.branchId) return warehouses.filter((w) => w.id !== fromWarehouseId);
    return warehouses.filter((w) => w.branchId === from.branchId && w.id !== fromWarehouseId);
  }, [warehouses, fromWarehouseId]);

  const searchFields = useCallback(
    (t: StockTransfer) => [
      t.productName,
      t.sku,
      t.fromWarehouseName,
      t.toWarehouseName,
      t.performedBy,
    ],
    [],
  );

  const { page, setPage, pageSize, setPageSize, paginated, total } = useListState(
    transfers,
    searchFields,
  );

  const handleSubmit = async () => {
    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      notifyError('Barcha maydonlarni to\'ldiring');
      return;
    }
    setSubmitting(true);
    try {
      await transferStock({
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity: Number(quantity),
        note: note || undefined,
      });
      success('O\'tkazma muvaffaqiyatli bajarildi');
      setQuantity('');
      setNote('');
      await fetchTransfers();
      setTab(1);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'O\'tkazma xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<StockTransfer>[] = useMemo(
    () => [
      { id: 'productName', label: 'Mahsulot', render: (r) => r.productName },
      { id: 'from', label: 'Qayerdan', render: (r) => r.fromWarehouseName },
      { id: 'to', label: 'Qayerga', render: (r) => r.toWarehouseName },
      { id: 'quantity', label: 'Miqdor', align: 'right', render: (r) => r.quantity },
      { id: 'user', label: 'Foydalanuvchi', render: (r) => r.performedBy },
      { id: 'createdAt', label: 'Sana', render: (r) => formatDateTime(r.createdAt) },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Omborlar o'rtasida o'tkazma" subtitle="FIFO tartibida zaxira ko'chirish" />

      <Card variant="outlined" sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Yangi o'tkazma" />
          <Tab label={`Tarix (${transfers.length})`} />
        </Tabs>

        {tab === 0 ? (
          <Box sx={{ p: 3, display: 'grid', gap: 2, maxWidth: 520 }}>
            <FormControl fullWidth>
              <InputLabel>Mahsulot</InputLabel>
              <Select value={productId} label="Mahsulot" onChange={(e) => setProductId(e.target.value)}>
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Qayerdan</InputLabel>
              <Select
                value={fromWarehouseId}
                label="Qayerdan"
                onChange={(e) => {
                  setFromWarehouseId(e.target.value);
                  setToWarehouseId('');
                }}
              >
                {warehouses.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Qayerga</InputLabel>
              <Select
                value={toWarehouseId}
                label="Qayerga"
                onChange={(e) => setToWarehouseId(e.target.value)}
                disabled={!fromWarehouseId}
              >
                {sameBranchTargets.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Miqdor"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputProps={{ min: 0.0001, step: 1 }}
            />
            <TextField label="Izoh" value={note} onChange={(e) => setNote(e.target.value)} multiline rows={2} />
            <Button variant="contained" disabled={submitting} onClick={() => void handleSubmit()}>
              {submitting ? 'Jarayonda…' : 'O\'tkazish'}
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
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
          </Box>
        )}
      </Card>
    </>
  );
}
