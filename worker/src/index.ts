const ID_RE = /^[0-9a-f]{32}$/;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const ALLOWED_ORIGINS = new Set(['http://localhost:5173', 'https://planscape.studio']);

interface GraphMeta {
  rev: number;
  schemaVersion: number;
}

interface KVNamespace {
  get(key: string, options?: { type?: 'text'; cacheTtl?: number }): Promise<string | null>;
  getWithMetadata(
    key: string,
    options?: { type?: 'text'; cacheTtl?: number },
  ): Promise<{ value: string | null; metadata: GraphMeta | null }>;
  put(key: string, value: string, options?: { metadata?: GraphMeta }): Promise<void>;
}

interface Env {
  GRAPHS: KVNamespace;
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin');
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://planscape.studio';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(request: Request, body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

function parseSyncId(pathname: string): string | undefined {
  const match = pathname.match(/^\/api\/sync\/([0-9a-f]{32})$/i);
  if (!match?.[1]) return undefined;
  const id = match[1].toLowerCase();
  return ID_RE.test(id) ? id : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEnvelope(
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const id = parseSyncId(url.pathname);
    if (!id) {
      return json(request, { error: 'Not found' }, 404);
    }

    if (request.method === 'GET') {
      const value = await env.GRAPHS.get(id, { type: 'text', cacheTtl: 30 });
      if (value === null) {
        return json(request, { error: 'Not found' }, 404);
      }
      return new Response(value, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request),
        },
      });
    }

    if (request.method === 'PUT') {
      const contentLength = Number(request.headers.get('Content-Length') ?? '0');
      if (contentLength > MAX_BODY_BYTES) {
        return json(request, { error: 'Payload too large' }, 413);
      }

      let text: string;
      try {
        text = await request.text();
      } catch {
        return json(request, { error: 'Invalid body' }, 400);
      }

      if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
        return json(request, { error: 'Payload too large' }, 413);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        return json(request, { error: 'Invalid JSON' }, 400);
      }

      const envelope = parseEnvelope(parsed);
      if (!envelope) {
        return json(request, { error: 'Invalid envelope' }, 400);
      }

      const existing = await env.GRAPHS.getWithMetadata(id, { type: 'text', cacheTtl: 30 });
      const storedVersion = existing.metadata?.schemaVersion;
      if (storedVersion !== undefined && storedVersion > envelope.version) {
        return json(request, { error: 'Newer schema already stored' }, 409);
      }

      await env.GRAPHS.put(id, JSON.stringify(envelope), {
        metadata: { rev: envelope.rev, schemaVersion: envelope.version },
      });

      return json(request, { rev: envelope.rev, updatedAt: envelope.updatedAt }, 200);
    }

    return json(request, { error: 'Method not allowed' }, 405);
  },
};
