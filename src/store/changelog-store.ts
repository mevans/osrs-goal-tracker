import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CHANGELOG_MIN_NODES, getEngagedNodeCount, LATEST_CHANGELOG_ID } from '../changelog';
import { loadFromLocalStorage } from '../engine/serialization';

interface ChangelogState {
  lastSeenId: string | undefined;
  markSeen: (id: string) => void;
}

export const useChangelogStore = create<ChangelogState>()(
  persist(
    (set) => ({
      lastSeenId: undefined,
      markSeen: (id) => set({ lastSeenId: id }),
    }),
    {
      name: 'planscape-changelog',
      onRehydrateStorage: () => (state, error) => {
        if (!error && state && !state.lastSeenId && LATEST_CHANGELOG_ID) {
          const savedGraph = loadFromLocalStorage();
          const nodeCount = getEngagedNodeCount(savedGraph?.nodes ?? []);
          if (nodeCount < CHANGELOG_MIN_NODES) {
            state.lastSeenId = LATEST_CHANGELOG_ID;
          }
        }
      },
    },
  ),
);

function subscribeHydration(onStoreChange: () => void): () => void {
  return useChangelogStore.persist.onFinishHydration(onStoreChange);
}

function getHydrated(): boolean {
  return useChangelogStore.persist.hasHydrated();
}

export function useChangelogHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, getHydrated, () => false);
}
