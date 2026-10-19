import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Tab, TextField,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import UndoIcon from '@mui/icons-material/Undo';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/DataTable';
import { useSalesStore } from '@/stores/salesStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatUzs, formatUsd } from '@/utils/format';
import { usePermissions } from '@/hooks/usePermissions';
import { useIdempotencyKey } from '@/hooks/useIdempotencyKey';
import { getErrorMessage } from '@/utils/errors';

const statusLabels = {
  completed: 'Yakunlangan',
  partially_returned: 'Qisman qaytarilgan',
  voided: 'Bekor qilingan',
  returned: 'Qaytarilgan',
};
const statusColors = {
  completed: 'success',
  partially_returned: 'warning',
  voided: 'error',
  returned: 'warning',
} as const;
const paymentLabels = { cash: 'Naqd', credit: 'Nasiya', mixed: 'Aralash' };

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const { can } = usePermissions();
  const sale = useSalesStore((s) => s.getSaleById(id ?? ''));
  const voidSale = useSalesStore((s) => s.voidSale);
  const fetchSaleById = useSalesStore((s) => s.fetchSaleById);
  const [tab, setTab] = useState(0);
  const [voiding, setVoiding] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidNote, setVoidNote] = useState('');
  const voidKey = useIdempotencyKey();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchSaleById(id).finally(() => setLoading(false));
  }, [id, fetchSaleById]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Sotuv topilmadi</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/sales/history')}>
          Orqaga
        </Button>
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title={sale.number}
        subtitle={`${new Date(sale.createdAt).toLocaleString('uz-UZ')} · ${sale.cashier}`}
        secondaryActions={
          <>
            <StatusChip label={statusLabels[sale.status]} color={statusColors[sale.status]} />
            <Button startIcon={<PrintIcon />} onClick={() => navigate(`/sales/receipt/${sale.id}`)}>
              Chek
            </Button>
            {(sale.status === 'completed' || sale.status === 'partially_returned') && can('sales.return') && (
              <Button
                startIcon={<UndoIcon />}
                color="warning"
                onClick={() => navigate(`/sales/returns/new?saleId=${sale.id}`)}
              >
                Qaytarish
              </Button>
            )}
          </>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
        <Card variant="outlined" sx={{ p: 0 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tab label="Mahsulotlar" />
            <Tab label="FIFO" />
            <Tab label="To'lov" />
          </Tabs>
          <Box sx={{ p: 2 }}>
            {tab === 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mahsulot</TableCell>
                    <TableCell align="right">Miqdor</TableCell>
                    <TableCell align="right">Summa</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(sale.lineItems ?? []).map((l) => (
                    <TableRow key={l.productId}>
                      <TableCell>{l.productName}</TableCell>
                      <TableCell align="right">{l.quantity}</TableCell>
                      <TableCell align="right">{formatUzs(l.totalUzs)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {tab === 1 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Partiya</TableCell>
                    <TableCell>Mahsulot</TableCell>
                    <TableCell align="right">Miqdor</TableCell>
                    <TableCell align="right">Tannarx</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(sale.fifoAllocations ?? []).map((f) => (
                    <TableRow key={f.batchId}>
                      <TableCell>{f.batchId}</TableCell>
                      <TableCell>{f.productName}</TableCell>
                      <TableCell align="right">{f.quantity}</TableCell>
                      <TableCell align="right">{formatUzs(f.costUzs)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {tab === 2 && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  To&apos;lov turi: <strong>{paymentLabels[sale.paymentType]}</strong>
                </Typography>
                {(sale.payments ?? []).map((p, i) => (
                  <Box key={i} sx={{ mt: 1 }}>
                    <Typography variant="body2">{formatUzs(p.amountUzs)} / {formatUsd(p.amountUsd)}</Typography>
                    {p.changeUzs !== undefined && p.changeUzs > 0 && (
                      <Typography variant="caption" color="success.main">
                        Qaytim: {formatUzs(p.changeUzs)}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Card>

        <Card variant="outlined" sx={{ p: 2, height: 'fit-content' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Mijoz
          </Typography>
          <Typography variant="body1" fontWeight={600} gutterBottom>
            {sale.customerName}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            Jami
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {formatUzs(sale.totalUzs)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatUsd(sale.totalUsd)}
          </Typography>
          <Chip size="small" label={`Kurs: ${sale.exchangeRate.toLocaleString()}`} sx={{ mt: 1 }} />
          {sale.status === 'completed' && can('sales.cancel') && (
            <Button
              fullWidth
              color="error"
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => setVoidOpen(true)}
              disabled={voiding}
            >
              Sotuvni bekor qilish
            </Button>
          )}
        </Card>
      </Box>

      <Dialog open={voidOpen} onClose={() => !voiding && setVoidOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Sotuvni bekor qilish</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {sale.number} sotuvi bekor qilinadi: mahsulotlar omborga qaytadi, nasiya bo&apos;lsa
            mijoz qarzidan ayriladi. Bu amalni ortga qaytarib bo&apos;lmaydi.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Sabab (ixtiyoriy)"
            value={voidNote}
            onChange={(e) => setVoidNote(e.target.value)}
            inputProps={{ maxLength: 2000 }}
            disabled={voiding}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVoidOpen(false)} disabled={voiding}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={voiding}
            onClick={async () => {
              if (voiding) return;
              setVoiding(true);
              try {
                await voidSale(sale.id, voidNote.trim() || undefined, voidKey.get());
                voidKey.reset();
                setVoidOpen(false);
                success('Sotuv bekor qilindi');
              } catch (err: unknown) {
                notifyError(getErrorMessage(err, 'Bekor qilishda xatolik'));
              } finally {
                setVoiding(false);
              }
            }}
          >
            {voiding ? 'Jarayonda…' : 'Tasdiqlash'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
