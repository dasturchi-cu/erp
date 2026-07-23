import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useSupplierStore } from '@/stores/supplierStore';
import { formatUzs } from '@/utils/format';
import type { SupplierPayment } from '@/types/entities';

const methodLabels = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma" } as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function SupplierPaymentsPage() {
  const navigate = useNavigate();
  const payments = useSupplierStore((s) => s.payments);
  const fetchPayments = useSupplierStore((s) => s.fetchPayments);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  const columns: Column<SupplierPayment>[] = useMemo(
    () => [
      { id: 'createdAt', label: 'Sana', render: (r) => formatDateTime(r.createdAt) },
      { id: 'supplierName', label: 'Firma', render: (r) => r.supplierName },
      { id: 'amountUzs', label: 'Summa', align: 'right', render: (r) => formatUzs(r.amountUzs) },
      { id: 'method', label: "To'lov turi", render: (r) => methodLabels[r.method] },
      { id: 'note', label: 'Izoh', render: (r) => r.note ?? '—' },
      { id: 'recordedBy', label: 'Qayd etdi', render: (r) => r.recordedBy },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Firma to'lovlari"
        subtitle="Yetkazib beruvchilarga qilingan to'lovlar"
        secondaryActions={<Button onClick={() => navigate('/suppliers')}>Orqaga</Button>}
      />
      <DataTable
        columns={columns}
        rows={payments}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/suppliers/${r.supplierId}`)}
        emptyMessage="To'lovlar yo'q"
      />
    </>
  );
}
