import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SyncEnvelope } from '../engine/sync';

export type DeviceSyncStatus = 'idle' | 'syncing' | 'offline' | 'conflict' | 'error';

interface SyncState {
  syncId: string | undefined;
  lastSyncedRev: number;
  dirty: boolean;
  lastSyncedAt: string | undefined;
  status: DeviceSyncStatus;
  conflictRemote: SyncEnvelope | undefined;
  errorMessage: string | undefined;

  setLinked: (syncId: string, lastSyncedRev: number, lastSyncedAt: string) => void;
  markDirty: () => void;
  markClean: (rev: number, lastSyncedAt: string) => void;
  setStatus: (status: DeviceSyncStatus) => void;
  setConflict: (remote: SyncEnvelope) => void;
  clearConflict: () => void;
  setError: (message: string | undefined) => void;
  unlink: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      syncId: undefined,
      lastSyncedRev: 0,
      dirty: false,
      lastSyncedAt: undefined,
      status: 'idle',
      conflictRemote: undefined,
      errorMessage: undefined,

      setLinked: (syncId, lastSyncedRev, lastSyncedAt) =>
        set({
          syncId,
          lastSyncedRev,
          lastSyncedAt,
          dirty: false,
          status: 'idle',
          conflictRemote: undefined,
          errorMessage: undefined,
        }),

      markDirty: () => set({ dirty: true }),

      markClean: (rev, lastSyncedAt) =>
        set({
          lastSyncedRev: rev,
          lastSyncedAt,
          dirty: false,
          status: 'idle',
          conflictRemote: undefined,
          errorMessage: undefined,
        }),

      setStatus: (status) => set({ status }),

      setConflict: (remote) =>
        set({
          status: 'conflict',
          conflictRemote: remote,
        }),

      clearConflict: () => set({ conflictRemote: undefined, status: 'idle' }),

      setError: (message) =>
        set({
          status: message ? 'error' : 'idle',
          errorMessage: message,
        }),

      unlink: () =>
        set({
          syncId: undefined,
          lastSyncedRev: 0,
          dirty: false,
          lastSyncedAt: undefined,
          status: 'idle',
          conflictRemote: undefined,
          errorMessage: undefined,
        }),
    }),
    {
      name: 'planscape-device-sync',
      partialize: (state) => ({
        syncId: state.syncId,
        lastSyncedRev: state.lastSyncedRev,
        dirty: state.dirty,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
