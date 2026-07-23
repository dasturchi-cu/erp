import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useListState } from '@/hooks/useListState';
import { useSupplierStore } from '@/stores/supplierStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatUzs } from '@/utils/format';
import type { Supplier } from '@/types/entities';

const statusLabels: Record<Supplier['status'], string> = {
  active: 'Faol',
  archived: 'Arxiv',
};

const statusColors: Record<Supplier['status'], 'success' | 'default'> = {
  active: 'success',
  archived: 'default',
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function SuppliersPage() {
  const navigate = useNavigate();
  const { success } = useNotification();
  const suppliers = useSupplierStore((s) => s.suppliers);
  const isLoading = useSupplierStore((s) => s.isLoading);
  const storeError = useSupplierStore((s) => s.error);
  const fetchSuppliers = useSupplierStore((s) => s.fetchSuppliers);
  const archiveSupplier = useSupplierStore((s) => s.archiveSupplier);
  const restoreSupplier = useSupplierStore((s) => s.restoreSupplier);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Supplier | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Supplier | null>(null);

  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);

  const filtered = useMemo(() => {
    let list = showArchived ? suppliers : suppliers.filter((s) => s.status !== 'archived');
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter);
    }
    return list;
  }, [suppliers, statusFilter, showArchived]);

  const searchFields = useMemo(
    () => (s: Supplier) => [s.name, s.phone, s.contactPerson ?? ''],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    await archiveSupplier(archiveTarget.id);
    success(`${archiveTarget.name} arxivlandi`);
    setArchiveTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    await restoreSupplier(restoreTarget.id);
    success(`${restoreTarget.name} tiklandi`);
    setRestoreTarget(null);
  };

  const columns: Column<Supplier>[] = useMemo(
    () => [
      { id: 'name', label: 'Firma nomi', sortable: true, render: (r) => r.name },
      { id: 'phone', label: 'Telefon', render: (r) => r.phone },
      { id: 'contactPerson', label: "Mas'ul shaxs", render: (r) => r.contactPerson ?? '—' },
      {
        id: 'remainingDebtUzs',
        label: 'Qoldiq qarz',
        sortable: true,
        align: 'right',
        render: (r) => formatUzs(r.remainingDebtUzs),
      },
      { id: 'createdAt', label: 'Yaratilgan sana', sortable: true, render: (r) => formatDateTime(r.createdAt) },
      {
        id: 'status',
        label: 'Status',
        render: (r) => <StatusChip label={statusLabels[r.status]} color={statusColors[r.status]} />,
      },
      {
        id: 'actions',
        label: '',
        width: 120,
        render: (r) =>
          r.status === 'archived' ? (
            <Button size="small" onClick={(e) => { e.stopPropagation(); setRestoreTarget(r); }}>
              Tiklash
            </Button>
          ) : (
            <Button size="small" color="warning" onClick={(e) => { e.stopPropagation(); setArchiveTarget(r); }}>
              Arxiv
            </Button>
          ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Firmalar"
        subtitle="Yetkazib beruvchilar va qarz boshqaruvi"
        primaryAction={{ label: 'Yangi firma', onClick: () => navigate('/suppliers/new') }}
        secondaryActions={
          <Button onClick={() => navigate('/suppliers/payments')}>To&apos;lovlar</Button>
        }
      />

      {storeError && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {storeError}
        </Typography>
      )}

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Nomi, telefon…' }}
        filters={
          <>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">Barchasi</MenuItem>
                <MenuItem value="active">Faol</MenuItem>
                <MenuItem value="archived">Arxiv</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Checkbox checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />}
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
        onRowClick={(r) => navigate(`/suppliers/${r.id}`)}
        emptyMessage={isLoading ? 'Yuklanmoqda…' : 'Firmalar topilmadi'}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        title="Firmni arxivlash"
        message={archiveTarget ? `${archiveTarget.name} arxivlansinmi?` : ''}
        confirmLabel="Arxivlash"
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />
      <ConfirmDialog
        open={!!restoreTarget}
        title="Firmni tiklash"
        message={restoreTarget ? `${restoreTarget.name} faol holatga qaytarilsinmi?` : ''}
        confirmLabel="Tiklash"
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
      />
    </>
  );
}
