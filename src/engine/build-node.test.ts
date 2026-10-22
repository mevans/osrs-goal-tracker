import { describe, expect, it } from 'vitest';
import { buildGraphNode } from './build-node';

describe('buildGraphNode', () => {
  it('keeps the payload for the node type and drops the others', () => {
    const node = buildGraphNode({
      id: 'prayer',
      type: 'skill',
      title: '70 Prayer',
      position: { x: 0, y: 0 },
      notes: undefined,
      skillData: { skillName: 'Prayer', targetLevel: 70, boost: undefined },
      questData: { questId: "Cook's Assistant" },
      bossData: { bossId: 'Abyssal Sire' },
      itemData: { itemId: '24539' },
      diaryData: { diaryId: 'Ardougne|easy', completed: [] },
      quantity: { target: 3, current: 1 },
      groupData: { memberIds: ['other'] },
      tags: undefined,
    });

    expect(node.skillData).toEqual({ skillName: 'Prayer', targetLevel: 70, boost: undefined });
    expect(node.quantity).toEqual({ target: 3, current: 1 });
    expect(node.questData).toBeUndefined();
    expect(node.bossData).toBeUndefined();
    expect(node.itemData).toBeUndefined();
    expect(node.diaryData).toBeUndefined();
    expect(node.groupData).toBeUndefined();
    expect(node.tags).toEqual([]);
  });

  it('keeps group membership only on group nodes', () => {
    const node = buildGraphNode({
      id: 'g',
      type: 'group',
      title: 'Pair',
      position: { x: 1, y: 2 },
      complete: true,
      notes: undefined,
      skillData: { skillName: 'Attack', targetLevel: 1, boost: undefined },
      questData: undefined,
      bossData: undefined,
      itemData: undefined,
      diaryData: undefined,
      quantity: undefined,
      groupData: { memberIds: ['a', 'b'] },
      tags: [],
    });

    expect(node.groupData).toEqual({ memberIds: ['a', 'b'] });
    expect(node.skillData).toBeUndefined();
    expect(node.complete).toBe(true);
  });
});
