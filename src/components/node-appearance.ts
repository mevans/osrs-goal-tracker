import type { DerivedStatus, NodeType } from '../engine/types';
import { getNodeTypeInfo, type NodeAccent } from '../engine/node-registry';

interface AccentClasses {
  surface: string;
  swatch: string;
  /** Left border used by nodes in a group and by the create dialog. */
  accentBorder: string;
  cardBorder: string;
  cardBg: string;
  iconColor: string;
  buttonClass: string;
}

const ACCENTS: Record<NodeAccent, AccentClasses> = {
  amber: {
    surface: 'bg-amber-900/60',
    swatch: 'bg-amber-500',
    accentBorder: 'border-l-amber-500',
    cardBorder: 'border-amber-500',
    cardBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    buttonClass: 'bg-amber-600 hover:bg-amber-500',
  },
  blue: {
    surface: 'bg-blue-900/60',
    swatch: 'bg-blue-500',
    accentBorder: 'border-l-blue-500',
    cardBorder: 'border-blue-500',
    cardBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    buttonClass: 'bg-brand hover:bg-brand-bright',
  },
  green: {
    surface: 'bg-green-900/60',
    swatch: 'bg-green-600',
    accentBorder: 'border-l-green-500',
    cardBorder: 'border-green-500',
    cardBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    buttonClass: 'bg-green-700 hover:bg-green-600',
  },
  emerald: {
    surface: 'bg-emerald-900/60',
    swatch: 'bg-emerald-500',
    accentBorder: 'border-l-emerald-500',
    cardBorder: 'border-emerald-500',
    cardBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    buttonClass: 'bg-emerald-700 hover:bg-emerald-600',
  },
  purple: {
    surface: 'bg-purple-900/60',
    swatch: 'bg-purple-600',
    accentBorder: 'border-l-purple-500',
    cardBorder: 'border-purple-500',
    cardBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    buttonClass: 'bg-purple-700 hover:bg-purple-600',
  },
  red: {
    surface: 'bg-red-900/60',
    swatch: 'bg-red-600',
    accentBorder: 'border-l-red-500',
    cardBorder: 'border-red-500',
    cardBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    buttonClass: 'bg-red-700 hover:bg-red-600',
  },
  cyan: {
    surface: 'bg-cyan-900/60',
    swatch: 'bg-cyan-600',
    accentBorder: 'border-l-cyan-500',
    cardBorder: 'border-cyan-500',
    cardBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    buttonClass: 'bg-cyan-700 hover:bg-cyan-600',
  },
  stone: {
    surface: 'bg-stone-700/60',
    swatch: 'bg-stone-500',
    accentBorder: 'border-l-stone-500',
    cardBorder: 'border-stone-500',
    cardBg: 'bg-stone-500/10',
    iconColor: 'text-stone-300',
    buttonClass: 'bg-stone-600 hover:bg-stone-500',
  },
};

const STATUS = {
  complete: {
    border: 'border-green-500',
    dot: 'bg-green-400',
    ring: 'border-green-500/70',
    swatch: 'border-green-500',
  },
  available: {
    border: 'border-blue-400',
    dot: 'bg-blue-400',
    ring: 'border-blue-400/60',
    swatch: 'border-blue-400',
  },
  blocked: {
    border: 'border-stone-600',
    dot: 'bg-stone-500',
    ring: 'border-stone-600',
    swatch: 'border-surface-border',
  },
} as const satisfies Record<
  DerivedStatus,
  { border: string; dot: string; ring: string; swatch: string }
>;

export function nodeAppearance(type: NodeType) {
  const info = getNodeTypeInfo(type);
  return { ...info, ...ACCENTS[info.accent] };
}

export function statusAppearance(status: DerivedStatus) {
  return STATUS[status];
}
