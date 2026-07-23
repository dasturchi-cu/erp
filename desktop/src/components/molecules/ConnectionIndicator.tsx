import { Box, Typography, Badge, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import { useOfflineStore, OfflineConflict } from '@/stores/offlineStore';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

export function ConnectionIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [open, setOpen] = useState(false);
  const [editingConflict, setEditingConflict] = useState<OfflineConflict | null>(null);
  const [editedPayload, setEditedPayload] = useState('');

  const conflicts = useOfflineStore((s) => s.conflicts);
  const retryConflict = useOfflineStore((s) => s.retryConflict);
  const ignoreConflict = useOfflineStore((s) => s.ignoreConflict);
  const resolveConflict = useOfflineStore((s) => s.resolveConflict);

  useEffect(() => {
    const check = () => {
      setStatus(navigator.onLine ? 'connected' : 'disconnected');
    };
    check();
    window.addEventListener('online', check);
    window.addEventListener('offline', check);
    const interval = setInterval(check, 30000);
    return () => {
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
      clearInterval(interval);
    };
  }, []);

  const colors: Record<ConnectionStatus, string> = {
    connected: '#16A34A',
    disconnected: '#D97706',
    checking: '#94A3B8',
  };

  const labels: Record<ConnectionStatus, string> = {
    connected: t('nav.connected'),
    disconnected: t('nav.offline'),
    checking: t('nav.checking'),
  };

  const handleEditClick = (conflict: OfflineConflict) => {
    setEditingConflict(conflict);
    setEditedPayload(JSON.stringify(conflict.payload, null, 2));
  };

  const handleResolveSave = () => {
    if (!editingConflict) return;
    try {
      const parsed = JSON.parse(editedPayload);
      resolveConflict(editingConflict.id, parsed);
      setEditingConflict(null);
    } catch {
      alert('Format xato! Noto\'g\'ri JSON kiritildi.');
    }
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          fontSize: '0.75rem',
          color: 'text.secondary',
          zIndex: 1000,
          bgcolor: 'background.paper',
          p: 1,
          borderRadius: 2,
          boxShadow: 3,
        }}
        role="status"
        aria-live="polite"
      >
        {conflicts.length > 0 && (
          <IconButton
            size="small"
            color="error"
            onClick={() => setOpen(true)}
            sx={{ animation: 'pulse 2s infinite' }}
          >
            <Badge badgeContent={conflicts.length} color="error">
              <SyncProblemIcon fontSize="small" />
            </Badge>
          </IconButton>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: colors[status],
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {labels[status]}
          </Typography>
        </Box>
      </Box>

      {/* Conflicts List Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Oflayn sinxronizatsiya to'qnashuvlari ({conflicts.length})
        </DialogTitle>
        <DialogContent dividers>
          {conflicts.length === 0 ? (
            <Typography>Sinxronizatsiya to'qnashuvlari mavjud emas.</Typography>
          ) : (
            <List>
              {conflicts.map((c) => (
                <ListItem
                  key={c.id}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" color="primary" onClick={() => handleEditClick(c)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="success" onClick={() => retryConflict(c.id)}>
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => ignoreConflict(c.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={`${c.type.toUpperCase()} - ${c.method} ${c.url}`}
                    secondary={
                      <>
                        <Typography variant="caption" display="block" color="error">
                          Xatolik ({c.status}): {c.error}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Yaratilgan sana: {new Date(c.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} variant="contained">
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit/Resolve Payload Dialog */}
      <Dialog open={!!editingConflict} onClose={() => setEditingConflict(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Tranzaksiyani tahrirlash</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            value={editedPayload}
            onChange={(e) => setEditedPayload(e.target.value)}
            sx={{ mt: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingConflict(null)}>Bekor qilish</Button>
          <Button onClick={handleResolveSave} color="primary" variant="contained">
            Sinxronizatsiya qilish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
