import type { NodeType, EdgeType, SkillName, Quantity, GraphNode } from './types';

export interface QuickAddSuggestion {
  title: string;
  type: NodeType;
  edgeType: EdgeType;
  skillData: { skillName: SkillName; targetLevel: number; boost: number | undefined } | undefined;
  quantity: Quantity | undefined;
  notes: string | undefined;
}

/**
 * Proof-of-concept suggestion data.
 * In the future this will be driven by full quest/item databases.
 */

const SKILL_SUGGESTIONS: Partial<Record<SkillName, QuickAddSuggestion[]>> = {
  Prayer: [
    {
      title: 'Gather Dragon Bones',
      type: 'goal',
      edgeType: 'improves',
      skillData: undefined,
      quantity: { target: 2600, current: 0 },
      notes: '~2,600 for 1–43 at a gilded altar',
    },
    {
      title: 'Unlock Gilded Altar',
      type: 'task',
      edgeType: 'improves',
      skillData: undefined,
      quantity: undefined,
      notes: '75 Construction (boostable from 70)',
    },
  ],
  Ranged: [
    {
      title: 'Gather Chinchompas',
      type: 'goal',
      edgeType: 'improves',
      skillData: undefined,
      quantity: { target: 5000, current: 0 },
      notes: 'Red/black chins — fast XP in MM2 tunnels',
    },
    {
      title: '55 Slayer',
      type: 'skill',
      edgeType: 'improves',
      skillData: { skillName: 'Slayer', targetLevel: 55, boost: undefined },
      quantity: undefined,
      notes: 'Unlocks Broad Bolts',
    },
  ],
  Cooking: [
    {
      title: 'Gather Raw Lobsters',
      type: 'goal',
      edgeType: 'improves',
      skillData: undefined,
      quantity: { target: 1000, current: 0 },
      notes: "Cook at Rogues' Den for no burn",
    },
    {
      title: 'Unlock Hosidius Kitchen',
      type: 'task',
      edgeType: 'improves',
      skillData: undefined,
      quantity: undefined,
      notes: '5% reduced burn rate',
    },
  ],
  Mining: [
    {
      title: 'Power Mine Iron',
      type: 'goal',
      edgeType: 'improves',
      skillData: undefined,
      quantity: undefined,
      notes: '3-rock spots, drop as you go',
    },
  ],
  Agility: [
    {
      title: 'Gather Marks of Grace',
      type: 'goal',
      edgeType: 'improves',
      skillData: undefined,
      quantity: { target: 260, current: 0 },
      notes: '260 = full Graceful outfit',
    },
  ],
  Herblore: [
    {
      title: 'Complete Druidic Ritual',
      type: 'quest',
      edgeType: 'requires',
      skillData: undefined,
      quantity: undefined,
      notes: 'Required to start Herblore',
    },
  ],
  Construction: [
    {
      title: 'Gather Oak Planks',
      type: 'goal',
      edgeType: 'improves',
      skillData: undefined,
      quantity: { target: 5000, current: 0 },
      notes: 'Oak larders 33+',
    },
  ],
  Magic: [
    {
      title: 'Gather Nature Runes',
      type: 'goal',
      edgeType: 'improves',
      skillData: undefined,
      quantity: { target: 3000, current: 0 },
      notes: 'For High Alchemy (55+)',
    },
  ],
  Strength: [
    {
      title: 'Complete Waterfall Quest',
      type: 'quest',
      edgeType: 'improves',
      skillData: undefined,
      quantity: undefined,
      notes: 'Instantly grants 30 Attack + 30 Strength',
    },
  ],
  Firemaking: [
    {
      title: 'Complete Wintertodt',
      type: 'goal',
      edgeType: 'improves',
      skillData: undefined,
      quantity: undefined,
      notes: 'Minigame — best at low HP. Requires 50 FM',
    },
  ],
};

/** Small proof-of-concept quest prereq data. Keyed by quest title (lowercase). */
const QUEST_SUGGESTIONS: Record<string, QuickAddSuggestion[]> = {
  'monkey madness i': [
    {
      title: 'The Grand Tree',
      type: 'quest',
      edgeType: 'requires',
      skillData: undefined,
      quantity: undefined,
      notes: 'Required sub-quest',
    },
    {
      title: 'Tree Gnome Village',
      type: 'quest',
      edgeType: 'requires',
      skillData: undefined,
      quantity: undefined,
      notes: 'Required sub-quest',
    },
  ],
  'animal magnetism': [
    {
      title: 'The Restless Ghost',
      type: 'quest',
      edgeType: 'requires',
      skillData: undefined,
      quantity: undefined,
      notes: 'Required sub-quest',
    },
    {
      title: 'Ernest the Chicken',
      type: 'quest',
      edgeType: 'requires',
      skillData: undefined,
      quantity: undefined,
      notes: 'Required sub-quest',
    },
    {
      title: 'Priest in Peril',
      type: 'quest',
      edgeType: 'requires',
      skillData: undefined,
      quantity: undefined,
      notes: 'Required sub-quest',
    },
    {
      title: '18 Slayer',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Slayer', targetLevel: 18, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
    {
      title: '19 Crafting',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Crafting', targetLevel: 19, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
    {
      title: '30 Ranged',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Ranged', targetLevel: 30, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
    {
      title: '35 Woodcutting',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Woodcutting', targetLevel: 35, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
  ],
  'recipe for disaster': [
    {
      title: '175 Quest Points',
      type: 'task',
      edgeType: 'requires',
      skillData: undefined,
      quantity: undefined,
      notes: 'Required for final boss',
    },
    {
      title: '70 Cooking',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Cooking', targetLevel: 70, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
  ],
  'dragon slayer i': [
    {
      title: '32 Quest Points',
      type: 'task',
      edgeType: 'requires',
      skillData: undefined,
      quantity: undefined,
      notes: 'Needed to start',
    },
  ],
  "legend's quest": [
    {
      title: "Heroes' Quest",
      type: 'quest',
      edgeType: 'requires',
      skillData: undefined,
      quantity: undefined,
      notes: 'Required sub-quest',
    },
    {
      title: '50 Agility',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Agility', targetLevel: 50, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
    {
      title: '50 Crafting',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Crafting', targetLevel: 50, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
    {
      title: '50 Mining',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Mining', targetLevel: 50, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
    {
      title: '50 Strength',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Strength', targetLevel: 50, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
    {
      title: '50 Thieving',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Thieving', targetLevel: 50, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
    {
      title: '50 Woodcutting',
      type: 'skill',
      edgeType: 'requires',
      skillData: { skillName: 'Woodcutting', targetLevel: 50, boost: undefined },
      quantity: undefined,
      notes: undefined,
    },
  ],
};

/**
 * Get contextual quick-add suggestions for a node.
 * Filters out suggestions whose titles already exist in the graph.
 */
export function getSuggestions(node: GraphNode, existingTitles: Set<string>): QuickAddSuggestion[] {
  let suggestions: QuickAddSuggestion[] = [];

  if (node.skillData) {
    suggestions = SKILL_SUGGESTIONS[node.skillData.skillName] ?? [];
  } else if (node.type === 'quest') {
    suggestions = QUEST_SUGGESTIONS[node.title.toLowerCase()] ?? [];
  }

  // Filter out already-existing nodes
  return suggestions.filter((s) => !existingTitles.has(s.title.toLowerCase()));
}
