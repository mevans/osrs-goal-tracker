import { useEffect } from 'react';
import { useSyncStore } from '../store/sync-store';
import { pullOnce } from '../sync/run-sync';

const POLL_MS = 30_000;

export function useGraphSync(): void {
  const syncId = useSyncStore((s) => s.syncId);
  const status = useSyncStore((s) => s.status);

  useEffect(() => {
    if (!syncId || status === 'conflict') return;

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void pullOnce(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (useSyncStore.getState().status === 'conflict') return;
      void pullOnce(true);
    }, POLL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [syncId, status]);
}
