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
import { uzsToUsdFloor } from '@/utils/currency';
import { getErrorMessage } from '@/utils/errors';

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
  // 0 = not loaded: USD payment is blocked instead of using a hardcoded rate.
  const activeRate = useCurrencyStore(
    (s) => s.activeRate || s.rates.find((r) => r.status === 'active')?.rate || 0,
  );

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
        amount: currency === 'UZS' ? supplier.remainingDebtUzs : uzsToUsdFloor(supplier.remainingDebtUzs, activeRate),
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

  const maxDebt = currency === 'UZS' ? supplier.remainingDebtUzs : uzsToUsdFloor(supplier.remainingDebtUzs, activeRate);

  const rateMissing = currency === 'USD' && activeRate <= 0;

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (data.currency === 'USD' && activeRate <= 0) {
      notifyError("Valyuta kursi yuklanmagan. UZS da to'lang yoki avval kursni kiriting.");
      return;
    }
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
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, "To'lovni saqlashda xatolik"));
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cur = e.target.value as 'UZS' | 'USD';
    setValue('currency', cur);
    setValue('amount', cur === 'UZS' ? supplier.remainingDebtUzs : uzsToUsdFloor(supplier.remainingDebtUzs, activeRate));
  };

  return (
    <>
      <PageHeader title="Firma to'lovi" subtitle={supplier.name} />
      <Card variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Qoldiq qarz: {formatUzs(supplier.remainingDebtUzs)}
          {activeRate > 0 && <> ({formatUsd(supplier.remainingDebtUzs / activeRate)} ekvivalent)</>}
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
            <Button type="submit" variant="contained" disabled={isSubmitting || maxDebt === 0 || amount > maxDebt || rateMissing}>
              Saqlash
            </Button>
          </Box>
        </Box>
      </Card>
    </>
  );
}
