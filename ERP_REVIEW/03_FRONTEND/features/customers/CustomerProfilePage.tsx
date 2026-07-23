import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, Grid, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatCard } from '@/components/organisms/StatCard';
import { useCustomerStore } from '@/stores/customerStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useSalesStore } from '@/stores/salesStore';
import { productUsdFromUzs } from '@/utils/currency';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatUzs, formatUsd } from '@/utils/format';
import type { DebtHistoryEntry, Payment, Sale } from '@/types/entities';
import type { SaleDetail } from '@/types/sales';

const statusLabels = { active: 'Faol', blocked: 'Bloklangan', archived: 'Arxivlangan' } as const;
const statusColors = { active: 'success', blocked: 'error', archived: 'default' } as const;

const debtTypeLabels: Record<DebtHistoryEntry['type'], string> = {
  sale_credit: 'Savdo (nasiya)',
  payment: "To'lov",
  return: 'Qaytarish',
  adjustment: 'Tuzatish',
  sale_void: 'Savdo bekor qilindi',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success } = useNotification();
  const customer = useCustomerStore((s) => s.getCustomerById(id ?? ''));
  const exchangeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);
  const getPaymentsByCustomer = useCustomerStore((s) => s.getPaymentsByCustomer);
  const getDebtHistory = useCustomerStore((s) => s.getDebtHistory);
  const fetchDebtHistory = useCustomerStore((s) => s.fetchDebtHistory);
  const archiveCustomer = useCustomerStore((s) => s.archiveCustomer);
  const getSalesByCustomerId = useSalesStore((s) => s.getSalesByCustomerId);
  const [tab, setTab] = useState(0);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    if (id) void fetchDebtHistory(id);
  }, [id, fetchDebtHistory]);

  const customerSales = useMemo(
    () => (id ? getSalesByCustomerId(id) : []),
    [id, getSalesByCustomerId],
  );

  const customerPayments = useMemo(
    () => (id ? getPaymentsByCustomer(id) : []),
    [id, getPaymentsByCustomer],
  );

  const debtHistory = useMemo(
    () => (id ? getDebtHistory(id) : []),
    [id, getDebtHistory],
  );

  const saleStatusLabels: Record<Sale['status'], string> = {
    completed: 'Yakunlangan',
    partially_returned: 'Qisman qaytarilgan',
    voided: 'Bekor qilingan',
    returned: 'Qaytarilgan',
  };

  const paymentMethodLabels = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma" } as const;

  const saleColumns: Column<SaleDetail>[] = useMemo(
    () => [
      { id: 'number', label: 'Raqam', render: (r) => r.number },
      { id: 'totalUzs', label: 'Summa', align: 'right', render: (r) => formatUzs(r.totalUzs) },
      { id: 'status', label: 'Holat', render: (r) => saleStatusLabels[r.status] },
      { id: 'createdAt', label: 'Sana', render: (r) => formatDateTime(r.createdAt) },
    ],
    [],
  );

  const handleArchive = async () => {
    if (!customer) return;
    await archiveCustomer(customer.id);
    success('Mijoz arxivlandi');
    navigate('/customers');
  };

  if (!customer) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" gutterBottom>
          Mijoz topilmadi
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
          Ro&apos;yxatga qaytish
        </Button>
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={customer.phone}
        secondaryActions={
          <>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
              Orqaga
            </Button>
            {customer.status !== 'archived' && (
              <>
                <Button startIcon={<EditIcon />} onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                  Tahrirlash
                </Button>
                <Button startIcon={<ArchiveIcon />} color="warning" onClick={() => setConfirmArchive(true)}>
                  Arxivlash
                </Button>
              </>
            )}
          </>
        }
        primaryAction={{
          label: "To'lov qabul qilish",
          onClick: () => navigate(`/customers/${customer.id}/payment`),
        }}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Jami xaridlar" value={formatUzs(customer.totalPurchasesUzs)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Qarz (UZS)"
            value={formatUzs(customer.debtUzs)}
            secondaryValue={customer.debtUzs > 0 ? formatUsd(productUsdFromUzs(customer.debtUzs, exchangeRate)) : undefined}
            currencyColor="uzs"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ p: 2, minHeight: 120 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Holat
            </Typography>
            <Box sx={{ mt: 1 }}>
              <StatusChip label={statusLabels[customer.status]} color={statusColors[customer.status]} />
            </Box>
            {customer.email && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {customer.email}
              </Typography>
            )}
            {customer.address && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {customer.address}
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`Savdolar (${customerSales.length})`} />
          <Tab label={`To'lovlar (${customerPayments.length})`} />
          <Tab label={`Qarz tarixi (${debtHistory.length})`} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tab === 0 && (
            <DataTable
              columns={saleColumns}
              rows={customerSales}
              rowKey={(r) => r.id}
              dense
              onRowClick={(r) => navigate(`/sales/history/${r.id}`)}
            />
          )}
          {tab === 1 && (
            <DataTable
              columns={[
                { id: 'amountUzs', label: 'Summa', align: 'right', render: (r: Payment) => formatUzs(r.amountUzs) },
                { id: 'method', label: 'Usul', render: (r: Payment) => paymentMethodLabels[r.method] },
                { id: 'recordedBy', label: 'Qayd etdi', render: (r: Payment) => r.recordedBy },
                { id: 'createdAt', label: 'Sana', render: (r: Payment) => formatDateTime(r.createdAt) },
              ]}
              rows={customerPayments}
              rowKey={(r) => r.id}
              dense
            />
          )}
          {tab === 2 && (
            <DataTable
              columns={[
                { id: 'type', label: 'Turi', render: (r: DebtHistoryEntry) => debtTypeLabels[r.type] },
                { id: 'amountUzs', label: 'Summa', align: 'right', render: (r: DebtHistoryEntry) => formatUzs(r.amountUzs) },
                { id: 'balanceAfterUzs', label: 'Qoldiq', align: 'right', render: (r: DebtHistoryEntry) => formatUzs(r.balanceAfterUzs) },
                { id: 'reference', label: 'Havola', render: (r: DebtHistoryEntry) => r.reference ?? '—' },
                { id: 'createdAt', label: 'Sana', render: (r: DebtHistoryEntry) => formatDateTime(r.createdAt) },
              ]}
              rows={debtHistory}
              rowKey={(r) => r.id}
              dense
            />
          )}
        </Box>
      </Card>

      <ConfirmDialog
        open={confirmArchive}
        title="Mijozni arxivlash"
        message={`${customer.name} arxivga o'tkaziladi.`}
        confirmLabel="Arxivlash"
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchive(false)}
      />
    </>
  );
}
