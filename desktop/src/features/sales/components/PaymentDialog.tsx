import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { PaymentMethod } from '@/types/sales';
import { formatUzs, formatUsd } from '@/utils/format';
import { calcChange } from '@/stores/posCartStore';

interface PaymentDialogProps {
  open: boolean;
  totalUzs: number;
  totalUsd: number;
  currency: 'UZS' | 'USD';
  hasCustomer: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (data: {
    method: PaymentMethod;
    receivedUzs: number;
    receivedUsd?: number;
    dialogCurrency: 'UZS' | 'USD';
  }) => void;
}

export function PaymentDialog({
  open,
  totalUzs,
  totalUsd,
  currency,
  hasCustomer,
  loading,
  onClose,
  onConfirm,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [dialogCurrency, setDialogCurrency] = useState<'UZS' | 'USD'>(currency);
  const [received, setReceived] = useState('');
  const [credit, setCredit] = useState('');

  const receivedNum = parseFloat(received.replace(/\s/g, '').replace(',', '.')) || 0;
  const creditNum = parseFloat(credit.replace(/\s/g, '')) || 0;

  const isUsd = dialogCurrency === 'USD';
  const payTotal = isUsd ? totalUsd : totalUzs;
  const change = method === 'cash' ? calcChange(receivedNum, payTotal) : 0;

  const mixedCreditAuto = Math.max(0, payTotal - receivedNum);
  const remainingUnpaid = Math.max(0, payTotal - receivedNum - creditNum);
  const effectiveCredit = method === 'mixed' ? (creditNum > 0 ? creditNum : mixedCreditAuto) : 0;

  const validationError = useMemo(() => {
    if (method === 'credit' && !hasCustomer) {
      return 'Nasiyaga sotish uchun mijoz tanlang.';
    }
    if (method === 'mixed' && !hasCustomer) {
      return 'Aralash to\'lov uchun mijoz tanlang.';
    }
    if (method === 'cash') {
      if (isUsd) {
        if (receivedNum + 0.001 < totalUsd) {
          return `Naqd to'lov yetarli emas. Kamida $${totalUsd.toFixed(2)} kerak.`;
        }
      } else if (receivedNum < totalUzs) {
        return `Naqd to'lov yetarli emas. Kamida ${formatUzs(totalUzs)} kerak.`;
      }
    }
    if (method === 'mixed') {
      if (receivedNum <= 0) {
        return 'Naqd qism 0 dan katta bo\'lishi kerak.';
      }
      if (receivedNum >= payTotal) {
        return 'Aralash to\'lovda naqd qism jami summadan kam bo\'lishi kerak.';
      }
      const creditPart = creditNum > 0 ? creditNum : mixedCreditAuto;
      if (Math.abs(receivedNum + creditPart - payTotal) > (isUsd ? 0.01 : 1)) {
        return `Naqd + nasiya jami ${isUsd ? formatUsd(payTotal) : formatUzs(payTotal)} ga teng bo\'lishi kerak.`;
      }
    }
    return null;
  }, [method, hasCustomer, receivedNum, creditNum, totalUzs, totalUsd, isUsd, payTotal, mixedCreditAuto]);

  useEffect(() => {
    if (open) {
      setDialogCurrency(currency);
      setMethod('cash');
    }
  }, [open, currency]);

  useEffect(() => {
    if (!open) return;
    if (dialogCurrency === 'USD') {
      setReceived(totalUsd.toFixed(2));
    } else {
      setReceived(String(Math.ceil(totalUzs)));
    }
    setCredit('0');
  }, [dialogCurrency, open, totalUzs, totalUsd]);

  useEffect(() => {
    if (method === 'mixed' && open) {
      const next = String(Math.max(0, payTotal - receivedNum));
      setCredit((prev) => (prev === next ? prev : next));
    }
  }, [method, receivedNum, payTotal, open]);

  const handleConfirm = () => {
    if (validationError) return;
    onConfirm({
      method,
      receivedUzs: dialogCurrency === 'UZS' ? Math.round(receivedNum) : 0,
      receivedUsd: dialogCurrency === 'USD' ? receivedNum : undefined,
      dialogCurrency,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>To&apos;lov</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Jami to&apos;lov
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {isUsd ? formatUsd(totalUsd) : formatUzs(totalUzs)}
          </Typography>
          {!isUsd && (
            <Typography variant="caption" color="text.secondary">
              ({formatUsd(totalUsd)} ekvivalent)
            </Typography>
          )}
          {isUsd && (
            <Typography variant="caption" color="text.secondary">
              ({formatUzs(totalUzs)} ekvivalent)
            </Typography>
          )}
        </Box>

        <FormControl sx={{ mb: 2, display: 'block' }}>
          <FormLabel>To&apos;lov Valyutasi</FormLabel>
          <RadioGroup
            row
            value={dialogCurrency}
            onChange={(e) => setDialogCurrency(e.target.value as 'UZS' | 'USD')}
          >
            <FormControlLabel value="UZS" control={<Radio />} label="UZS" />
            <FormControlLabel value="USD" control={<Radio />} label="USD" />
          </RadioGroup>
        </FormControl>

        <FormControl sx={{ mb: 2 }}>
          <FormLabel>To&apos;lov turi</FormLabel>
          <RadioGroup
            row
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            <FormControlLabel value="cash" control={<Radio />} label="Naqd" />
            <FormControlLabel
              value="credit"
              control={<Radio />}
              label="Nasiya (qarz)"
              disabled={!hasCustomer}
            />
            <FormControlLabel
              value="mixed"
              control={<Radio />}
              label="Aralash"
              disabled={!hasCustomer}
            />
          </RadioGroup>
        </FormControl>

        {!hasCustomer && (method === 'credit' || method === 'mixed') && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Nasiyaga sotish uchun mijoz tanlang.
          </Alert>
        )}

        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        {method === 'cash' && (
          <>
            <TextField
              fullWidth
              label={isUsd ? 'Qabul qilingan summa (USD)' : 'Qabul qilingan summa (UZS)'}
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              sx={{ mb: 1 }}
              inputProps={isUsd ? { step: '0.01', min: 0 } : { step: 1, min: 0 }}
            />
            {change > 0 && (
              <Typography variant="body2" color="success.main">
                Qaytim: {isUsd ? formatUsd(change) : formatUzs(change)}
              </Typography>
            )}
          </>
        )}

        {method === 'credit' && hasCustomer && (
          <Alert severity="info">
            Butun summa ({isUsd ? formatUsd(totalUsd) : formatUzs(totalUzs)}) mijoz qarziga yoziladi.
          </Alert>
        )}

        {method === 'mixed' && (
          <>
            <TextField
              fullWidth
              label={`Naqd qism (${dialogCurrency})`}
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={`Nasiya qismi (${dialogCurrency})`}
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              helperText={`Qolgan: ${isUsd ? formatUsd(remainingUnpaid) : formatUzs(remainingUnpaid)}`}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Bekor qilish
        </Button>
        <Button
          id="complete-sale-btn"
          variant="contained"
          onClick={handleConfirm}
          disabled={loading || Boolean(validationError)}
        >
          {loading ? 'Jarayonda…' : 'Tasdiqlash'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

