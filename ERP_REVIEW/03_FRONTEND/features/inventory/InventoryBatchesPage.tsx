import { useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { useInventoryStore } from '@/stores/inventoryStore';
import type { ProductBatch } from '@/types/entities';
import { formatUzs } from '@/utils/format';

export function InventoryBatchesPage() {
  const batches = useInventoryStore((s) => s.batches);

  const columns: Column<ProductBatch>[] = useMemo(
    () => [
      { id: 'id', label: 'Partiya', render: (r) => r.id },
      { id: 'productName', label: 'Mahsulot', render: (r) => r.productName },
      { id: 'remaining', label: 'Qoldiq', align: 'right', render: (r) => `${r.remaining} / ${r.quantity}` },
      { id: 'costUzs', label: 'Tannarx', align: 'right', render: (r) => formatUzs(r.costUzs) },
      { id: 'warehouseName', label: 'Ombor', render: (r) => r.warehouseName },
      {
        id: 'receivedAt',
        label: 'Qabul sanasi',
        render: (r) => new Date(r.receivedAt).toLocaleDateString('uz-UZ'),
      },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => (
          <StatusChip
            label={r.remaining > 0 ? 'Faol' : 'Tugagan'}
            color={r.remaining > 0 ? 'success' : 'default'}
          />
        ),
      },
    ],
    [],
  );

  const sorted = useMemo(
    () => [...batches].sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()),
    [batches],
  );

  return (
    <>
      <PageHeader title="Partiyalar (FIFO)" subtitle="Kirim partiyalari — eng eski birinchi sotiladi" />
      <DataTable columns={columns} rows={sorted} rowKey={(r) => r.id} />
    </>
  );
}
