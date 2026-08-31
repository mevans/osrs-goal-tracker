import { toast } from 'sonner';
import { analytics } from '../analytics';
import { CURRENT_VERSION, runMigrations } from '../engine/migrations';
import {
  decideSyncAction,
  generateSyncId,
  graphSnapshotsEqual,
  nextRev,
  normalizeSyncId,
  type SyncEnvelope,
} from '../engine/sync';
import type { GraphData } from '../engine/types';
import { exportToJson } from '../engine/serialization';
import { useGraphStore } from '../store/graph-store';
import { useSyncStore } from '../store/sync-store';
import { getGraph, putGraph, SyncHttpError } from './sync-client';

let applyingRemote = false;
let refusedVersionNotified = false;
let syncChain: Promise<void> = Promise.resolve();

export function isApplyingRemote(): boolean {
  return applyingRemote;
}

function enqueueSync<T>(task: () => Promise<T>): Promise<T> {
  const run = syncChain.then(task, task);
  syncChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function currentGraph(): GraphData {
  const { nodes, edges, notes } = useGraphStore.getState();
  return { nodes, edges, notes };
}

function applyRemoteGraph(data: GraphData, rev: number, updatedAt: string): void {
  applyingRemote = true;
  try {
    useGraphStore.getState().loadGraph(data);
    useGraphStore.temporal.getState().clear();
    useSyncStore.getState().markClean(rev, updatedAt);
  } finally {
    applyingRemote = false;
  }
}

async function buildPushEnvelope(remoteRev: number | undefined): Promise<SyncEnvelope> {
  const { lastSyncedRev } = useSyncStore.getState();
  const rev = nextRev(lastSyncedRev, remoteRev);
  const updatedAt = new Date().toISOString();
  return {
    version: CURRENT_VERSION,
    rev,
    updatedAt,
    data: currentGraph(),
  };
}

async function upload(id: string, remoteRev: number | undefined): Promise<void> {
  const envelope = await buildPushEnvelope(remoteRev);
  await putGraph(id, envelope);
  useSyncStore.getState().markClean(envelope.rev, envelope.updatedAt);
}

function notifyRefuseVersion(): void {
  if (refusedVersionNotified) return;
  refusedVersionNotified = true;
  toast.error('This graph was saved with a newer app version — update Planscape to sync');
}

function toastSyncError(error: unknown, fallback: string, silent: boolean): void {
  const message =
    error instanceof SyncHttpError
      ? error.status === 409
        ? 'This graph was saved with a newer app version — update Planscape to sync'
        : error.status === 429
          ? 'Sync is busy — try again in a moment'
          : error.message
      : error instanceof Error
        ? error.message
        : fallback;
  useSyncStore.getState().setError(message);
  if (!silent) toast.error(message);
}

function takeConflictIfReal(envelope: SyncEnvelope): void {
  const migrated = runMigrations(envelope.data, envelope.version);
  if (migrated && graphSnapshotsEqual(currentGraph(), migrated)) {
    useSyncStore.getState().markClean(envelope.rev, envelope.updatedAt);
    return;
  }
  analytics.deviceSyncConflict('detected');
  useSyncStore.getState().setConflict(envelope);
}

export async function pullOnce(silent: boolean): Promise<void> {
  return enqueueSync(() => runPullOnce(silent));
}

export async function pushOnce(silent: boolean): Promise<void> {
  return enqueueSync(() => runPushOnce(silent));
}

async function runPullOnce(silent: boolean): Promise<void> {
  const store = useSyncStore.getState();
  if (!store.syncId) return;
  if (store.status === 'conflict') return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    useSyncStore.getState().setStatus('offline');
    return;
  }

  useSyncStore.getState().setStatus('syncing');
  try {
    const result = await getGraph(store.syncId);
    const remoteHead =
      result.kind === 'ok'
        ? { rev: result.envelope.rev, version: result.envelope.version }
        : undefined;
    const action = decideSyncAction(
      useSyncStore.getState().lastSyncedRev,
      useSyncStore.getState().dirty,
      remoteHead,
      CURRENT_VERSION,
    );

    if (action === 'refuse-version') {
      useSyncStore.getState().setStatus('error');
      notifyRefuseVersion();
      return;
    }
    if (action === 'conflict' && result.kind === 'ok') {
      takeConflictIfReal(result.envelope);
      return;
    }
    if (action === 'pull' && result.kind === 'ok') {
      const migrated = runMigrations(result.envelope.data, result.envelope.version);
      if (!migrated) {
        throw new Error('Failed to migrate synced graph');
      }
      applyRemoteGraph(migrated, result.envelope.rev, result.envelope.updatedAt);
      return;
    }
    if (action === 'push') {
      await upload(store.syncId, result.kind === 'ok' ? result.envelope.rev : undefined);
      return;
    }

    useSyncStore.getState().setStatus('idle');
    useSyncStore.getState().setError(undefined);
  } catch (error) {
    toastSyncError(error, 'Device sync failed', silent);
  }
}

async function runPushOnce(silent: boolean): Promise<void> {
  const store = useSyncStore.getState();
  if (!store.syncId || !store.dirty) return;
  if (store.status === 'conflict') return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    useSyncStore.getState().setStatus('offline');
    return;
  }

  useSyncStore.getState().setStatus('syncing');
  try {
    const result = await getGraph(store.syncId);
    const remoteHead =
      result.kind === 'ok'
        ? { rev: result.envelope.rev, version: result.envelope.version }
        : undefined;
    const action = decideSyncAction(
      useSyncStore.getState().lastSyncedRev,
      useSyncStore.getState().dirty,
      remoteHead,
      CURRENT_VERSION,
    );

    if (action === 'refuse-version') {
      useSyncStore.getState().setStatus('error');
      notifyRefuseVersion();
      return;
    }
    if (action === 'conflict' && result.kind === 'ok') {
      takeConflictIfReal(result.envelope);
      return;
    }
    if (action === 'pull' && result.kind === 'ok') {
      const migrated = runMigrations(result.envelope.data, result.envelope.version);
      if (!migrated) {
        throw new Error('Failed to migrate synced graph');
      }
      applyRemoteGraph(migrated, result.envelope.rev, result.envelope.updatedAt);
      return;
    }
    if (action === 'push' || action === 'ignore-stale') {
      await upload(store.syncId, result.kind === 'ok' ? result.envelope.rev : undefined);
      return;
    }

    useSyncStore.getState().setStatus('idle');
  } catch (error) {
    toastSyncError(error, 'Device sync failed', silent);
  }
}

export async function startDeviceSync(): Promise<string> {
  return enqueueSync(async () => {
    const id = generateSyncId();
    const envelope: SyncEnvelope = {
      version: CURRENT_VERSION,
      rev: 1,
      updatedAt: new Date().toISOString(),
      data: currentGraph(),
    };
    await putGraph(id, envelope);
    useSyncStore.getState().setLinked(id, envelope.rev, envelope.updatedAt);
    return id;
  });
}

export async function joinDeviceSync(rawCode: string): Promise<void> {
  const id = normalizeSyncId(rawCode);
  if (!id) {
    throw new Error('That code does not look right — check for typos');
  }
  return enqueueSync(async () => {
    const result = await getGraph(id);
    if (result.kind === 'not-found') {
      throw new Error('No graph found for that code');
    }
    if (result.envelope.version > CURRENT_VERSION) {
      notifyRefuseVersion();
      throw new Error('This graph was saved with a newer app version — update Planscape to sync');
    }
    const migrated = runMigrations(result.envelope.data, result.envelope.version);
    if (!migrated) {
      throw new Error('Failed to migrate synced graph');
    }
    applyRemoteGraph(migrated, result.envelope.rev, result.envelope.updatedAt);
    useSyncStore.getState().setLinked(id, result.envelope.rev, result.envelope.updatedAt);
  });
}

export function unlinkDevice(): void {
  useSyncStore.getState().unlink();
}

export async function keepLocalOnConflict(): Promise<void> {
  return enqueueSync(async () => {
    const { syncId, conflictRemote } = useSyncStore.getState();
    if (!syncId) return;
    useSyncStore.getState().clearConflict();
    useSyncStore.getState().markDirty();
    await upload(syncId, conflictRemote?.rev);
  });
}

export async function keepRemoteOnConflict(): Promise<void> {
  return enqueueSync(async () => {
    const remote = useSyncStore.getState().conflictRemote;
    if (!remote) return;
    if (remote.version > CURRENT_VERSION) {
      notifyRefuseVersion();
      return;
    }
    const migrated = runMigrations(remote.data, remote.version);
    if (!migrated) {
      toast.error('Failed to migrate synced graph');
      return;
    }
    applyRemoteGraph(migrated, remote.rev, remote.updatedAt);
  });
}

export function downloadConflictRemote(): void {
  const remote = useSyncStore.getState().conflictRemote;
  if (!remote) return;
  const migrated = runMigrations(remote.data, remote.version);
  if (!migrated) {
    toast.error('Failed to export the other device graph');
    return;
  }
  exportToJson(migrated);
}
