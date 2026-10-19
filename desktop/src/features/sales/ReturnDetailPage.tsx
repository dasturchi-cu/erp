import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/DataTable';
import { useSalesStore } from '@/stores/salesStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatUzs, formatUsd } from '@/utils/format';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/utils/errors';

const statusLabels = { pending: 'Kutilmoqda', approved: 'Tasdiqlangan', rejected: 'Rad etilgan' };
const statusColors = { pending: 'warning', approved: 'success', rejected: 'error' } as const;

export function ReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const { can } = usePermissions();
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null);
  const ret = useSalesStore((s) => s.getReturnById(id ?? ''));
  const fetchReturnById = useSalesStore((s) => s.fetchReturnById);
  const approveReturn = useSalesStore((s) => s.approveReturn);
  const rejectReturn = useSalesStore((s) => s.rejectReturn);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchReturnById(id).finally(() => setLoading(false));
  }, [id, fetchReturnById]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Qaytarish yuklanmoqda…
        </Typography>
      </Box>
    );
  }

  if (!ret) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Qaytarish topilmadi</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/sales/returns')}>Orqaga</Button>
      </Box>
    );
  }

  const decide = async (kind: 'approve' | 'reject') => {
    if (deciding) return;
    setDeciding(kind);
    try {
      if (kind === 'approve') {
        await approveReturn(ret.id);
        success('Qaytarish tasdiqlandi');
      } else {
        await rejectReturn(ret.id);
        success('Qaytarish rad etildi');
      }
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, kind === 'approve' ? 'Tasdiqlashda xatolik' : 'Rad etishda xatolik'));
    } finally {
      setDeciding(null);
    }
  };

  return (
    <>
      <PageHeader
        title={`Qaytarish #${ret.id.toUpperCase()}`}
        subtitle={ret.saleNumber}
        secondaryActions={
          <>
            <StatusChip label={statusLabels[ret.status]} color={statusColors[ret.status]} />
            {ret.status === 'pending' && can('sales.return') && (
              <>
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => void decide('approve')}
                  disabled={deciding !== null}
                >
                  {deciding === 'approve' ? 'Jarayonda…' : 'Tasdiqlash'}
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => void decide('reject')}
                  disabled={deciding !== null}
                >
                  {deciding === 'reject' ? 'Jarayonda…' : 'Rad etish'}
                </Button>
              </>
            )}
          </>
        }
      />

      <Card variant="outlined" sx={{ p: 3, maxWidth: 640, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">Mijoz</Typography>
        <Typography variant="body1" fontWeight={600} gutterBottom>{ret.customerName}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Summa</Typography>
        <Typography variant="h5" fontWeight={700}>{formatUzs(ret.amountUzs)}</Typography>
        <Typography variant="body2" color="text.secondary">{formatUsd(ret.amountUsd)}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Sabab</Typography>
        <Typography variant="body1">{ret.reason}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          {new Date(ret.createdAt).toLocaleString('uz-UZ')}
        </Typography>
      </Card>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Qaytariladigan mahsulotlar
      </Typography>
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mahsulot</TableCell>
              <TableCell align="right">Miqdor</TableCell>
              <TableCell align="right">Summa</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(ret.lineItems ?? []).map((line) => (
              <TableRow key={line.productId}>
                <TableCell>{line.productName}</TableCell>
                <TableCell align="right">{line.quantity}</TableCell>
                <TableCell align="right">{formatUzs(line.amountUzs)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
