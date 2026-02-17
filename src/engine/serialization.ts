import type { GraphData } from './types';
import { CURRENT_VERSION, runMigrations } from './migrations';

const STORAGE_KEY = 'osrs-goal-tracker-graph';

interface StorageEnvelope {
  version: number;
  data: GraphData;
}

// --- localStorage ---

export function saveToLocalStorage(data: GraphData): void {
  const envelope: StorageEnvelope = { version: CURRENT_VERSION, data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export function loadFromLocalStorage(): GraphData | undefined {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const envelope = JSON.parse(raw) as StorageEnvelope;

    // Handle legacy data without version field
    const version = envelope.version ?? 0;
    const rawData: unknown = envelope.data ?? envelope; // Legacy: entire object was GraphData

    // Run migrations if needed
    return runMigrations(rawData, version);
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return undefined;
  }
}

// --- URL sharing via CompressionStream ---

async function compressString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(input));
      controller.close();
    },
  });

  const compressedStream = stream.pipeThrough(new CompressionStream('deflate-raw'));
  const reader = compressedStream.getReader();
  const chunks: Uint8Array[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return btoa(String.fromCharCode(...merged))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function decompressString(encoded: string): Promise<string> {
  // Restore base64 padding
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

  const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate-raw'));
  const reader = decompressedStream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();
  return result;
}

export async function buildShareUrl(data: GraphData): Promise<string> {
  const envelope: StorageEnvelope = { version: CURRENT_VERSION, data };
  const json = JSON.stringify(envelope);
  const compressed = await compressString(json);
  const url = new URL('/shared', window.location.origin);
  url.searchParams.set('g', compressed);
  return url.toString();
}

export async function parseShareParam(param: string): Promise<GraphData | undefined> {
  try {
    const json = await decompressString(param);
    const envelope = JSON.parse(json) as StorageEnvelope;

    // Handle legacy URLs without version field
    const version = envelope.version ?? 0;
    const rawData: unknown = envelope.data ?? envelope; // Legacy: entire object was GraphData

    // Run migrations if needed
    return runMigrations(rawData, version);
  } catch (error) {
    console.error('Failed to parse share URL:', error);
    return undefined;
  }
}

// --- JSON Export/Import ---

export function exportToJson(data: GraphData): void {
  const envelope: StorageEnvelope = { version: CURRENT_VERSION, data };
  const json = JSON.stringify(envelope, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `osrs-planner-${timestamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export async function importFromJson(file: File): Promise<GraphData | undefined> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    // Handle both versioned and legacy formats
    const envelope = parsed as StorageEnvelope;
    const version = envelope.version ?? 0;
    const rawData = envelope.data ?? parsed; // Legacy: entire object was GraphData

    // Run migrations if needed
    return runMigrations(rawData, version);
  } catch (error) {
    console.error('Failed to import JSON:', error);
    return undefined;
  }
}
