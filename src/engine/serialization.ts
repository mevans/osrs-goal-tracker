import type { GraphData } from './types';

const STORAGE_KEY = 'osrs-goal-tracker-graph';
const STORAGE_VERSION = 1;

interface StorageEnvelope {
  version: number;
  data: GraphData;
}

// --- localStorage ---

export function saveToLocalStorage(data: GraphData): void {
  const envelope: StorageEnvelope = { version: STORAGE_VERSION, data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export function loadFromLocalStorage(): GraphData | undefined {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const envelope = JSON.parse(raw) as StorageEnvelope;
    if (envelope.version !== STORAGE_VERSION) return undefined;
    return envelope.data;
  } catch {
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
  const json = JSON.stringify(data);
  const compressed = await compressString(json);
  const url = new URL('/shared', window.location.origin);
  url.searchParams.set('g', compressed);
  return url.toString();
}

export async function parseShareParam(param: string): Promise<GraphData | undefined> {
  try {
    const json = await decompressString(param);
    return JSON.parse(json) as GraphData;
  } catch {
    return undefined;
  }
}
