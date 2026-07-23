import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Card, MenuItem, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { useSupplierStore } from '@/stores/supplierStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatUzs, formatUsd } from '@/utils/format';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Minimal miqdor kiritilishi shart'),
  currency: z.enum(['UZS', 'USD']),
  method: z.enum(['cash', 'card', 'transfer']),
  note: z.string().optional(),
});

export function RecordSupplierPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const supplier = useSupplierStore((s) =>
    id ? s.suppliers.find((su) => su.id === id) : undefined,
  );
  const isLoading = useSupplierStore((s) => s.isLoading);
  const fetchSuppliers = useSupplierStore((s) => s.fetchSuppliers);
  const recordPayment = useSupplierStore((s) => s.recordPayment);
  const activeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch, setValue } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, currency: 'UZS', method: 'cash', note: '' },
  });

  const amount = watch('amount');
  const currency = watch('currency');

  useEffect(() => {
    if (id) void fetchSuppliers();
  }, [id, fetchSuppliers]);

  useEffect(() => {
    if (supplier) {
      reset({
        amount: currency === 'UZS' ? supplier.remainingDebtUzs : Number((supplier.remainingDebtUzs / activeRate).toFixed(2)),
        currency: currency,
        method: 'cash',
        note: '',
      });
    }
  }, [supplier, reset, currency]);

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
        <Button sx={{ mt: 2 }} onClick={() => navigate('/suppliers')}>Orqaga</Button>
      </Box>
    );
  }

  const maxDebt = currency === 'UZS' ? supplier.remainingDebtUzs : Number((supplier.remainingDebtUzs / activeRate).toFixed(2));

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (data.amount > maxDebt) {
      notifyError("To'lov miqdori qarzdan oshmasligi kerak");
      return;
    }
    try {
      await recordPayment(supplier.id, {
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        note: data.note,
      });
      success("To'lov qayd etildi");
      navigate(`/suppliers/${supplier.id}`);
    } catch {
      notifyError("To'lovni saqlashda xatolik");
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cur = e.target.value as 'UZS' | 'USD';
    setValue('currency', cur);
    setValue('amount', cur === 'UZS' ? supplier.remainingDebtUzs : Number((supplier.remainingDebtUzs / activeRate).toFixed(2)));
  };

  return (
    <>
      <PageHeader title="Firma to'lovi" subtitle={supplier.name} />
      <Card variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Qoldiq qarz: {formatUzs(supplier.remainingDebtUzs)} ({formatUsd(supplier.remainingDebtUzs / activeRate)} ekvivalent)
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            select
            label="Valyuta"
            value={currency}
            onChange={handleCurrencyChange}
          >
            <MenuItem value="UZS">UZS</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </TextField>
          <TextField
            label={`Summa (${currency})`}
            type="number"
            {...register('amount')}
            error={!!errors.amount}
            helperText={errors.amount?.message}
            InputLabelProps={{ shrink: true }}
          />
          <TextField select label="To'lov turi" {...register('method')}>
            <MenuItem value="cash">Naqd</MenuItem>
            <MenuItem value="card">Karta</MenuItem>
            <MenuItem value="transfer">O&apos;tkazma</MenuItem>
          </TextField>
          <TextField label="Izoh" multiline rows={2} {...register('note')} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => navigate(-1)}>Bekor</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting || maxDebt === 0 || amount > maxDebt}>
              Saqlash
            </Button>
          </Box>
        </Box>
      </Card>
    </>
  );
}
