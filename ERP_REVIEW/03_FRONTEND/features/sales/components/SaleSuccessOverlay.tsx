import { Box, Button, Paper, Typography, Fade } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useNavigate } from 'react-router-dom';
import { formatUzs } from '@/utils/format';
import type { SaleDetail } from '@/types/sales';

interface SaleSuccessOverlayProps {
  sale: SaleDetail | null;
  onNewCart: () => void;
  onClose: () => void;
}

export function SaleSuccessOverlay({ sale, onNewCart, onClose }: SaleSuccessOverlayProps) {
  const navigate = useNavigate();

  if (!sale) return null;

  return (
    <Fade in>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          p: 2,
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Sotuv yakunlandi!
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {sale.number}
          </Typography>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            {formatUzs(sale.totalUzs)}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<ReceiptIcon />}
              onClick={() => {
                navigate(`/sales/receipt/${sale.id}`);
                onClose();
              }}
            >
              Chekni ko&apos;rish
            </Button>
            <Button variant="outlined" onClick={onNewCart}>
              Yangi savat
            </Button>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
}
