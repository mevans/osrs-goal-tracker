import { useState } from 'react';
import { usePlayerStore } from '../../store/player-store';
import { useGraphStore } from '../../store/graph-store';
import { fetchPlayerDataFromWom } from '../../engine/wom-api';
import { confirm } from '../ui/confirm';
import { Dialog } from '../ui/dialog';

interface PlayerProfileDialogProps {
  onClose: () => void;
}

export function PlayerProfileDialog({ onClose }: PlayerProfileDialogProps) {
  const rsn = usePlayerStore((s) => s.rsn);
  const setRsn = usePlayerStore((s) => s.setRsn);
  const loadProfile = usePlayerStore((s) => s.loadProfile);
  const resetProfile = usePlayerStore((s) => s.resetProfile);
  const clearNodeCompletions = useGraphStore((s) => s.clearNodeCompletions);

  const [rsnInput, setRsnInput] = useState(rsn ?? '');
  const [status, setStatus] = useState<
    | { type: 'idle' }
    | { type: 'loading' }
    | { type: 'success'; rsn: string; skillCount: number; bossCount: number }
    | { type: 'error'; message: string }
  >({ type: 'idle' });

  const handleLookup = async () => {
    const name = rsnInput.trim();
    if (!name) return;
    setStatus({ type: 'loading' });
    try {
      const { skills, bossKcs } = await fetchPlayerDataFromWom(name);
      setRsn(name);
      loadProfile(skills, bossKcs);
      setStatus({
        type: 'success',
        rsn: name,
        skillCount: Object.keys(skills).length,
        bossCount: Object.keys(bossKcs).length,
      });
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset synced data?',
      description:
        'Clears the linked RuneScape name, synced skills, and node completions on the canvas.',
      confirmLabel: 'Reset',
      tone: 'danger',
    });
    if (!ok) return;
    resetProfile();
    clearNodeCompletions();
    setRsnInput('');
    setStatus({ type: 'idle' });
  };

  return (
    <Dialog title="Link player" onClose={onClose} width="md">
      <div className="flex flex-col gap-4">
        {/* RSN input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            RuneScape Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter RSN..."
              value={rsnInput}
              onChange={(e) => {
                setRsnInput(e.target.value);
                setStatus({ type: 'idle' });
              }}
              onKeyDown={(e) => e.key === 'Enter' && void handleLookup()}
              className="flex-1 px-3 py-1.5 text-sm bg-surface-700 border border-surface-border rounded text-stone-200 placeholder-stone-600 focus:outline-none focus:border-brand"
            />
            <button
              onClick={() => void handleLookup()}
              disabled={status.type === 'loading' || !rsnInput.trim()}
              className="px-3 py-1.5 text-sm bg-brand hover:bg-brand-bright disabled:opacity-50 disabled:cursor-not-allowed text-white rounded"
            >
              {status.type === 'loading'
                ? 'Loading…'
                : rsn && rsn === rsnInput.trim()
                  ? 'Reload'
                  : 'Load'}
            </button>
          </div>

          {status.type === 'success' && (
            <p className="text-xs text-green-400">
              {status.skillCount} skills and {status.bossCount} boss KCs loaded for{' '}
              <span className="font-medium">{status.rsn}</span>.
            </p>
          )}
          {status.type === 'error' && <p className="text-xs text-red-400">{status.message}</p>}
        </div>

        {/* Info note */}
        <p className="text-xs text-stone-500 leading-relaxed">
          Skill levels and boss kill counts are fetched from{' '}
          <a
            href="https://wiseoldman.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 hover:text-stone-200 underline"
          >
            Wise Old Man
          </a>
          . Boss KCs update kill node counters (never decrease). Quest completion isn't available
          via RSN — mark quests done directly on the canvas, or use the RuneLite plugin{' '}
          <span className="text-stone-600">(coming soon)</span>.
        </p>

        {/* Reset */}
        {rsn && (
          <div className="border-t border-surface-border pt-4">
            <button
              type="button"
              onClick={() => void handleReset()}
              className="text-xs text-stone-500 hover:text-red-400"
            >
              Reset synced data
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
