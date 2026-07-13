import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, FormControl, Grid, InputLabel, MenuItem, Select, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatCard } from '@/components/organisms/StatCard';
import { useSupplierStore } from '@/stores/supplierStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatUzs, formatUsd } from '@/utils/format';
import type { SupplierDebtHistoryEntry, SupplierPayment, SupplierReceipt } from '@/types/entities';

const statusLabels = { active: 'Faol', archived: 'Arxiv' } as const;
const statusColors = { active: 'success', archived: 'default' } as const;
const paymentTypeLabels = { cash: 'Naqd', credit: 'Qarz' } as const;
const paymentMethodLabels = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma" } as const;
const debtTypeLabels: Record<string, string> = {
  receipt_credit: 'Qabul (qarz)',
  payment: "To'lov",
  adjustment: 'Tuzatish',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

const EMPTY_RECEIPTS: SupplierReceipt[] = [];
const EMPTY_DEBT_HISTORY: SupplierDebtHistoryEntry[] = [];

export function SupplierProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success } = useNotification();
  const supplier = useSupplierStore((s) =>
    id ? s.suppliers.find((su) => su.id === id) : undefined,
  );
  const isLoading = useSupplierStore((s) => s.isLoading);
  const fetchSuppliers = useSupplierStore((s) => s.fetchSuppliers);
  const fetchReceipts = useSupplierStore((s) => s.fetchReceipts);
  const fetchDebtHistory = useSupplierStore((s) => s.fetchDebtHistory);
  const fetchPayments = useSupplierStore((s) => s.fetchPayments);
  const receipts = useSupplierStore((s) =>
    id ? s.receipts[id] ?? EMPTY_RECEIPTS : EMPTY_RECEIPTS,
  );
  const debtHistory = useSupplierStore((s) =>
    id ? s.debtHistory[id] ?? EMPTY_DEBT_HISTORY : EMPTY_DEBT_HISTORY,
  );
  const allPayments = useSupplierStore((s) => s.payments);
  const payments = useMemo(
    () => (id ? allPayments.filter((p) => p.supplierId === id) : []),
    [allPayments, id],
  );
  const archiveSupplier = useSupplierStore((s) => s.archiveSupplier);
  const activeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState<string>('all');
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    if (!id) return;
    void fetchSuppliers();
    void fetchDebtHistory(id);
    void fetchPayments();
  }, [id, fetchSuppliers, fetchDebtHistory, fetchPayments]);

  useEffect(() => {
    if (!id) return;
    void fetchReceipts(id, period === 'all' ? undefined : period);
  }, [id, period, fetchReceipts]);

  const receiptColumns: Column<SupplierReceipt>[] = useMemo(
    () => [
      { id: 'createdAt', label: 'Sana', render: (r) => formatDateTime(r.createdAt) },
      { id: 'productName', label: 'Mahsulot', render: (r) => r.productName },
      { id: 'quantity', label: 'Miqdor', align: 'right', render: (r) => r.quantity },
      { id: 'unitCostUzs', label: 'Narx', align: 'right', render: (r) => formatUzs(r.unitCostUzs) },
      { id: 'paymentType', label: "To'lov turi", render: (r) => paymentTypeLabels[r.paymentType] },
    ],
    [],
  );

  const paymentColumns: Column<SupplierPayment>[] = useMemo(
    () => [
      { id: 'createdAt', label: 'Sana', render: (r) => formatDateTime(r.createdAt) },
      { id: 'amountUzs', label: 'Summa', align: 'right', render: (r) => formatUzs(r.amountUzs) },
      { id: 'method', label: "To'lov turi", render: (r) => paymentMethodLabels[r.method] },
      { id: 'note', label: 'Izoh', render: (r) => r.note ?? '—' },
    ],
    [],
  );

  const historyColumns: Column<SupplierDebtHistoryEntry>[] = useMemo(
    () => [
      { id: 'createdAt', label: 'Sana', render: (r) => formatDateTime(r.createdAt) },
      { id: 'type', label: 'Turi', render: (r) => debtTypeLabels[r.type] ?? r.type },
      { id: 'amountUzs', label: 'Summa', align: 'right', render: (r) => formatUzs(r.amountUzs) },
      { id: 'balanceAfterUzs', label: 'Qoldiq', align: 'right', render: (r) => formatUzs(r.balanceAfterUzs) },
    ],
    [],
  );

  const handleArchive = async () => {
    if (!supplier) return;
    await archiveSupplier(supplier.id);
    success('Firma arxivlandi');
    navigate('/suppliers');
  };

  const handleRestore = async () => {
    if (!supplier) return;
    await useSupplierStore.getState().restoreSupplier(supplier.id);
    success('Firma faollashtirildi');
    void fetchSuppliers();
  };

  if (isLoading && !supplier) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Yuklanmoqda…</Typography>
      </Box>
    );
  }

  if (!supplier) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Firma topilmadi</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/suppliers')}>Orqaga</Button>
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title={supplier.name}
        subtitle={supplier.phone}
        secondaryActions={
          <>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/suppliers')}>Orqaga</Button>
            {supplier.status !== 'archived' ? (
              <>
                <Button startIcon={<EditIcon />} onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}>Tahrirlash</Button>
                <Button startIcon={<ArchiveIcon />} color="warning" onClick={() => setConfirmArchive(true)}>Hamkorlikni tugatish</Button>
              </>
            ) : (
              <Button startIcon={<ArchiveIcon />} color="success" onClick={handleRestore}>Qayta tiklash</Button>
            )}
          </>
        }
        primaryAction={
          supplier.remainingDebtUzs > 0
            ? { label: "To'lov qilish", onClick: () => navigate(`/suppliers/${supplier.id}/payment`) }
            : undefined
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Jami qarz (UZS)"
            value={formatUzs(supplier.totalDebtUzs)}
            secondaryValue={supplier.totalDebtUzs > 0 ? formatUsd(supplier.totalDebtUzs / activeRate) : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="To'langan summa (UZS)"
            value={formatUzs(supplier.totalPaidUzs)}
            secondaryValue={supplier.totalPaidUzs > 0 ? formatUsd(supplier.totalPaidUzs / activeRate) : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Qoldiq qarz (UZS)"
            value={formatUzs(supplier.remainingDebtUzs)}
            secondaryValue={supplier.remainingDebtUzs > 0 ? formatUsd(supplier.remainingDebtUzs / activeRate) : undefined}
            currencyColor="uzs"
          />
        </Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">Mas&apos;ul: {supplier.contactPerson ?? '—'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Izoh: {supplier.notes ?? '—'}</Typography>
        <Box sx={{ mt: 1 }}><StatusChip label={statusLabels[supplier.status]} color={statusColors[supplier.status]} /></Box>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Mahsulotlar" />
        <Tab label="Qarz tarixi" />
        <Tab label="To'lovlar" />
      </Tabs>

      {tab === 0 && (
        <>
          <FormControl size="small" sx={{ mb: 2, minWidth: 140 }}>
            <InputLabel>Filtr</InputLabel>
            <Select value={period} label="Filtr" onChange={(e) => setPeriod(e.target.value)}>
              <MenuItem value="all">Barchasi</MenuItem>
              <MenuItem value="day">Kun</MenuItem>
              <MenuItem value="month">Oy</MenuItem>
              <MenuItem value="year">Yil</MenuItem>
            </Select>
          </FormControl>
          <DataTable columns={receiptColumns} rows={receipts} rowKey={(r) => r.id} emptyMessage="Qabul qilishlar yo'q" />
        </>
      )}
      {tab === 1 && <DataTable columns={historyColumns} rows={debtHistory} rowKey={(r) => r.id} emptyMessage="Qarz tarixi yo'q" />}
      {tab === 2 && <DataTable columns={paymentColumns} rows={payments} rowKey={(r) => r.id} emptyMessage="To'lovlar yo'q" />}

      <ConfirmDialog
        open={confirmArchive}
        title="Hamkorlikni tugatish"
        message="Haqiqatan ham ushbu firma bilan hamkorlikni tugatmoqchimisiz?"
        confirmLabel="Ha"
        cancelLabel="Yo'q"
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchive(false)}
      />
    </>
  );
}
