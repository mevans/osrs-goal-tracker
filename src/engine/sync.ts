import type { GraphData } from './types';

export interface RemoteHead {
  rev: number;
  version: number;
}

export interface SyncEnvelope {
  version: number;
  rev: number;
  updatedAt: string;
  data: GraphData;
}

export type SyncAction = 'noop' | 'ignore-stale' | 'push' | 'pull' | 'conflict' | 'refuse-version';

export function graphSnapshotsEqual(a: GraphData, b: GraphData): boolean {
  return (
    JSON.stringify(a.nodes) === JSON.stringify(b.nodes) &&
    JSON.stringify(a.edges) === JSON.stringify(b.edges) &&
    JSON.stringify(a.notes) === JSON.stringify(b.notes)
  );
}

export function decideSyncAction(
  lastSyncedRev: number,
  dirty: boolean,
  remote: RemoteHead | undefined,
  currentVersion: number,
): SyncAction {
  if (remote !== undefined && remote.version > currentVersion) {
    return 'refuse-version';
  }
  if (remote === undefined) {
    return 'push';
  }
  if (remote.rev < lastSyncedRev) {
    return dirty ? 'push' : 'ignore-stale';
  }
  if (remote.rev === lastSyncedRev) {
    return dirty ? 'push' : 'noop';
  }
  return dirty ? 'conflict' : 'pull';
}

export function nextRev(lastSyncedRev: number, remoteRev: number | undefined): number {
  return Math.max(lastSyncedRev, remoteRev ?? 0) + 1;
}

export function generateSyncId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function formatSyncId(id: string): string {
  const chunks: string[] = [];
  for (let i = 0; i < id.length; i += 4) {
    chunks.push(id.slice(i, i + 4));
  }
  return chunks.join('-');
}

export function normalizeSyncId(input: string): string | undefined {
  const hex = input.toLowerCase().replace(/[^0-9a-f]/g, '');
  return /^[0-9a-f]{32}$/.test(hex) ? hex : undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseSyncEnvelope(
  raw: unknown,
): { version: number; rev: number; updatedAt: string; data: unknown } | undefined {
  if (!isRecord(raw)) return undefined;
  const version = raw['version'];
  const rev = raw['rev'];
  const updatedAt = raw['updatedAt'];
  const data = raw['data'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) return undefined;
  if (typeof rev !== 'number' || !Number.isInteger(rev) || rev < 1) return undefined;
  if (typeof updatedAt !== 'string' || updatedAt.length === 0) return undefined;
  if (!isRecord(data)) return undefined;
  return { version, rev, updatedAt, data };
}

export function formatSyncAge(iso: string | undefined, nowMs: number = Date.now()): string {
  if (!iso) return 'Not synced yet';
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 'Not synced yet';
  const deltaSec = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (deltaSec < 10) return 'Synced just now';
  if (deltaSec < 60) return `Last synced ${deltaSec}s ago`;
  const deltaMin = Math.floor(deltaSec / 60);
  if (deltaMin < 60) return `Last synced ${deltaMin}m ago`;
  const deltaHr = Math.floor(deltaMin / 60);
  if (deltaHr < 24) return `Last synced ${deltaHr}h ago`;
  const deltaDay = Math.floor(deltaHr / 24);
  return `Last synced ${deltaDay}d ago`;
}
