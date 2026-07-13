import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/api/client';

export interface OfflineAction {
  id: string;
  type: 'sale' | 'return' | 'payment' | 'customer' | 'supplier';
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  createdAt: string;
  idempotencyKey: string;
}

interface OfflineState {
  queue: OfflineAction[];
  isSyncing: boolean;
  enqueueAction: (action: Omit<OfflineAction, 'id' | 'idempotencyKey' | 'createdAt'>) => void;
  processSync: () => Promise<void>;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,
      enqueueAction: (action) => {
        const id = Math.random().toString(36).substring(2, 15);
        const idempotencyKey = `offline-${id}`;
        const newAction: OfflineAction = {
          ...action,
          id,
          idempotencyKey,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ queue: [...state.queue, newAction] }));
        void get().processSync();
      },
      clearQueue: () => set({ queue: [] }),
      processSync: async () => {
        const { queue, isSyncing } = get();
        if (isSyncing || queue.length === 0) return;

        set({ isSyncing: true });

        const activeQueue = [...queue];
        const remainingQueue: OfflineAction[] = [];

        for (const action of activeQueue) {
          try {
            await apiClient.request({
              url: action.url,
              method: action.method,
              data: action.payload,
              headers: {
                'Idempotency-Key': action.idempotencyKey,
              },
            });
          } catch (err: any) {
            if (!err.status || err.status >= 500) {
              remainingQueue.push(action);
              const idx = activeQueue.indexOf(action);
              const unprocessed = activeQueue.slice(idx + 1);
              remainingQueue.push(...unprocessed);
              break;
            } else {
              console.warn('Sync conflict/validation error skipped:', err);
            }
          }
        }

        set({ queue: remainingQueue, isSyncing: false });
      },
    }),
    {
      name: 'erp-offline-storage',
    }
  )
);
