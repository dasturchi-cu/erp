import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { productUsdFromUzs } from '@/utils/currency';
import { formatUzs, formatUsd } from '@/utils/format';
import type { ProductBatch, StockMovement } from '@/types/entities';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

const movementTypeLabels: Record<StockMovement['type'], string> = {
  receive: 'Kirim',
  sale: 'Sotuv',
  adjustment: 'Tuzatish',
  transfer: 'Ko\'chirish',
};

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useInventoryStore((s) => s.getProductById(id ?? ''));
  const getBatchesByProduct = useInventoryStore((s) => s.getBatchesByProduct);
  const getMovementsByProduct = useInventoryStore((s) => s.getMovementsByProduct);
  const activeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);
  const [tab, setTab] = useState(0);

  const batches = useMemo(
    () => (id ? getBatchesByProduct(id) : []),
    [id, getBatchesByProduct],
  );

  const movements = useMemo(
    () => (id ? getMovementsByProduct(id) : []),
    [id, getMovementsByProduct],
  );

  const batchColumns: Column<ProductBatch>[] = useMemo(
    () => [
      { id: 'id', label: 'Partiya', render: (r) => r.id },
      { id: 'remaining', label: 'Qoldiq', align: 'right', render: (r) => `${r.remaining} / ${r.quantity}` },
      { id: 'costUzs', label: 'Tannarx', align: 'right', render: (r) => formatUzs(r.costUzs) },
      { id: 'warehouseName', label: 'Ombor', render: (r) => r.warehouseName },
      { id: 'receivedAt', label: 'Qabul', render: (r) => formatDateTime(r.receivedAt) },
    ],
    [],
  );

  if (!product) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Mahsulot topilmadi</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/products')}>Orqaga</Button>
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={`${product.sku} · Kurs: 1 USD = ${activeRate.toLocaleString()} so'm`}
        primaryAction={{
          label: 'Tahrirlash',
          onClick: () => navigate(`/products/${product.id}/edit`),
          icon: <EditIcon />,
        }}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Kategoriya</Typography>
            <Typography gutterBottom>{product.category}</Typography>
            {product.barcode && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Shtrix-kod</Typography>
                <Typography fontFamily="monospace">{product.barcode}</Typography>
              </>
            )}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Zaxira</Typography>
            <Chip
              label={`${product.stock} dona`}
              color={product.stock === 0 ? 'error' : product.stock < 15 ? 'warning' : 'success'}
            />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Narx (UZS)</Typography>
            <Typography variant="h5" fontWeight={700}>{formatUzs(product.priceUzs)}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Narx (USD)</Typography>
            <Typography variant="h6">{formatUsd(productUsdFromUzs(product.priceUzs, activeRate))}</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`FIFO partiyalar (${batches.length})`} />
          <Tab label={`Harakatlar (${movements.length})`} />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {tab === 0 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Eng eski partiya birinchi sotiladi (FIFO tartibi)
              </Typography>
              <DataTable columns={batchColumns} rows={batches} rowKey={(r) => r.id} dense />
            </>
          )}
          {tab === 1 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Turi</TableCell>
                  <TableCell>Miqdor</TableCell>
                  <TableCell>Ombor</TableCell>
                  <TableCell>Foydalanuvchi</TableCell>
                  <TableCell>Sana</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <StatusChip label={movementTypeLabels[m.type]} color="info" />
                    </TableCell>
                    <TableCell sx={{ color: m.quantity < 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </TableCell>
                    <TableCell>{m.warehouse}</TableCell>
                    <TableCell>{m.user}</TableCell>
                    <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>
    </>
  );
}
