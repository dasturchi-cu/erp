import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useSalesStore } from '@/stores/salesStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { salesApi } from '@/api/services';
import { formatUzs } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import { useIdempotencyKey } from '@/hooks/useIdempotencyKey';

/** Quantities are Decimal(18,4) on the server. */
function round4(value: number): number {
  return Number(value.toFixed(4));
}

function parseQty(raw: string | undefined): number {
  if (raw == null) return 0;
  const n = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function CreateReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error: notifyError } = useNotification();
  const user = useAuthStore((s) => s.user);
  const createReturn = useSalesStore((s) => s.createReturn);
  const fetchSaleById = useSalesStore((s) => s.fetchSaleById);
  const allSales = useSalesStore((s) => s.sales);
  const sales = useMemo(
    () => allSales.filter((sale) => sale.status === 'completed' || sale.status === 'partially_returned'),
    [allSales],
  );

  const initialSaleId = searchParams.get('saleId') ?? '';
  const [saleId, setSaleId] = useState(initialSaleId);
  const [reason, setReason] = useState('');
  const [selectedLines, setSelectedLines] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  // productId -> quantity already returned or pending return (server counts both).
  const [returnedQty, setReturnedQty] = useState<Record<string, number> | null>(null);
  const [loadingSale, setLoadingSale] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const returnKey = useIdempotencyKey();

  const sale = useMemo(() => allSales.find((s) => s.id === saleId), [allSales, saleId]);

  // Load the sale detail (cached list rows may be stale) and its previous returns.
  useEffect(() => {
    if (!saleId) {
      setReturnedQty(null);
      return;
    }
    let cancelled = false;
    setLoadingSale(true);
    setReturnedQty(null);
    void Promise.all([
      fetchSaleById(saleId),
      salesApi.listAllReturns().catch(() => null),
    ])
      .then(([, returns]) => {
        if (cancelled) return;
        if (!returns) {
          setReturnedQty({});
          return;
        }
        const map: Record<string, number> = {};
        for (const r of returns) {
          if (r.saleId !== saleId || r.status === 'rejected') continue;
          for (const li of r.lineItems) {
            map[li.productId] = round4((map[li.productId] ?? 0) + li.quantity);
          }
        }
        setReturnedQty(map);
      })
      .finally(() => {
        if (!cancelled) setLoadingSale(false);
      });
    return () => {
      cancelled = true;
    };
  }, [saleId, fetchSaleById]);

  const lines = useMemo(
    () =>
      // Wait for previous returns so defaults aren't computed from 0 returned.
      (returnedQty ? sale?.lineItems ?? [] : []).map((l) => {
        const returned = returnedQty?.[l.productId] ?? 0;
        return { ...l, returned, remaining: Math.max(0, round4(l.quantity - returned)) };
      }),
    [sale, returnedQty],
  );

  // Default each line's return quantity to what is still returnable, without
  // overwriting what the user typed when the store refreshes.
  useEffect(() => {
    setQuantities((prev) => {
      const next = { ...prev };
      for (const l of lines) if (next[l.productId] == null) next[l.productId] = String(l.remaining);
      return next;
    });
  }, [lines]);

  const toggleLine = (productId: string) => {
    setSelectedLines((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const lineErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const l of lines) {
      if (!selectedLines[l.productId]) continue;
      const qty = parseQty(quantities[l.productId]);
      if (qty <= 0) errs[l.productId] = "Miqdor 0 dan katta bo'lishi kerak";
      else if (round4(qty) > l.remaining) errs[l.productId] = `Ko'pi bilan ${l.remaining}`;
    }
    return errs;
  }, [lines, selectedLines, quantities]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!sale) {
      notifyError('Savdoni tanlang');
      return;
    }
    if (!reason.trim()) {
      notifyError('Qaytarish sababini kiriting');
      return;
    }
    if (Object.keys(lineErrors).length > 0) {
      notifyError("Qaytarish miqdorini to'g'rilang");
      return;
    }

    const lineItems = lines
      .filter((l) => selectedLines[l.productId])
      .map((l) => {
        const quantity = round4(parseQty(quantities[l.productId]));
        return {
          productId: l.productId,
          productName: l.productName,
          quantity,
          amountUzs: round4(l.unitPriceUzs * quantity),
        };
      })
      .filter((l) => l.quantity > 0);

    if (lineItems.length === 0) {
      notifyError('Kamida bitta mahsulotni tanlang');
      return;
    }

    setSubmitting(true);
    try {
      const ret = await createReturn({
        saleId: sale.id,
        reason,
        lineItems,
        recordedBy: user ? `${user.firstName} ${user.lastName}`.trim() : 'User',
        idempotencyKey: returnKey.get(),
      });
      returnKey.reset();
      success('Qaytarish so\'rovi yaratildi');
      navigate(`/sales/returns/${ret.id}`);
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, 'Qaytarish yaratishda xatolik'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTotal = lines
    .filter((l) => selectedLines[l.productId])
    .reduce((s, l) => s + l.unitPriceUzs * Math.max(0, parseQty(quantities[l.productId])), 0);

  return (
    <>
      <PageHeader title="Yangi qaytarish" subtitle="Savdo bo'yicha qaytarish so'rovi" />

      <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Savdo</InputLabel>
          <Select
            value={saleId}
            label="Savdo"
            onChange={(e) => {
              setSaleId(e.target.value);
              setSelectedLines({});
              setQuantities({});
              returnKey.reset();
            }}
          >
            {/* A deep-linked sale may not be in the cached list yet. */}
            {saleId && !sales.some((s) => s.id === saleId) && (
              <MenuItem value={saleId}>{sale ? `${sale.number} — ${sale.customerName}` : 'Yuklanmoqda…'}</MenuItem>
            )}
            {sales.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.number} — {s.customerName} ({formatUzs(s.totalUzs)})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loadingSale && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {sale && !loadingSale && (
          <>
            <Typography variant="subtitle2" fontWeight={600}>
              Qaytariladigan mahsulotlar
            </Typography>
            {lines.length > 0 && lines.every((l) => l.remaining <= 0) && (
              <Alert severity="info">Bu savdodagi barcha mahsulotlar allaqachon qaytarilgan.</Alert>
            )}
            {lines.map((line) => {
              const disabled = line.remaining <= 0;
              const checked = Boolean(selectedLines[line.productId]) && !disabled;
              return (
                <Box
                  key={line.productId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleLine(line.productId)}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{line.productName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sotilgan: {line.quantity} · {formatUzs(line.totalUzs)}
                      {line.returned > 0 && <> · Qaytarilgan: {line.returned}</>}
                      {' '}· Qaytarish mumkin: {line.remaining}
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    type="number"
                    label="Miqdor"
                    sx={{ width: 120 }}
                    disabled={!checked}
                    value={quantities[line.productId] ?? ''}
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [line.productId]: e.target.value }))
                    }
                    inputProps={{ min: 0, max: line.remaining, step: 'any' }}
                    error={checked && Boolean(lineErrors[line.productId])}
                    helperText={checked ? lineErrors[line.productId] : undefined}
                  />
                </Box>
              );
            })}
            {selectedTotal > 0 && (
              <Typography variant="body2">
                Qaytariladigan summa: <strong>{formatUzs(selectedTotal)}</strong>
              </Typography>
            )}
          </>
        )}

        <TextField
          label="Qaytarish sababi"
          multiline
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={() => navigate('/sales/returns')} disabled={submitting}>Bekor qilish</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !saleId || loadingSale || Object.keys(lineErrors).length > 0}
          >
            {submitting ? 'Yuborilmoqda…' : "So'rov yuborish"}
          </Button>
        </Box>
      </Box>
    </>
  );
}
