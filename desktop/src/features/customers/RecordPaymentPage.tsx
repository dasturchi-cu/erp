import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CircularProgress, MenuItem, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { useCustomerStore } from '@/stores/customerStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatUzs, formatUsd } from '@/utils/format';
import { uzsToUsdFloor, usdToUzs } from '@/utils/currency';
import { getErrorMessage } from '@/utils/errors';
import { useIdempotencyKey } from '@/hooks/useIdempotencyKey';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Minimal miqdor kiritilishi shart'),
  currency: z.enum(['UZS', 'USD']),
  method: z.enum(['cash', 'card', 'transfer']),
  note: z.string().optional(),
});

export function RecordPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const customer = useCustomerStore((s) => s.customers.find((c) => c.id === id));
  const user = useAuthStore((s) => s.user);
  // No hardcoded fallback: a stale rate would convert USD wrongly.
  const activeRate = useCurrencyStore(
    (s) => s.activeRate || s.rates.find((r) => r.status === 'active')?.rate || 0,
  );
  const [loadingCustomer, setLoadingCustomer] = useState(!customer);
  const opKey = useIdempotencyKey();

  // The store only holds what the list fetched; load this customer directly
  // when it isn't there (deep link, list not loaded yet).
  useEffect(() => {
    if (!id || customer) {
      setLoadingCustomer(false);
      return;
    }
    let cancelled = false;
    setLoadingCustomer(true);
    void useCustomerStore
      .getState()
      .fetchCustomerById(id)
      .finally(() => {
        if (!cancelled) setLoadingCustomer(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, customer]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: customer?.debtUzs ?? 0, currency: 'UZS', method: 'cash', note: '' },
  });

  const amount = watch('amount');
  const currency = watch('currency');

  // Prefill the full debt once the customer is known (it may load after mount).
  const debtUzs = customer?.debtUzs;
  useEffect(() => {
    if (debtUzs == null) return;
    setValue('amount', currency === 'UZS' ? debtUzs : uzsToUsdFloor(debtUzs, activeRate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debtUzs]);

  if (!customer) {
    if (loadingCustomer) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      );
    }
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Mijoz topilmadi</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/customers')}>Orqaga</Button>
      </Box>
    );
  }

  const rateMissing = currency === 'USD' && activeRate <= 0;
  // USD is floored to the cent: the server converts USD x rate and rejects any
  // amount above the UZS debt, so a rounded-up USD payoff would always fail.
  const maxDebt = currency === 'UZS' ? customer.debtUzs : uzsToUsdFloor(customer.debtUzs, activeRate);
  const usdPayoffRemainderUzs =
    currency === 'USD' && activeRate > 0 && maxDebt > 0 && Number(amount) >= maxDebt
      ? Math.max(0, Math.round(customer.debtUzs - usdToUzs(maxDebt, activeRate)))
      : 0;

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (data.currency === 'USD' && activeRate <= 0) {
      notifyError("Valyuta kursi yuklanmagan. USD to'lov uchun avval kursni kiriting yoki UZS da to'lang.");
      return;
    }
    if (data.amount > maxDebt) {
      notifyError('To\'lov miqdori qarzdan oshmasligi kerak');
      return;
    }
    const paidUzs = data.currency === 'UZS' ? data.amount : usdToUzs(data.amount, activeRate);
    try {
      const recordedBy = user ? `${user.firstName} ${user.lastName}`.trim() : 'Kassir';
      await useCustomerStore.getState().recordPayment(customer.id, {
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        note: data.note,
        recordedBy,
        idempotencyKey: opKey.get(),
        // A floored USD payoff can leave a few so'm, so compare in UZS.
        paymentType: paidUzs >= customer.debtUzs ? 'FULL' : 'PARTIAL',
      });
      opKey.reset();
      success('To\'lov qayd etildi');
      navigate(`/customers/${customer.id}`);
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, 'To\'lovni saqlashda xatolik'));
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cur = e.target.value as 'UZS' | 'USD';
    setValue('currency', cur);
    setValue('amount', cur === 'UZS' ? customer.debtUzs : uzsToUsdFloor(customer.debtUzs, activeRate));
  };

  const payFullInUzs = () => {
    setValue('currency', 'UZS');
    setValue('amount', customer.debtUzs);
  };

  return (
    <>
      <PageHeader title="To'lov qabul qilish" subtitle={customer.name} />
      <Card variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Joriy qarz: {formatUzs(customer.debtUzs)}
          {activeRate > 0 && <> ({formatUsd(customer.debtUzs / activeRate)} ekvivalent)</>}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {activeRate > 0 ? (
            <>Kurs: 1 USD = {activeRate.toLocaleString()} so&apos;m</>
          ) : (
            'Valyuta kursi yuklanmagan'
          )}
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Valyuta"
            value={currency}
            onChange={handleCurrencyChange}
          >
            <MenuItem value="UZS">UZS</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </TextField>
          {rateMissing && (
            <Alert severity="warning">
              Valyuta kursi yuklanmagan — USD to&apos;lov qabul qilib bo&apos;lmaydi. UZS da to&apos;lang.
            </Alert>
          )}
          <TextField
            label={`Summa (${currency})`}
            type="number"
            {...register('amount')}
            error={!!errors.amount}
            helperText={errors.amount?.message ?? (amount > maxDebt ? 'Qarzdan oshib ketdi' : undefined)}
            InputLabelProps={{ shrink: true }}
          />
          {usdPayoffRemainderUzs > 0 && (
            <Alert
              severity="info"
              action={
                <Button color="inherit" size="small" onClick={payFullInUzs}>
                  UZS da to&apos;lash
                </Button>
              }
            >
              USD sentgacha yaxlitlanadi: {formatUsd(maxDebt)} to&apos;langandan keyin{' '}
              {formatUzs(usdPayoffRemainderUzs)} qarz qoladi. Qoldiqni keyin UZS da to&apos;lang yoki
              butun summani UZS da qabul qiling.
            </Alert>
          )}
          <TextField select label="To'lov usuli" {...register('method')}>
            <MenuItem value="cash">Naqd</MenuItem>
            <MenuItem value="card">Karta</MenuItem>
            <MenuItem value="transfer">O&apos;tkazma</MenuItem>
          </TextField>
          <TextField label="Izoh" multiline rows={2} {...register('note')} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => navigate(-1)} disabled={isSubmitting}>Bekor qilish</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || maxDebt === 0 || rateMissing}
            >
              {isSubmitting ? 'Saqlanmoqda…' : 'Saqlash'}
            </Button>
          </Box>
        </Box>
      </Card>
    </>
  );
}
