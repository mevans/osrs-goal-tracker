import { describe, expect, it, vi } from 'vitest';
import { CURRENT_VERSION, runMigrations } from './migrations';

const legacyNode = {
  id: 'prayer',
  type: 'skill',
  title: '43 Prayer',
  position: { x: 10, y: 20 },
  complete: false,
  skillData: { skillName: 'Prayer', targetLevel: 43, boost: undefined },
};

const legacyEdge = { id: 'e1', from: 'prayer', to: 'cape', type: 'requires' };

describe('runMigrations', () => {
  it('brings a v0 save forward without dropping nodes, edges, or skill data', () => {
    const migrated = runMigrations(
      {
        nodes: [
          legacyNode,
          {
            id: 'cape',
            type: 'goal',
            title: 'Quest cape',
            position: { x: 0, y: 0 },
            complete: false,
          },
        ],
        edges: [legacyEdge],
      },
      0,
    );

    expect(migrated?.edges).toEqual([legacyEdge]);
    const prayer = migrated?.nodes.find((n) => n.id === 'prayer');
    expect(prayer).toMatchObject({
      title: '43 Prayer',
      skillData: { skillName: 'Prayer', targetLevel: 43 },
      tags: [],
    });
    expect(prayer && 'bossData' in prayer).toBe(true);
    expect(prayer && 'groupData' in prayer).toBe(true);
    expect(prayer && 'diaryData' in prayer).toBe(true);
    expect(migrated?.notes).toBeUndefined();
  });

  it('keeps group membership when migrating a v3 save', () => {
    const migrated = runMigrations(
      {
        nodes: [
          { ...legacyNode, tags: [] },
          {
            id: 'group',
            type: 'group',
            title: 'Early quests',
            position: { x: 0, y: 0 },
            complete: false,
            tags: ['quest'],
            groupData: { memberIds: ['prayer'], collapsed: true },
          },
        ],
        edges: [],
        notes: 'ironman',
      },
      3,
    );

    expect(migrated?.notes).toBe('ironman');
    expect(migrated?.nodes.find((n) => n.id === 'group')?.groupData?.memberIds).toEqual(['prayer']);
    expect(migrated?.nodes.find((n) => n.id === 'prayer')?.tags).toEqual([]);
  });

  it.each([1, 2, 4, 5])('loads a v%s save into the current schema', (version) => {
    const migrated = runMigrations(
      { nodes: [{ ...legacyNode, tags: ['keep'] }], edges: [] },
      version,
    );
    expect(migrated?.nodes[0]).toMatchObject({ id: 'prayer', tags: ['keep'] });
    expect(migrated?.nodes[0] && 'diaryData' in migrated.nodes[0]).toBe(true);
  });

  it('returns the current schema unchanged', () => {
    const current = { nodes: [], edges: [], notes: 'keep' };
    expect(runMigrations(current, CURRENT_VERSION)).toBe(current);
  });

  it('refuses a newer schema and a save the migrator cannot read', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(runMigrations({ nodes: [], edges: [] }, CURRENT_VERSION + 1)).toBeUndefined();
    expect(runMigrations({ nodes: null }, 0)).toBeUndefined();

    vi.restoreAllMocks();
  });
});
