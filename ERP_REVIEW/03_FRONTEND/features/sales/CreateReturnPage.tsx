import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
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
import { formatUzs } from '@/utils/format';

export function CreateReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error: notifyError } = useNotification();
  const user = useAuthStore((s) => s.user);
  const createReturn = useSalesStore((s) => s.createReturn);
  const sales = useSalesStore((s) =>
    s.sales.filter((sale) => sale.status === 'completed' || sale.status === 'partially_returned'),
  );

  const initialSaleId = searchParams.get('saleId') ?? '';
  const [saleId, setSaleId] = useState(initialSaleId);
  const [reason, setReason] = useState('');
  const [selectedLines, setSelectedLines] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const sale = useMemo(() => sales.find((s) => s.id === saleId), [sales, saleId]);

  const toggleLine = (productId: string) => {
    setSelectedLines((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleSubmit = async () => {
    if (!sale) {
      notifyError('Savdoni tanlang');
      return;
    }
    if (!reason.trim()) {
      notifyError('Qaytarish sababini kiriting');
      return;
    }

    const lineItems = sale.lineItems
      .filter((l) => selectedLines[l.productId])
      .map((l) => ({
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        amountUzs: l.totalUzs,
      }));

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
      });
      success('Qaytarish so\'rovi yaratildi');
      navigate(`/sales/returns/${ret.id}`);
    } catch {
      notifyError('Qaytarish yaratishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Yangi qaytarish" subtitle="Savdo bo'yicha qaytarish so'rovi" />

      <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Savdo</InputLabel>
          <Select value={saleId} label="Savdo" onChange={(e) => { setSaleId(e.target.value); setSelectedLines({}); }}>
            {sales.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.number} — {s.customerName} ({formatUzs(s.totalUzs)})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {sale && (
          <>
            <Typography variant="subtitle2" fontWeight={600}>
              Qaytariladigan mahsulotlar
            </Typography>
            {sale.lineItems.map((line) => (
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
                }}
              >
                <Checkbox
                  checked={Boolean(selectedLines[line.productId])}
                  onChange={() => toggleLine(line.productId)}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{line.productName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {line.quantity} dona · {formatUzs(line.totalUzs)}
                  </Typography>
                </Box>
              </Box>
            ))}
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
          <Button onClick={() => navigate('/sales/returns')}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || !saleId}>
            So'rov yuborish
          </Button>
        </Box>
      </Box>
    </>
  );
}
