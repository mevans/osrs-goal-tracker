/**
 * Small proof-of-concept quest database.
 * Future: expand with full requirements, rewards, etc.
 */

export interface QuestEntry {
  id: string;
  name: string;
  difficulty: 'novice' | 'intermediate' | 'experienced' | 'master' | 'grandmaster';
}

export const QUEST_DATABASE: Record<string, QuestEntry> = {
  'cooks-assistant': {
    id: 'cooks-assistant',
    name: "Cook's Assistant",
    difficulty: 'novice',
  },
  'demon-slayer': {
    id: 'demon-slayer',
    name: 'Demon Slayer',
    difficulty: 'novice',
  },
  'dragon-slayer-i': {
    id: 'dragon-slayer-i',
    name: 'Dragon Slayer I',
    difficulty: 'experienced',
  },
  'recipe-for-disaster': {
    id: 'recipe-for-disaster',
    name: 'Recipe for Disaster',
    difficulty: 'grandmaster',
  },
  'monkey-madness-i': {
    id: 'monkey-madness-i',
    name: 'Monkey Madness I',
    difficulty: 'master',
  },
  'monkey-madness-ii': {
    id: 'monkey-madness-ii',
    name: 'Monkey Madness II',
    difficulty: 'grandmaster',
  },
  'desert-treasure-i': {
    id: 'desert-treasure-i',
    name: 'Desert Treasure I',
    difficulty: 'master',
  },
  'animal-magnetism': {
    id: 'animal-magnetism',
    name: 'Animal Magnetism',
    difficulty: 'intermediate',
  },
  'legends-quest': {
    id: 'legends-quest',
    name: "Legend's Quest",
    difficulty: 'master',
  },
  'heroes-quest': {
    id: 'heroes-quest',
    name: "Heroes' Quest",
    difficulty: 'experienced',
  },
  'the-grand-tree': {
    id: 'the-grand-tree',
    name: 'The Grand Tree',
    difficulty: 'experienced',
  },
  'tree-gnome-village': {
    id: 'tree-gnome-village',
    name: 'Tree Gnome Village',
    difficulty: 'intermediate',
  },
  'underground-pass': {
    id: 'underground-pass',
    name: 'Underground Pass',
    difficulty: 'experienced',
  },
  'waterfall-quest': {
    id: 'waterfall-quest',
    name: 'Waterfall Quest',
    difficulty: 'intermediate',
  },
  'lost-city': {
    id: 'lost-city',
    name: 'Lost City',
    difficulty: 'experienced',
  },
};

export function getQuestName(questId: string): string {
  return QUEST_DATABASE[questId]?.name ?? questId;
}

export const ALL_QUESTS = Object.values(QUEST_DATABASE).sort((a, b) =>
  a.name.localeCompare(b.name),
);
