import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/api/client';
import { getRandomUUID } from '@/utils/uuid';
import { getErrorMessage } from '@/utils/errors';

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
        const id = getRandomUUID();
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
        const { queue, isSyncing } = get();
        if (isSyncing || queue.length === 0) return;

        set({ isSyncing: true });

        // Snapshot what we process; actions enqueued while syncing stay in the
        // live queue and are picked up by the follow-up run below.
        const activeQueue = [...queue];
        const doneIds = new Set<string>();
        const newConflicts: OfflineConflict[] = [];

        try {
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
              doneIds.add(action.id);
            } catch (err: any) {
              if (!err?.status || err.status >= 500) {
                // Transient: keep this and the rest, in order, for the next run.
                break;
              }
              console.warn('Sync conflict/validation error occurred:', err);
              doneIds.add(action.id);
              newConflicts.push({
                ...action,
                status: err.status,
                error: getErrorMessage(err, 'Validation failed'),
              });
            }
          }
        } finally {
          set((state) => ({
            queue: state.queue.filter((a) => !doneIds.has(a.id)),
            conflicts: [
              ...state.conflicts,
              ...newConflicts.filter((c) => !state.conflicts.some((x) => x.id === c.id)),
            ],
            isSyncing: false,
          }));
        }

        const enqueuedMeanwhile = get().queue.some((a) => !activeQueue.some((x) => x.id === a.id));
        if (enqueuedMeanwhile) void get().processSync();
      },
    }),
    {
      name: 'erp-offline-storage',
      // isSyncing is runtime-only; persisting `true` (app closed mid-sync)
      // would block every later sync.
      partialize: (state) => ({ queue: state.queue, conflicts: state.conflicts }),
    }
  )
);
