import { useMemo } from 'react';
import { TextField, Box } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { formatUzs, formatUsd } from '@/utils/format';
import { productUsdFromUzs } from '@/utils/currency';
import type { Product } from '@/types/entities';
import { useNotification } from '@/components/feedback/NotificationProvider';

export function PriceManagementPage() {
  const { success } = useNotification();
  const products = useInventoryStore((s) => s.products);
  const exchangeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);
  const updateProductPriceUzs = useInventoryStore((s) => s.updateProductPriceUzs);
  const updateProductPriceUsd = useInventoryStore((s) => s.updateProductPriceUsd);

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === 'active'),
    [products],
  );

  const columns: Column<Product>[] = useMemo(
    () => [
      { id: 'sku', label: 'SKU', width: 100, render: (r) => r.sku },
      { id: 'name', label: 'Mahsulot', render: (r) => r.name },
      {
        id: 'priceUzs',
        label: 'UZS',
        align: 'right',
        render: (r) => (
          <TextField
            size="small"
            type="number"
            key={`${r.id}-uzs-${r.priceUzs}-${exchangeRate}`}
            defaultValue={r.priceUzs}
            onBlur={(e) => {
              const value = Number(e.target.value);
              if (value > 0) void updateProductPriceUzs(r.id, value);
            }}
            sx={{ width: 140 }}
          />
        ),
      },
      {
        id: 'priceUsd',
        label: 'USD',
        align: 'right',
        render: (r) => (
          <TextField
            size="small"
            type="number"
            key={`${r.id}-usd-${r.priceUsd}-${exchangeRate}`}
            inputProps={{ step: 0.01 }}
            defaultValue={r.priceUsd}
            onBlur={(e) => {
              const value = Number(e.target.value);
              if (value > 0) void updateProductPriceUsd(r.id, value, exchangeRate);
            }}
            sx={{ width: 100 }}
          />
        ),
      },
      {
        id: 'preview',
        label: 'Ko\'rinish',
        align: 'right',
        render: (r) => (
          <Box>
            <Box>{formatUzs(r.priceUzs)}</Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {formatUsd(productUsdFromUzs(r.priceUzs, exchangeRate))}
            </Box>
          </Box>
        ),
      },
    ],
    [exchangeRate, updateProductPriceUzs, updateProductPriceUsd],
  );

  return (
    <>
      <PageHeader
        title="Narx boshqaruvi"
        subtitle={`Sotish narxlari — joriy kurs: 1 USD = ${exchangeRate.toLocaleString()} so'm`}
        primaryAction={{
          label: 'Saqlash',
          onClick: () => success('Narxlar saqlandi'),
          icon: <SaveIcon />,
        }}
      />
      <DataTable columns={columns} rows={activeProducts} rowKey={(r) => r.id} />
    </>
  );
}
