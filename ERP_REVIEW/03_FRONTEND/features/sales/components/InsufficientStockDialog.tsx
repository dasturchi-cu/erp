import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface InsufficientStockDialogProps {
  open: boolean;
  productName: string;
  available: number;
  requested: number;
  onClose: () => void;
  onReduce: () => void;
}

export function InsufficientStockDialog({
  open,
  productName,
  available,
  requested,
  onClose,
  onReduce,
}: InsufficientStockDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Zaxira yetarli emas
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          <strong>{productName}</strong> uchun so&apos;ralgan: {requested} dona
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Mavjud zaxira: {available} dona
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Bekor qilish</Button>
        {available > 0 && (
          <Button variant="contained" onClick={onReduce}>
            {available} dona qo&apos;shish
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
