import { useMemo, useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { StatCard } from '@/components/organisms/StatCard';
import { FormDialog } from '@/components/forms/FormDialog';
import { useListState } from '@/hooks/useListState';
import { useAuthStore } from '@/stores/authStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatRate } from '@/utils/currency';
import type { ExchangeRate } from '@/types/entities';

const statusLabels: Record<ExchangeRate['status'], string> = {
  active: 'Faol',
  archived: 'Arxiv',
};

const statusColors: Record<ExchangeRate['status'], 'success' | 'default'> = {
  active: 'success',
  archived: 'default',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function CurrencyPage() {
  const userName = useAuthStore((s) => {
    const u = s.user;
    return u ? `${u.firstName} ${u.lastName}`.trim() || 'User' : 'User';
  });
  const setRate = useCurrencyStore((s) => s.setRate);
  const rawRates = useCurrencyStore((s) => s.rates);
  const rates = useMemo(
    () =>
      [...rawRates].sort(
        (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime(),
      ),
    [rawRates],
  );
  const activeRate = useMemo(
    () => rawRates.find((r) => r.status === 'active'),
    [rawRates],
  );
  const { success, error: notifyError } = useNotification();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState('');

  const searchFields = useMemo(
    () => (r: ExchangeRate) => [String(r.rate), r.setBy],
    [],
  );

  const { page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(rates, searchFields);

  const columns: Column<ExchangeRate>[] = useMemo(
    () => [
      {
        id: 'rate',
        label: '1 USD =',
        sortable: true,
        align: 'right',
        render: (r) => formatRate(r.rate),
      },
      {
        id: 'effectiveFrom',
        label: 'Amal qilish sanasi',
        sortable: true,
        render: (r) => formatDateTime(r.effectiveFrom),
      },
      { id: 'setBy', label: "O'rnatdi", render: (r) => r.setBy },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => <StatusChip label={statusLabels[r.status]} color={statusColors[r.status]} />,
      },
    ],
    [],
  );

  const handleSetRate = async () => {
    const rate = parseInt(newRate.replace(/\s/g, ''), 10);
    if (!rate || rate < 1000) {
      notifyError('To\'g\'ri kurs kiriting (masalan: 12620)');
      return;
    }
    try {
      await setRate(rate, userName);
      success(`Yangi kurs o'rnatildi: ${formatRate(rate)}`);
      setDialogOpen(false);
      setNewRate('');
    } catch {
      notifyError('Kursni saqlashda xatolik');
    }
  };

  return (
    <>
      <PageHeader
        title="Valyuta kursi"
        subtitle="USD/UZS kursi tarixi va joriy kurs"
        primaryAction={{ label: 'Yangi kurs', onClick: () => setDialogOpen(true) }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          label="Joriy kurs"
          value={activeRate ? formatRate(activeRate.rate) : '—'}
          meta={activeRate ? `${formatDateTime(activeRate.effectiveFrom)} dan` : undefined}
          currencyColor="uzs"
        />
        <StatCard label="Tarixdagi yozuvlar" value={String(rates.length)} />
      </Box>

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

      <FormDialog
        open={dialogOpen}
        title="Yangi valyuta kursi"
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSetRate}
        submitLabel="Saqlash"
      >
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="1 USD = (so'm)"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            placeholder="12620"
            autoFocus
          />
          {activeRate && (
            <Box sx={{ mt: 2, typography: 'body2', color: 'text.secondary' }}>
              Joriy kurs: {formatRate(activeRate.rate)}
            </Box>
          )}
        </Box>
      </FormDialog>
    </>
  );
}
