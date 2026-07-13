import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { formatUzs } from '@/utils/format';
import type { CartLine } from '@/types/sales';

interface BelowCostConfirmDialogProps {
  open: boolean;
  lines: CartLine[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function BelowCostConfirmDialog({
  open,
  lines,
  onConfirm,
  onCancel,
}: BelowCostConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: 'warning.main', fontWeight: 700 }}>
        Diqqat! Mahsulot tannarxidan past narxda sotilyapti.
        <br />
        Davom etasizmi?
      </DialogTitle>
      <DialogContent>
        <List dense>
          {lines.map((line) => (
            <ListItem key={`${line.product.id}-${line.saleUnit}`} disablePadding>
              <ListItemText
                primary={line.product.name}
                secondary={`Sotuv: ${formatUzs(line.unitPriceUzs)} · Olish narxi: ${formatUzs(line.product.purchasePriceUzs)}`}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined">
          Yo'q
        </Button>
        <Button variant="contained" color="warning" onClick={onConfirm}>
          Ha
        </Button>
      </DialogActions>
    </Dialog>
  );
}
