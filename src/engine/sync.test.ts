import { describe, expect, it } from 'vitest';
import {
  decideSyncAction,
  graphSnapshotsEqual,
  formatSyncAge,
  formatSyncId,
  nextRev,
  normalizeSyncId,
  parseSyncEnvelope,
} from './sync';

describe('decideSyncAction', () => {
  const v = 5;

  it('pushes when remote is missing (first upload)', () => {
    expect(decideSyncAction(0, false, undefined, v)).toBe('push');
    expect(decideSyncAction(0, true, undefined, v)).toBe('push');
  });

  it('refuses when remote schema is newer than this app', () => {
    expect(decideSyncAction(1, false, { rev: 3, version: v + 1 }, v)).toBe('refuse-version');
    expect(decideSyncAction(1, true, { rev: 3, version: v + 1 }, v)).toBe('refuse-version');
  });

  it('ignores stale cache when remote rev is behind and local is clean', () => {
    expect(decideSyncAction(4, false, { rev: 2, version: v }, v)).toBe('ignore-stale');
  });

  it('pushes when remote cache is stale but local has new edits', () => {
    expect(decideSyncAction(4, true, { rev: 2, version: v }, v)).toBe('push');
  });

  it('noops when revs match and local is clean', () => {
    expect(decideSyncAction(3, false, { rev: 3, version: v }, v)).toBe('noop');
  });

  it('pushes when revs match and local is dirty', () => {
    expect(decideSyncAction(3, true, { rev: 3, version: v }, v)).toBe('push');
  });

  it('pulls when remote is ahead and local is clean', () => {
    expect(decideSyncAction(2, false, { rev: 5, version: v }, v)).toBe('pull');
  });

  it('conflicts when remote is ahead and local is dirty', () => {
    expect(decideSyncAction(2, true, { rev: 5, version: v }, v)).toBe('conflict');
  });
});

describe('graphSnapshotsEqual', () => {
  it('treats the same graph payload as equal', () => {
    const graph = { nodes: [], edges: [], notes: undefined };
    expect(graphSnapshotsEqual(graph, { nodes: [], edges: [], notes: undefined })).toBe(true);
    expect(graphSnapshotsEqual(graph, { nodes: [], edges: [], notes: 'different' })).toBe(false);
  });
});

describe('nextRev', () => {
  it('takes the max of local and remote then adds one', () => {
    expect(nextRev(3, undefined)).toBe(4);
    expect(nextRev(3, 3)).toBe(4);
    expect(nextRev(5, 2)).toBe(6);
    expect(nextRev(2, 8)).toBe(9);
  });
});

describe('sync id helpers', () => {
  it('formats 32 hex chars into 8 groups of 4', () => {
    const id = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
    expect(formatSyncId(id)).toBe('a1b2-c3d4-e5f6-0718-293a-4b5c-6d7e-8f90');
  });

  it('normalizes dashes, spaces, and case', () => {
    expect(normalizeSyncId('A1B2-c3d4 e5f6 0718 293A 4b5c 6d7e 8f90')).toBe(
      'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    );
  });

  it('rejects the wrong length', () => {
    expect(normalizeSyncId('abc')).toBeUndefined();
    expect(normalizeSyncId('a1b2c3d4e5f60718293a4b5c6d7e8f9g')).toBeUndefined();
  });
});

describe('parseSyncEnvelope', () => {
  it('accepts a valid envelope', () => {
    const parsed = parseSyncEnvelope({
      version: 5,
      rev: 2,
      updatedAt: '2026-08-31T00:00:00.000Z',
      data: { nodes: [], edges: [] },
    });
    expect(parsed?.rev).toBe(2);
    expect(parsed?.version).toBe(5);
  });

  it('rejects missing fields', () => {
    expect(parseSyncEnvelope({ version: 5, rev: 1 })).toBeUndefined();
    expect(parseSyncEnvelope(null)).toBeUndefined();
  });
});

describe('formatSyncAge', () => {
  const now = Date.parse('2026-08-31T12:00:00.000Z');

  it('describes recent and older timestamps', () => {
    expect(formatSyncAge(undefined, now)).toBe('Not synced yet');
    expect(formatSyncAge('2026-08-31T11:59:55.000Z', now)).toBe('Synced just now');
    expect(formatSyncAge('2026-08-31T11:59:15.000Z', now)).toBe('Last synced 45s ago');
    expect(formatSyncAge('2026-08-31T11:50:00.000Z', now)).toBe('Last synced 10m ago');
  });
});
