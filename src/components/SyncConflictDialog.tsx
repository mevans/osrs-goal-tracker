import { useState } from 'react';
import { toast } from 'sonner';
import { analytics } from '../analytics';
import {
  downloadConflictRemote,
  keepLocalOnConflict,
  keepRemoteOnConflict,
} from '../sync/run-sync';

export function SyncConflictDialog() {
  const [busy, setBusy] = useState(false);

  const handleKeepLocal = async () => {
    setBusy(true);
    try {
      analytics.deviceSyncConflict('keep-local');
      await keepLocalOnConflict();
      toast.success("Kept this device's graph");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save this device');
    } finally {
      setBusy(false);
    }
  };

  const handleKeepRemote = async () => {
    setBusy(true);
    try {
      analytics.deviceSyncConflict('keep-remote');
      await keepRemoteOnConflict();
      toast.success("Loaded the other device's graph");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load the other device');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface-800 border border-surface-border rounded-lg p-5 w-[480px] shadow-xl">
        <h2 className="text-lg font-semibold text-brand-text mb-3">Sync conflict</h2>
        <p className="text-sm text-stone-400 mb-4">
          This device and another both changed the graph before they could sync. Pick which copy to
          keep. You can also download the other copy as JSON first.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => void handleKeepLocal()}
            disabled={busy}
            className="px-3 py-2 text-sm text-white bg-brand hover:bg-brand-bright rounded disabled:opacity-50"
          >
            Keep this device
          </button>
          <button
            onClick={() => void handleKeepRemote()}
            disabled={busy}
            className="px-3 py-2 text-sm text-stone-200 bg-surface-700 hover:bg-surface-600 rounded disabled:opacity-50"
          >
            Keep the other device
          </button>
          <button
            onClick={() => {
              analytics.deviceSyncConflict('download-other');
              downloadConflictRemote();
            }}
            disabled={busy}
            className="px-3 py-2 text-sm text-stone-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded disabled:opacity-50"
          >
            Download the other as JSON
          </button>
        </div>
      </div>
    </div>
  );
}
