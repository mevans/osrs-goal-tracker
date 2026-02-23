import { useState } from 'react';
import { usePlayerStore } from '../../store/player-store';
import { useGraphStore } from '../../store/graph-store';
import { fetchSkillsFromWom } from '../../engine/wom-api';

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
    | { type: 'success'; rsn: string; count: number }
    | { type: 'error'; message: string }
  >({ type: 'idle' });

  const handleLookup = async () => {
    const name = rsnInput.trim();
    if (!name) return;
    setStatus({ type: 'loading' });
    try {
      const skills = await fetchSkillsFromWom(name);
      setRsn(name);
      loadProfile(skills);
      setStatus({ type: 'success', rsn: name, count: Object.keys(skills).length });
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset synced skills and RSN? Node completions on the canvas will also be cleared.',
      )
    ) {
      resetProfile();
      clearNodeCompletions();
      setRsnInput('');
      setStatus({ type: 'idle' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface-800 border border-surface-border rounded-lg shadow-xl w-[420px] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-lg font-semibold text-brand-text">Sync Player</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4">
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
                {status.count} skills loaded for <span className="font-medium">{status.rsn}</span>.
              </p>
            )}
            {status.type === 'error' && <p className="text-xs text-red-400">{status.message}</p>}
          </div>

          {/* Info note */}
          <p className="text-xs text-stone-500 leading-relaxed">
            Skill levels are fetched from{' '}
            <a
              href="https://wiseoldman.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-stone-200 underline"
            >
              Wise Old Man
            </a>
            . Quest completion isn't available via RSN — mark quests done directly on the canvas, or
            use the RuneLite plugin <span className="text-stone-600">(coming soon)</span>.
          </p>

          {/* Reset */}
          {rsn && (
            <div className="border-t border-surface-border pt-4">
              <button onClick={handleReset} className="text-xs text-stone-500 hover:text-red-400">
                Reset synced data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
