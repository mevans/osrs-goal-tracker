import { useState } from 'react';
import { toast } from 'sonner';
import { useGraphStore } from '../../store/graph-store';
import { useSyncStore } from '../../store/sync-store';
import { formatSyncAge, formatSyncId } from '../../engine/sync';
import { analytics } from '../../analytics';
import { joinDeviceSync, startDeviceSync, unlinkDevice } from '../../sync/run-sync';

export function DeviceSyncSection() {
  const syncId = useSyncStore((s) => s.syncId);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const status = useSyncStore((s) => s.status);
  const errorMessage = useSyncStore((s) => s.errorMessage);

  if (syncId) {
    return (
      <LinkedView
        syncId={syncId}
        lastSyncedAt={lastSyncedAt}
        status={status}
        errorMessage={errorMessage}
      />
    );
  }
  return <UnlinkedView />;
}

function UnlinkedView() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const handleStart = async () => {
    setBusy(true);
    try {
      await startDeviceSync();
      analytics.deviceSyncStarted();
      toast.success('Device sync is on — copy the code onto your other device');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start device sync');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    const nodeCount = useGraphStore.getState().nodes.length;
    if (nodeCount > 0) {
      const ok = window.confirm(
        'This will replace your current graph with the synced one. Continue?\n\n(Export first if you want to save your current work)',
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      await joinDeviceSync(code);
      analytics.deviceSyncJoined();
      toast.success('This device is now syncing');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join device sync');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="text-sm text-stone-400 mb-3">
        Anyone with the code can read and overwrite the graph.
      </p>

      <button
        onClick={() => void handleStart()}
        disabled={busy}
        className="w-full px-3 py-2 text-sm text-sky-50 bg-sky-800 hover:bg-sky-700 rounded disabled:opacity-50"
      >
        Start sync
      </button>

      <div className="flex items-center gap-2 my-3">
        <div className="flex-1 h-px bg-surface-border" />
        <span className="text-xs text-stone-500">or</span>
        <div className="flex-1 h-px bg-surface-border" />
      </div>

      <label className="block text-sm text-stone-300 mb-1.5">I have a code</label>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx"
          className="flex-1 bg-surface-700 text-stone-200 text-sm rounded px-2 py-1.5 border border-surface-border font-mono"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button
          onClick={() => void handleJoin()}
          disabled={busy || code.trim().length === 0}
          className="px-3 py-1.5 text-sm text-sky-50 bg-sky-800 hover:bg-sky-700 rounded shrink-0 disabled:opacity-50"
        >
          Join
        </button>
      </div>
    </>
  );
}

function LinkedView({
  syncId,
  lastSyncedAt,
  status,
  errorMessage,
}: {
  syncId: string;
  lastSyncedAt: string | undefined;
  status: string;
  errorMessage: string | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const formatted = formatSyncId(syncId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Code copied to clipboard');
    } catch {
      toast.error('Failed to copy — check clipboard permissions');
    }
  };

  const handleUnlink = () => {
    const ok = window.confirm(
      'This device will stop syncing. The code still works on your other devices.',
    );
    if (!ok) return;
    unlinkDevice();
    toast.success('This device is unlinked');
  };

  const statusLabel =
    status === 'syncing'
      ? 'Syncing…'
      : status === 'offline'
        ? 'Offline — will sync when you are back online'
        : status === 'conflict'
          ? 'This device and another both have changes'
          : status === 'error'
            ? (errorMessage ?? 'Sync error')
            : formatSyncAge(lastSyncedAt);

  return (
    <>
      <p className="text-sm text-stone-400 mb-3">
        Enter this code on your other device. Anyone with the code can read and overwrite the graph.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          readOnly
          value={formatted}
          className="flex-1 bg-surface-700 text-stone-200 text-sm rounded px-2 py-1.5 border border-surface-border font-mono truncate"
        />
        <button
          onClick={() => void handleCopy()}
          className="px-3 py-1.5 text-sm text-sky-50 bg-sky-800 hover:bg-sky-700 rounded shrink-0"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <p className="text-xs text-stone-500 mb-3">{statusLabel}</p>

      <button
        onClick={handleUnlink}
        className="px-3 py-1.5 text-sm text-red-300 hover:text-red-200 bg-surface-700 hover:bg-surface-600 rounded"
      >
        Unlink this device
      </button>
    </>
  );
}
