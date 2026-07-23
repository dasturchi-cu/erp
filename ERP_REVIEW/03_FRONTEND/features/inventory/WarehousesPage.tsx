import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import type { Warehouse } from '@/types/entities';
import { formatUzs } from '@/utils/format';

export function WarehousesPage() {
  const navigate = useNavigate();
  const warehouses = useInventoryStore((s) => s.warehouses);
  const branches = useInventoryStore((s) => s.branches);
  const fetchWarehouses = useInventoryStore((s) => s.fetchWarehouses);
  const fetchBranches = useInventoryStore((s) => s.fetchBranches);
  const createWarehouse = useInventoryStore((s) => s.createWarehouse);
  const { success, error: notifyError } = useNotification();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchWarehouses();
    void fetchBranches();
  }, [fetchWarehouses, fetchBranches]);

  const searchFields = useCallback(
    (w: Warehouse) => [w.name, w.branch, w.address],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(warehouses, searchFields);

  const handleCreate = async () => {
    if (!name.trim() || !branchId) {
      notifyError('Nom va filial tanlang');
      return;
    }
    setSaving(true);
    try {
      await createWarehouse({ name: name.trim(), branchId, address: address || undefined });
      success('Ombor yaratildi');
      setOpen(false);
      setName('');
      setAddress('');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Warehouse>[] = useMemo(
    () => [
      {
        id: 'name',
        label: 'Ombor nomi',
        sortable: true,
        render: (r) => (
          <>
            {r.name}
            {r.isDefault && (
              <Chip label="Asosiy" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
            )}
          </>
        ),
      },
      { id: 'branch', label: 'Filial', sortable: true, render: (r) => r.branch },
      { id: 'address', label: 'Manzil', render: (r) => r.address },
      {
        id: 'productCount',
        label: 'Mahsulotlar',
        sortable: true,
        align: 'right',
        render: (r) => r.productCount,
      },
      {
        id: 'totalValueUzs',
        label: 'Jami qiymat',
        sortable: true,
        align: 'right',
        render: (r) => formatUzs(r.totalValueUzs),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Omborxonalar"
        subtitle="Filial va ombor manzillari ro'yxati"
        primaryAction={{
          label: 'Yangi ombor',
          onClick: () => setOpen(true),
        }}
      />

      <FilterBar search={{ value: search, onChange: setSearch, placeholder: 'Ombor yoki filial…' }} />

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
        onRowClick={(row) => navigate(`/inventory/warehouses/${row.id}`)}
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yangi ombor</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="Nomi" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Filial</InputLabel>
            <Select value={branchId} label="Filial" onChange={(e) => setBranchId(e.target.value)}>
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Manzil" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor</Button>
          <Button variant="contained" startIcon={<AddIcon />} disabled={saving} onClick={() => void handleCreate()}>
            Yaratish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
