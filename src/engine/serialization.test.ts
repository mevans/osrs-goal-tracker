import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GraphData } from './types';
import {
  buildShareUrl,
  importFromJson,
  loadFromLocalStorage,
  parseShareParam,
  saveToLocalStorage,
} from './serialization';

const STORAGE_KEY = 'osrs-goal-tracker-graph';

const graph: GraphData = {
  nodes: [
    {
      id: 'a',
      type: 'goal',
      title: 'Fire cape',
      position: { x: 1, y: 2 },
      complete: false,
      notes: undefined,
      skillData: undefined,
      questData: undefined,
      bossData: undefined,
      itemData: undefined,
      diaryData: undefined,
      quantity: undefined,
      groupData: undefined,
      tags: ['pvm'],
    },
  ],
  edges: [],
  notes: 'bring food',
};

function installMemoryStorage() {
  const memory = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => {
      memory.clear();
    },
  });
}

describe('local saves', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('round-trips the current graph', () => {
    installMemoryStorage();
    saveToLocalStorage(graph);
    const loaded = loadFromLocalStorage();
    expect(loaded?.nodes).toEqual(graph.nodes);
    expect(loaded?.edges).toEqual(graph.edges);
    expect(loaded?.notes).toBe('bring food');
  });

  it('migrates an unversioned save', () => {
    installMemoryStorage();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        nodes: [
          {
            id: 'a',
            type: 'goal',
            title: 'Fire cape',
            position: { x: 0, y: 0 },
            complete: true,
          },
        ],
        edges: [],
      }),
    );

    const loaded = loadFromLocalStorage();
    expect(loaded?.nodes[0]).toMatchObject({
      id: 'a',
      title: 'Fire cape',
      complete: true,
      tags: [],
    });
  });

  it('returns undefined for corrupt storage', () => {
    installMemoryStorage();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, '{');
    expect(loadFromLocalStorage()).toBeUndefined();
  });

  it('returns undefined when nothing is saved', () => {
    installMemoryStorage();
    expect(loadFromLocalStorage()).toBeUndefined();
  });
});

describe('import and share links', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('imports a versioned file and a legacy file', async () => {
    const versioned = new File([JSON.stringify({ version: 6, data: graph })], 'plan.json', {
      type: 'application/json',
    });
    const legacy = new File(
      [
        JSON.stringify({
          nodes: [
            {
              id: 'a',
              type: 'goal',
              title: 'Fire cape',
              position: { x: 0, y: 0 },
              complete: false,
            },
          ],
          edges: [],
        }),
      ],
      'old.json',
      { type: 'application/json' },
    );

    expect((await importFromJson(versioned))?.notes).toBe('bring food');
    expect((await importFromJson(legacy))?.nodes[0]?.tags).toEqual([]);
  });

  it('rejects a file that is not a graph', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const file = new File(['not json'], 'bad.json', { type: 'application/json' });
    expect(await importFromJson(file)).toBeUndefined();
  });

  it('round-trips a share link', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://planscape.studio' } });
    const url = await buildShareUrl(graph);
    const hash = new URL(url).hash;
    const param = new URLSearchParams(hash.slice(hash.indexOf('?'))).get('g');

    expect(url).toContain('#/shared?g=');
    expect(param).toBeTruthy();
    const loaded = await parseShareParam(param!);
    expect(loaded?.nodes).toEqual(graph.nodes);
    expect(loaded?.notes).toBe('bring food');
  });
});
