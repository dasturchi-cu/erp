import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  DialogActions,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { StatCard } from '@/components/organisms/StatCard';
import { FormDialog } from '@/components/forms/FormDialog';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { apiClient } from '@/api/client';
import { formatUzs, formatUsd } from '@/utils/format';

const categoryLabels: Record<string, string> = {
  RENT: 'Ijara',
  SALARY: 'Xodimlar maoshi',
  UTILITIES: 'Kommunal xizmatlar',
  SUPPLIES: 'Jihozlar/Ta\'minot',
  MARKETING: 'Reklama/Marketing',
  TRANSPORT: 'Transport/Logistika',
  MAINTENANCE: 'Texnik xizmat ko\'rsatish',
  OTHER: 'Boshqa xarajatlar',
};

const txSourceLabels: Record<string, string> = {
  SALES: 'Savdo tushumi',
  CUSTOMER_PAYMENT: 'Mijozdan to\'lov',
  EXPENSE: 'Xarajat',
  SUPPLIER_PAYMENT: 'Firmaga to\'lov',
};

interface CashBalance {
  balanceUzs: number;
  balanceUsd: number;
  salesUzs: number;
  salesUsd: number;
  customerUzs: number;
  customerUsd: number;
  expenseUzs: number;
  expenseUsd: number;
  supplierUzs: number;
  supplierUsd: number;
}

interface CashTransaction {
  id: string;
  type: 'INFLOW' | 'OUTFLOW';
  source: 'SALES' | 'CUSTOMER_PAYMENT' | 'EXPENSE' | 'SUPPLIER_PAYMENT';
  ref: string;
  amountUzs: number;
  amountUsd: number;
  description: string;
  date: string;
}

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  originalCurrency: 'UZS' | 'USD';
  amountUzs: number;
  amountUsd: number;
  expenseDate: string;
  notes?: string;
  createdAt: string;
}

export function ExpensesPage() {
  const { success, error: notifyError } = useNotification();
  const [tab, setTab] = useState(0);

  // States
  const [balance, setBalance] = useState<CashBalance | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesLimit, setExpensesLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState('OTHER');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Fetch functions
  const fetchBalance = useCallback(async () => {
    try {
      const res = await apiClient.get<CashBalance>('/expenses/cash-register');
      setBalance(res.data);
    } catch (err) {
      console.error('Kassa balansini yuklashda xatolik:', err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await apiClient.get<CashTransaction[]>('/expenses/cash-transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error('Kassa daftari yuklashda xatolik:', err);
    }
  }, []);

  const fetchExpensesList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: ExpenseItem[]; meta: { total: number } }>('/expenses', {
        params: { page: expensesPage, limit: expensesLimit },
      });
      setExpenses(res.data.data);
      setExpensesTotal(res.data.meta.total);
    } catch (err) {
      console.error('Xarajatlar ro\'yxati yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  }, [expensesPage, expensesLimit]);

  const loadAll = useCallback(() => {
    void fetchBalance();
    void fetchTransactions();
    void fetchExpensesList();
  }, [fetchBalance, fetchTransactions, fetchExpensesList]);

  useEffect(() => {
    loadAll();
  }, [expensesPage, expensesLimit]);

  // Actions
  const handleAddExpense = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      notifyError('Noto\'g\'ri summa kiritildi');
      return;
    }
    if (!description.trim()) {
      notifyError('Tavsif kiritilishi shart');
      return;
    }

    try {
      await apiClient.post('/expenses', {
        category,
        description: description.trim(),
        originalCurrency: currency,
        amount: numAmount,
        expenseDate,
        notes: notes.trim() || undefined,
      });
      success('Xarajat muvaffaqiyatli saqlandi');
      setDialogOpen(false);
      // Reset form
      setCategory('OTHER');
      setDescription('');
      setAmount('');
      setNotes('');
      setExpenseDate(new Date().toISOString().slice(0, 10));
      // Reload
      loadAll();
    } catch (err: any) {
      notifyError(err?.response?.data?.message || 'Xarajatni saqlashda xatolik');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Haqiqatan ham ushbu xarajatni o\'chirmoqchimisiz?')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      success('Xarajat o\'chirildi');
      loadAll();
    } catch (err: any) {
      notifyError(err?.response?.data?.message || 'O\'chirishda xatolik');
    }
  };

  // Columns for Cash Ledger / Transactions
  const ledgerColumns: Column<CashTransaction>[] = useMemo(
    () => [
      {
        id: 'type',
        label: 'Turi',
        render: (tx) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {tx.type === 'INFLOW' ? (
              <ArrowUpwardIcon color="success" sx={{ mr: 1, fontSize: 18 }} />
            ) : (
              <ArrowDownwardIcon color="error" sx={{ mr: 1, fontSize: 18 }} />
            )}
            <Typography variant="body2" fontWeight={600}>
              {tx.type === 'INFLOW' ? 'Kirim' : 'Chiqim'}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'source',
        label: 'Manba',
        render: (tx) => txSourceLabels[tx.source] || tx.source,
      },
      {
        id: 'description',
        label: 'Tavsif / Hujjat',
        render: (tx) => (
          <Box>
            <Typography variant="body2">{tx.description}</Typography>
            <Typography variant="caption" color="text.secondary">
              Ref: {tx.ref}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'amountUzs',
        label: 'Summa (UZS)',
        align: 'right',
        render: (tx) => (
          <Typography
            variant="body2"
            fontWeight={600}
            color={tx.type === 'INFLOW' ? 'success.main' : 'error.main'}
          >
            {tx.type === 'INFLOW' ? '+' : '-'} {formatUzs(tx.amountUzs)}
          </Typography>
        ),
      },
      {
        id: 'amountUsd',
        label: 'Summa (USD)',
        align: 'right',
        render: (tx) => (
          <Typography
            variant="body2"
            fontWeight={600}
            color={tx.type === 'INFLOW' ? 'success.main' : 'error.main'}
          >
            {tx.type === 'INFLOW' ? '+' : '-'} {formatUsd(tx.amountUsd)}
          </Typography>
        ),
      },
      {
        id: 'date',
        label: 'Sana / Vaqt',
        render: (tx) => new Date(tx.date).toLocaleString('uz-UZ'),
      },
    ],
    [],
  );

  // Columns for Expenses list
  const expenseColumns: Column<ExpenseItem>[] = useMemo(
    () => [
      {
        id: 'category',
        label: 'Kategoriya',
        render: (e) => categoryLabels[e.category] || e.category,
      },
      {
        id: 'description',
        label: 'Tavsif',
        render: (e) => (
          <Box>
            <Typography variant="body2">{e.description}</Typography>
            {e.notes && (
              <Typography variant="caption" color="text.secondary" display="block">
                Qayd: {e.notes}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        id: 'amountUzs',
        label: 'Summa (UZS)',
        align: 'right',
        render: (e) => formatUzs(e.amountUzs),
      },
      {
        id: 'amountUsd',
        label: 'Summa (USD)',
        align: 'right',
        render: (e) => formatUsd(e.amountUsd),
      },
      {
        id: 'expenseDate',
        label: 'Xarajat sanasi',
        render: (e) => new Date(e.expenseDate).toLocaleDateString('uz-UZ'),
      },
      {
        id: 'actions',
        label: 'Amallar',
        align: 'center',
        render: (e) => (
          <IconButton size="small" color="error" onClick={() => handleDeleteExpense(e.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Xarajatlar va Kassa"
        subtitle="Kassa balansi, kirim-chiqimlar tarixi va operatsion xarajatlar boshqaruvi"
        primaryAction={{ label: 'Xarajat qo\'shish', onClick: () => setDialogOpen(true) }}
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
          label="Kassa Balansi (UZS)"
          value={balance ? formatUzs(balance.balanceUzs) : '0 so\'m'}
          currencyColor="uzs"
        />
        <StatCard
          label="Kassa Balansi (USD)"
          value={balance ? formatUsd(balance.balanceUsd) : '$0.00'}
          currencyColor="usd"
        />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Kassa Daftari (Kirim/Chiqim)" />
          <Tab label="Xarajatlar Ro'yxati (CRUD)" />
        </Tabs>
      </Box>

      {tab === 0 ? (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }} fontWeight={600}>
            Pul oqimi jurnali (Kassa daftari)
          </Typography>
          <DataTable
            columns={ledgerColumns}
            rows={transactions}
            rowKey={(r) => r.id}
            total={transactions.length}
            pageSize={100}
          />
        </Card>
      ) : (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }} fontWeight={600}>
            Bevosita kiritilgan xarajatlar ro'yxati
          </Typography>
          <DataTable
            columns={expenseColumns}
            rows={expenses}
            rowKey={(r) => r.id}
            page={expensesPage}
            pageSize={expensesLimit}
            total={expensesTotal}
            onPageChange={setExpensesPage}
            onPageSizeChange={setExpensesLimit}
          />
        </Card>
      )}

      {/* Add Expense Form Dialog */}
      <FormDialog
        open={dialogOpen}
        title="Yangi Xarajat Yaratish"
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAddExpense}
        submitLabel="Saqlash"
      >
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Kategoriya</InputLabel>
              <Select
                value={category}
                label="Kategoriya"
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Xarajat tavsifi (masalan: Ofis ijarasi, Xodim oyligi)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Valyuta</InputLabel>
              <Select
                value={currency}
                label="Valyuta"
                onChange={(e) => setCurrency(e.target.value as 'UZS' | 'USD')}
              >
                <MenuItem value="UZS">UZS</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 8 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Summa"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Sana"
              InputLabelProps={{ shrink: true }}
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Qo'shimcha izohlar"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}
