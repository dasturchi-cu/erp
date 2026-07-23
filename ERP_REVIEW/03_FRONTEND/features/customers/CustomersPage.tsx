import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useListState } from '@/hooks/useListState';
import { useCustomerStore } from '@/stores/customerStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatUzs } from '@/utils/format';
import type { Customer } from '@/types/entities';

const statusLabels: Record<Customer['status'], string> = {
  active: 'Faol',
  blocked: 'Bloklangan',
  archived: 'Arxivlangan',
};

const statusColors: Record<Customer['status'], 'success' | 'error' | 'default'> = {
  active: 'success',
  blocked: 'error',
  archived: 'default',
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function CustomersPage() {
  const navigate = useNavigate();
  const { success } = useNotification();
  const customers = useCustomerStore((s) => s.customers);
  const archiveCustomer = useCustomerStore((s) => s.archiveCustomer);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    let list = showArchived ? customers : customers.filter((c) => c.status !== 'archived');
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }
    return list;
  }, [customers, statusFilter, showArchived]);

  const searchFields = useMemo(
    () => (c: Customer) => [c.name, c.phone, c.email ?? ''],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    await archiveCustomer(archiveTarget.id);
    success(`${archiveTarget.name} arxivlandi`);
    setArchiveTarget(null);
  };

  const columns: Column<Customer>[] = useMemo(
    () => [
      { id: 'name', label: 'Ism', sortable: true, render: (r) => r.name },
      { id: 'phone', label: 'Telefon', render: (r) => r.phone },
      {
        id: 'debtUzs',
        label: 'Qarz (UZS)',
        sortable: true,
        align: 'right',
        render: (r) => (r.debtUzs > 0 ? formatUzs(r.debtUzs) : '—'),
      },
      {
        id: 'totalPurchasesUzs',
        label: 'Jami xaridlar',
        sortable: true,
        align: 'right',
        render: (r) => formatUzs(r.totalPurchasesUzs),
      },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => <StatusChip label={statusLabels[r.status]} color={statusColors[r.status]} />,
      },
      {
        id: 'lastPurchaseAt',
        label: 'Oxirgi xarid',
        sortable: true,
        render: (r) => formatDateTime(r.lastPurchaseAt),
      },
      {
        id: 'actions',
        label: 'Amallar',
        align: 'right',
        render: (r) =>
          r.status !== 'archived' ? (
            <Button
              size="small"
              color="warning"
              onClick={(e) => {
                e.stopPropagation();
                setArchiveTarget(r);
              }}
            >
              Arxivlash
            </Button>
          ) : null,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Mijozlar"
        subtitle="Mijozlar bazasi va xarid tarixi"
        primaryAction={{ label: 'Yangi mijoz', onClick: () => navigate('/customers/new') }}
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Ism, telefon yoki email…' }}
        filters={
          <>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Holat</InputLabel>
              <Select value={statusFilter} label="Holat" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">Barchasi</MenuItem>
                <MenuItem value="active">Faol</MenuItem>
                <MenuItem value="blocked">Bloklangan</MenuItem>
                <MenuItem value="archived">Arxivlangan</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              }
              label="Arxivlanganlarni ko'rsatish"
            />
          </>
        }
      />

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

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Mijozni arxivlash"
        message={`${archiveTarget?.name} arxivga o'tkaziladi. Davom etasizmi?`}
        confirmLabel="Arxivlash"
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </>
  );
}
