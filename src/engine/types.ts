export type NodeType = 'goal' | 'quest' | 'skill' | 'task';
export type EdgeType = 'requires' | 'improves';
export type DerivedStatus = 'complete' | 'available' | 'blocked';

export const OSRS_SKILLS = [
  'Attack',
  'Strength',
  'Defence',
  'Ranged',
  'Prayer',
  'Magic',
  'Runecraft',
  'Hitpoints',
  'Crafting',
  'Mining',
  'Smithing',
  'Fishing',
  'Cooking',
  'Firemaking',
  'Woodcutting',
  'Agility',
  'Herblore',
  'Thieving',
  'Fletching',
  'Slayer',
  'Farming',
  'Construction',
  'Hunter',
] as const;

export type SkillName = (typeof OSRS_SKILLS)[number];

export interface SkillData {
  skillName: SkillName;
  targetLevel: number;
  boost: number | undefined;
}

export interface QuestData {
  questId: string;
}

export interface Quantity {
  target: number;
  current: number;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  position: { x: number; y: number };
  complete: boolean;
  notes: string | undefined;
  skillData: SkillData | undefined;
  questData: QuestData | undefined;
  quantity: Quantity | undefined;
  tags: string[];
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface BottleneckEntry {
  nodeId: string;
  blockedCount: number;
}

export function generateId(): string {
  return crypto.randomUUID();
}
