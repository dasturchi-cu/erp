import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { PageHeader } from '@/components/common/PageHeader';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/types/entities';

const typeLabels: Record<Notification['type'], string> = {
  info: 'Ma\'lumot',
  warning: 'Ogohlantirish',
  success: 'Muvaffaqiyat',
  error: 'Xato',
};

const typeColors: Record<Notification['type'], 'info' | 'warning' | 'success' | 'error'> = {
  info: 'info',
  warning: 'warning',
  success: 'success',
  error: 'error',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function NotificationsPage() {
  const { items, unreadCount, loading, error, toggleRead, markAllRead, deleteNotification } =
    useNotifications();
  const [tab, setTab] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === 1) return items.filter((n) => !n.read);
    if (tab === 2) return items.filter((n) => n.read);
    return items;
  }, [items, tab]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return (
      <>
        <PageHeader title="Bildirishnomalar" subtitle="Xatolik yuz berdi" />
        <Typography color="error">{error}</Typography>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Bildirishnomalar"
        subtitle={`${unreadCount} ta o'qilmagan xabar`}
        secondaryActions={
          unreadCount > 0 ? (
            <Button startIcon={<DoneAllIcon />} onClick={() => void markAllRead()}>
              Barchasini o&apos;qilgan deb belgilash
            </Button>
          ) : undefined
        }
      />

      <Card variant="outlined">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`Barchasi (${items.length})`} />
          <Tab label={`O'qilmagan (${unreadCount})`} />
          <Tab label="O'qilgan" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <List disablePadding>
            {filtered.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">Bildirishnoma yo&apos;q</Typography>
              </Box>
            ) : (
              filtered.map((notification) => (
                <ListItem
                  key={notification.id}
                  disablePadding
                  divider
                  secondaryAction={
                    <Tooltip title="O'chirish">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => void handleDelete(notification.id, e)}
                        disabled={deletingId === notification.id}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemButton
                    onClick={() => void toggleRead(notification.id)}
                    sx={{ py: 2, pr: 7 }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {!notification.read && (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                          )}
                          <Typography variant="subtitle2" fontWeight={notification.read ? 400 : 700}>
                            {notification.title}
                          </Typography>
                          <Chip
                            label={typeLabels[notification.type]}
                            size="small"
                            color={typeColors[notification.type]}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" component="span" display="block">
                            {notification.body}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatDateTime(notification.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        )}
      </Card>
    </>
  );
}
