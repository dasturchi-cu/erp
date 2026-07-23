import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  type Breakpoint,
} from '@mui/material';
import type { ReactNode } from 'react';

interface FormDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  loading?: boolean;
  maxWidth?: Breakpoint;
}

export function FormDialog({
  open,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Saqlash',
  loading,
  maxWidth = 'sm',
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Bekor qilish
        </Button>
        {onSubmit && (
          <Button variant="contained" onClick={onSubmit} disabled={loading}>
            {submitLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
