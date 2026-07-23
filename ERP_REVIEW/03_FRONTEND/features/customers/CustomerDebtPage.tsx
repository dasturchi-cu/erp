import { useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { StatCard } from '@/components/organisms/StatCard';
import { useListState } from '@/hooks/useListState';
import { useCustomerStore } from '@/stores/customerStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { productUsdFromUzs } from '@/utils/currency';
import { formatUzs, formatUsd } from '@/utils/format';
import type { Customer } from '@/types/entities';

export function CustomerDebtPage() {
  const navigate = useNavigate();
  const allCustomers = useCustomerStore((s) => s.customers);
  const exchangeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);

  const debtors = useMemo(
    () =>
      allCustomers
        .filter((c) => c.status !== 'archived' && c.debtUzs > 0)
        .sort((a, b) => b.debtUzs - a.debtUzs),
    [allCustomers],
  );

  const totalDebtUzs = debtors.reduce((s, c) => s + c.debtUzs, 0);
  const totalDebtUsd = productUsdFromUzs(totalDebtUzs, exchangeRate);

  const searchFields = useCallback(
    (c: Customer) => [c.name, c.phone],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(debtors, searchFields);

  const columns: Column<Customer>[] = useMemo(
    () => [
      { id: 'name', label: 'Mijoz', sortable: true, render: (r) => r.name },
      { id: 'phone', label: 'Telefon', render: (r) => r.phone },
      {
        id: 'debtUzs',
        label: 'Qarz (UZS)',
        sortable: true,
        align: 'right',
        render: (r) => formatUzs(r.debtUzs),
      },
      {
        id: 'debtUsd',
        label: 'Qarz (USD)',
        align: 'right',
        render: (r) => formatUsd(productUsdFromUzs(r.debtUzs, exchangeRate)),
      },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => (
          <StatusChip
            label={r.status === 'blocked' ? 'Bloklangan' : r.status === 'archived' ? 'Arxiv' : 'Faol'}
            color={r.status === 'blocked' ? 'error' : 'success'}
          />
        ),
      },
    ],
    [exchangeRate],
  );

  return (
    <>
      <PageHeader
        title="Qarzdorlik"
        subtitle="Qarzdor mijozlar va umumiy qarz summasi"
        primaryAction={{ label: "To'lov qabul qilish", onClick: () => navigate('/customers/payments') }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard label="Qarzdor mijozlar" value={String(debtors.length)} />
        <StatCard label="Jami qarz (UZS)" value={formatUzs(totalDebtUzs)} currencyColor="uzs" />
        <StatCard label="Jami qarz (USD)" value={formatUsd(totalDebtUsd)} currencyColor="usd" />
      </Box>

      <FilterBar search={{ value: search, onChange: setSearch, placeholder: 'Mijoz nomi yoki telefon…' }} />

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
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
      />
    </>
  );
}
