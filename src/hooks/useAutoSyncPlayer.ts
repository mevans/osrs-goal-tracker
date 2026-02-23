import { useEffect } from 'react';
import { usePlayerStore } from '../store/player-store';
import { fetchSkillsFromWom } from '../engine/wom-api';

/**
 * On mount, silently re-fetches WOM skills if the player is in RSN mode with a saved RSN.
 * Fails silently — stale data is better than a broken UI.
 */
export function useAutoSyncPlayer() {
  useEffect(() => {
    const { rsn, loadProfile } = usePlayerStore.getState();
    if (!rsn) return;

    fetchSkillsFromWom(rsn)
      .then((skills) => loadProfile(skills))
      .catch(() => {
        // Silent failure — user still sees last-synced data
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
