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

export interface OfflineConflict extends OfflineAction {
  status?: number;
  error?: string;
}

interface OfflineState {
  queue: OfflineAction[];
  conflicts: OfflineConflict[];
  isSyncing: boolean;
  enqueueAction: (action: Omit<OfflineAction, 'id' | 'idempotencyKey' | 'createdAt'>) => void;
  processSync: () => Promise<void>;
  clearQueue: () => void;
  clearConflicts: () => void;
  retryConflict: (id: string) => void;
  ignoreConflict: (id: string) => void;
  resolveConflict: (id: string, updatedPayload: any) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      queue: [],
      conflicts: [],
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
      clearConflicts: () => set({ conflicts: [] }),
      retryConflict: (id) => {
        const { conflicts, queue } = get();
        const conflict = conflicts.find((c) => c.id === id);
        if (!conflict) return;

        const updatedConflicts = conflicts.filter((c) => c.id !== id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error, status, ...action } = conflict;

        set({
          conflicts: updatedConflicts,
          queue: [...queue, action],
        });
        void get().processSync();
      },
      ignoreConflict: (id) => {
        set((state) => ({
          conflicts: state.conflicts.filter((c) => c.id !== id),
        }));
      },
      resolveConflict: (id, updatedPayload) => {
        const { conflicts, queue } = get();
        const conflict = conflicts.find((c) => c.id === id);
        if (!conflict) return;

        const updatedConflicts = conflicts.filter((c) => c.id !== id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error, status, ...action } = conflict;
        action.payload = updatedPayload;

        set({
          conflicts: updatedConflicts,
          queue: [...queue, action],
        });
        void get().processSync();
      },
      processSync: async () => {
        const { queue, isSyncing, conflicts } = get();
        if (isSyncing || queue.length === 0) return;

        set({ isSyncing: true });

        const activeQueue = [...queue];
        const remainingQueue: OfflineAction[] = [];
        const newConflicts: OfflineConflict[] = [...conflicts];

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
              console.warn('Sync conflict/validation error occurred:', err);
              if (!newConflicts.some((c) => c.id === action.id)) {
                newConflicts.push({
                  ...action,
                  status: err.status,
                  error: err.response?.data?.message || err.message || 'Validation failed',
                });
              }
            }
          }
        }

        set({
          queue: remainingQueue,
          conflicts: newConflicts,
          isSyncing: false,
        });
      },
    }),
    {
      name: 'erp-offline-storage',
    }
  )
);
