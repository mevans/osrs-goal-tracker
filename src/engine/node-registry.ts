import type { NodeType } from './types';

/** Visual family. Components map these to classes so the engine stays free of CSS. */
export type NodeAccent =
  | 'amber'
  | 'blue'
  | 'green'
  | 'emerald'
  | 'purple'
  | 'red'
  | 'cyan'
  | 'stone';

export interface NodeTypeInfo {
  type: NodeType;
  /** Name shown in the create dialog. */
  label: string;
  /** Compact name for the legend and planning list. */
  shortLabel: string;
  description: string;
  accent: NodeAccent;
  /** Offered in the add/edit dialog. Groups are created from a selection. */
  creatable: boolean;
  legend: boolean;
}

export const NODE_TYPES: readonly NodeTypeInfo[] = [
  {
    type: 'goal',
    label: 'Goal',
    shortLabel: 'Goal',
    description: 'End goals & item grinds',
    accent: 'amber',
    creatable: true,
    legend: true,
  },
  {
    type: 'quest',
    label: 'Quest',
    shortLabel: 'Quest',
    description: 'Quest completions',
    accent: 'blue',
    creatable: true,
    legend: true,
  },
  {
    type: 'skill',
    label: 'Skill Target',
    shortLabel: 'Skill',
    description: 'Train a skill to a level',
    accent: 'green',
    creatable: true,
    legend: true,
  },
  {
    type: 'diary',
    label: 'Diary',
    shortLabel: 'Diary',
    description: 'Achievement diary tasks',
    accent: 'emerald',
    creatable: true,
    legend: true,
  },
  {
    type: 'task',
    label: 'Task',
    shortLabel: 'Task',
    description: 'Actions & unlocks',
    accent: 'purple',
    creatable: true,
    legend: true,
  },
  {
    type: 'kill',
    label: 'Kill',
    shortLabel: 'Kill',
    description: 'Boss & monster kills',
    accent: 'red',
    creatable: true,
    legend: true,
  },
  {
    type: 'item',
    label: 'Acquire Item',
    shortLabel: 'Item',
    description: 'Items to obtain',
    accent: 'cyan',
    creatable: true,
    legend: true,
  },
  {
    type: 'group',
    label: 'Group',
    shortLabel: 'Group',
    description: 'Folded set of nodes',
    accent: 'stone',
    creatable: false,
    legend: false,
  },
];

const BY_TYPE = new Map(NODE_TYPES.map((info) => [info.type, info]));

export function getNodeTypeInfo(type: NodeType): NodeTypeInfo {
  const info = BY_TYPE.get(type);
  if (!info) throw new Error(`Unknown node type: ${type}`);
  return info;
}

export function creatableNodeTypes(): NodeTypeInfo[] {
  return NODE_TYPES.filter((info) => info.creatable);
}

export function legendNodeTypes(): NodeTypeInfo[] {
  return NODE_TYPES.filter((info) => info.legend);
}
