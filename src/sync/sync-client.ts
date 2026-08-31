import type { SyncEnvelope } from '../engine/sync';
import { parseSyncEnvelope } from '../engine/sync';

const SYNC_PATH = '/api/sync';

export class SyncHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'SyncHttpError';
    this.status = status;
  }
}

export type GetGraphResult = { kind: 'ok'; envelope: SyncEnvelope } | { kind: 'not-found' };

export async function getGraph(id: string): Promise<GetGraphResult> {
  const response = await fetch(`${SYNC_PATH}/${id}`);
  if (response.status === 404) return { kind: 'not-found' };
  if (!response.ok) {
    throw new SyncHttpError(response.status, await errorMessage(response, 'Failed to fetch graph'));
  }
  const raw: unknown = await response.json();
  const parsed = parseSyncEnvelope(raw);
  if (!parsed) {
    throw new SyncHttpError(500, 'Invalid sync payload');
  }
  return {
    kind: 'ok',
    envelope: {
      version: parsed.version,
      rev: parsed.rev,
      updatedAt: parsed.updatedAt,
      data: parsed.data as SyncEnvelope['data'],
    },
  };
}

export async function putGraph(id: string, envelope: SyncEnvelope): Promise<void> {
  const response = await fetch(`${SYNC_PATH}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope),
  });
  if (!response.ok) {
    throw new SyncHttpError(response.status, await errorMessage(response, 'Failed to save graph'));
  }
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const raw: unknown = await response.json();
    if (typeof raw === 'object' && raw !== null && 'error' in raw) {
      const error = (raw as { error: unknown }).error;
      if (typeof error === 'string') return error;
    }
  } catch {
    // ignore parse failure
  }
  return fallback;
}
