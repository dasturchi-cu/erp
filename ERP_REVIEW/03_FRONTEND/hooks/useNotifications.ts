import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '@/api/services/notificationsApi';
import type { Notification } from '@/types/entities';

interface UseNotificationsResult {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
  toggleRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, count] = await Promise.all([
        notificationsApi.list({ limit: 100 }),
        notificationsApi.getUnreadCount(),
      ]);
      setItems(listRes.data);
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bildirishnomalar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleRead = useCallback(async (id: string) => {
    const updated = await notificationsApi.toggleRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
    setUnreadCount((c) => c + (updated.read ? -1 : 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const item = items.find((n) => n.id === id);
    await notificationsApi.delete(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.read) setUnreadCount((c) => Math.max(0, c - 1));
  }, [items]);

  return {
    items,
    unreadCount,
    loading,
    error,
    reload: load,
    toggleRead,
    markAllRead,
    deleteNotification,
  };
}

export function useUnreadNotificationCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    notificationsApi
      .getUnreadCount()
      .then((c) => {
        if (!cancelled) setCount(c);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
