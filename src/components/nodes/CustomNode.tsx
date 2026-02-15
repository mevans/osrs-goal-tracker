import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { NodeType, DerivedStatus, Quantity, SkillData } from '../../engine/types';
import { SkillIcon } from '../SkillIcon';

export interface CustomNodeData {
  title: string;
  nodeType: NodeType;
  status: DerivedStatus;
  complete: boolean;
  subtitle: string | undefined;
  skillData: SkillData | undefined;
  quantity: Quantity | undefined;
  [key: string]: unknown;
}

const TYPE_COLORS: Record<NodeType, string> = {
  goal: 'bg-amber-900/60',
  quest: 'bg-blue-900/60',
  skill: 'bg-green-900/60',
  unlock: 'bg-purple-900/60',
};

const TYPE_LABELS: Record<NodeType, string> = {
  goal: 'Goal',
  quest: 'Quest',
  skill: 'Skill',
  unlock: 'Unlock',
};

const STATUS_BORDERS: Record<DerivedStatus, string> = {
  blocked: 'border-gray-500',
  available: 'border-blue-400',
  complete: 'border-green-400',
};

const PROGRESS_COLORS: Record<string, string> = {
  empty: 'bg-gray-600',
  partial: 'bg-amber-500',
  full: 'bg-green-500',
};

export function CustomNode({ data, selected }: NodeProps<Node<CustomNodeData>>) {
  const bgColor = TYPE_COLORS[data.nodeType];
  const borderColor = STATUS_BORDERS[data.status];
  const ringClass = selected ? 'ring-2 ring-white/50' : '';

  const q = data.quantity;
  const progressPct = q ? Math.min(100, Math.round((q.current / q.target) * 100)) : 0;
  const progressColor = q
    ? q.current >= q.target
      ? PROGRESS_COLORS['full']
      : q.current > 0
        ? PROGRESS_COLORS['partial']
        : PROGRESS_COLORS['empty']
    : '';

  return (
    <div
      className={`rounded-lg border-2 ${borderColor} ${bgColor} ${ringClass} px-3 py-2 min-w-[140px] max-w-[200px] shadow-lg`}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2.5 !h-2.5" />

      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
          {TYPE_LABELS[data.nodeType]}
        </span>
        {data.complete && <span className="text-green-400 text-xs">&#10003;</span>}
      </div>

      <div className="text-sm font-medium text-white truncate">{data.title}</div>

      {data.skillData ? (
        <div className="flex items-center gap-1 mt-0.5">
          <SkillIcon skill={data.skillData.skillName} size={14} />
          <span className="text-xs text-gray-400 truncate">{data.subtitle}</span>
        </div>
      ) : data.subtitle ? (
        <div className="text-xs text-gray-400 truncate mt-0.5">{data.subtitle}</div>
      ) : null}

      {q && (
        <div className="mt-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-gray-400">
              {q.current} / {q.target}
            </span>
            <span className="text-[10px] text-gray-500">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-600/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressColor}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2.5 !h-2.5" />
    </div>
  );
}
