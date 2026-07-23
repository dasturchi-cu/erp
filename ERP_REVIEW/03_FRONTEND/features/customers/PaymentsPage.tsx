import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
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
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useCustomerStore } from '@/stores/customerStore';
import { formatUzs, formatUsd } from '@/utils/format';
import type { Customer, Payment } from '@/types/entities';

const methodLabels: Record<Payment['method'], string> = {
  cash: 'Naqd',
  card: 'Karta',
  transfer: "O'tkazma",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function PaymentsPage() {
  const navigate = useNavigate();
  const payments = useCustomerStore((s) => s.payments);
  const customers = useCustomerStore((s) => s.customers);
  const [methodFilter, setMethodFilter] = useState('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const filtered = useMemo(
    () => (methodFilter === 'all' ? payments : payments.filter((p) => p.method === methodFilter)),
    [payments, methodFilter],
  );

  const searchFields = useCallback(
    (p: Payment) => [p.customerName, p.recordedBy],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const debtCustomers = customers.filter((c) => c.debtUzs > 0 && c.status === 'active');

  const columns: Column<Payment>[] = useMemo(
    () => [
      { id: 'customerName', label: 'Mijoz', sortable: true, render: (r) => r.customerName },
      {
        id: 'amountUzs',
        label: 'Summa (UZS)',
        sortable: true,
        align: 'right',
        render: (r) => formatUzs(r.amountUzs),
      },
      {
        id: 'amountUsd',
        label: 'Summa (USD)',
        align: 'right',
        render: (r) => formatUsd(r.amountUsd),
      },
      { id: 'method', label: "To'lov usuli", render: (r) => methodLabels[r.method] },
      { id: 'recordedBy', label: 'Qayd etdi', render: (r) => r.recordedBy },
      { id: 'createdAt', label: 'Sana', sortable: true, render: (r) => formatDateTime(r.createdAt) },
    ],
    [],
  );

  const handleNewPayment = () => {
    if (selectedCustomerId) {
      setPickerOpen(false);
      navigate(`/customers/${selectedCustomerId}/payment`);
    }
  };

  return (
    <>
      <PageHeader
        title="To'lovlar"
        subtitle="Mijoz to'lovlari jurnali"
        primaryAction={{ label: "Yangi to'lov", onClick: () => setPickerOpen(true) }}
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Mijoz yoki kassir…' }}
        filters={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Usul</InputLabel>
            <Select value={methodFilter} label="Usul" onChange={(e) => setMethodFilter(e.target.value)}>
              <MenuItem value="all">Barchasi</MenuItem>
              <MenuItem value="cash">Naqd</MenuItem>
              <MenuItem value="card">Karta</MenuItem>
              <MenuItem value="transfer">O&apos;tkazma</MenuItem>
            </Select>
          </FormControl>
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
      />

      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Mijozni tanlang</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Qarzdor mijoz</InputLabel>
            <Select
              value={selectedCustomerId}
              label="Qarzdor mijoz"
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              {debtCustomers.map((c: Customer) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} — {formatUzs(c.debtUzs)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {debtCustomers.length === 0 && (
            <Box sx={{ mt: 2 }}>
              <Button fullWidth onClick={() => { setPickerOpen(false); navigate('/customers/new'); }}>
                Yangi mijoz yaratish
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickerOpen(false)}>Bekor qilish</Button>
          <Button variant="contained" disabled={!selectedCustomerId} onClick={handleNewPayment}>
            Davom etish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
