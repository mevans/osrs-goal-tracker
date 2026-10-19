import type { GraphNode } from './types';
import { getQuestName } from './quest-db';
import { getDiaryName } from './diary-db';
import { getBossName } from './boss-db';
import { getItemName } from './item-db';

export function getNodeTitle(
  node: Pick<
    GraphNode,
    'type' | 'title' | 'skillData' | 'questData' | 'bossData' | 'itemData' | 'diaryData'
  >,
): string {
  if (node.type === 'skill' && node.skillData) {
    const { targetLevel, skillName, boost } = node.skillData;
    return boost ? `${targetLevel - boost}+${boost} ${skillName}` : `${targetLevel} ${skillName}`;
  }
  if (node.type === 'quest' && node.questData) {
    return getQuestName(node.questData.questId);
  }
  if (node.type === 'kill' && node.bossData) {
    return getBossName(node.bossData.bossId);
  }
  if (node.type === 'item' && node.itemData) {
    return getItemName(node.itemData.itemId);
  }
  if (node.type === 'diary' && node.diaryData) {
    return getDiaryName(node.diaryData.diaryId);
  }
  return node.title;
}
