import type { GraphNode } from './types';
import { getQuestName } from './quest-db';
import { getBossName } from './boss-db';

export function getNodeTitle(
  node: Pick<GraphNode, 'type' | 'title' | 'skillData' | 'questData' | 'bossData'>,
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
  return node.title;
}
