import { useEffect } from 'react';
import { usePlayerStore } from '../store/player-store';
import { fetchPlayerDataFromWom } from '../engine/wom-api';

/**
 * On mount, silently re-fetches WOM data if the player has a saved RSN.
 * Fails silently — stale data is better than a broken UI.
 */
export function useAutoSyncPlayer() {
  useEffect(() => {
    const { rsn, loadProfile } = usePlayerStore.getState();
    if (!rsn) return;

    fetchPlayerDataFromWom(rsn)
      .then(({ skills, bossKcs }) => loadProfile(skills, bossKcs))
      .catch(() => {
        // Silent failure — user still sees last-synced data
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
