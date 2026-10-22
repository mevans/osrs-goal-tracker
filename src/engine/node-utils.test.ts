import { describe, expect, it } from 'vitest';
import { getNodeTitle } from './node-utils';
import type { GraphNode } from './types';

function node(overrides: Partial<GraphNode> & Pick<GraphNode, 'type' | 'title'>): GraphNode {
  return {
    id: 'n',
    position: { x: 0, y: 0 },
    complete: false,
    notes: undefined,
    skillData: undefined,
    questData: undefined,
    bossData: undefined,
    itemData: undefined,
    diaryData: undefined,
    quantity: undefined,
    groupData: undefined,
    tags: [],
    ...overrides,
  };
}

describe('getNodeTitle', () => {
  it('uses the typed title for skills, quests, bosses, items, and diaries', () => {
    expect(
      getNodeTitle(
        node({
          type: 'skill',
          title: 'ignored',
          skillData: { skillName: 'Prayer', targetLevel: 70, boost: 5 },
        }),
      ),
    ).toBe('65+5 Prayer');

    expect(
      getNodeTitle(
        node({
          type: 'skill',
          title: 'ignored',
          skillData: { skillName: 'Attack', targetLevel: 70, boost: undefined },
        }),
      ),
    ).toBe('70 Attack');

    expect(
      getNodeTitle(
        node({ type: 'quest', title: 'ignored', questData: { questId: "Cook's Assistant" } }),
      ),
    ).toBe("Cook's Assistant");

    expect(
      getNodeTitle(node({ type: 'kill', title: 'ignored', bossData: { bossId: 'Abyssal Sire' } })),
    ).toBe('Abyssal Sire');

    expect(
      getNodeTitle(node({ type: 'item', title: 'ignored', itemData: { itemId: '24539' } })),
    ).toBe("'24-carat' sword");

    expect(
      getNodeTitle(
        node({
          type: 'diary',
          title: 'ignored',
          diaryData: { diaryId: 'Ardougne|easy', completed: [] },
        }),
      ),
    ).toBe('Ardougne Easy');
  });

  it('falls back to the stored title when typed data is missing or unknown', () => {
    expect(getNodeTitle(node({ type: 'goal', title: 'Fire cape' }))).toBe('Fire cape');
    expect(getNodeTitle(node({ type: 'quest', title: 'Custom quest' }))).toBe('Custom quest');
    expect(
      getNodeTitle(
        node({ type: 'quest', title: 'stored', questData: { questId: 'Not a real quest' } }),
      ),
    ).toBe('Not a real quest');
  });
});
