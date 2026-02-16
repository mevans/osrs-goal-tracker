import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { NodeType, DerivedStatus, Quantity, SkillData, QuestData } from '../../engine/types';
import { getQuestName } from '../../engine/quest-db';
import { SkillIcon } from '../SkillIcon';

export interface CustomNodeData {
  title: string;
  nodeType: NodeType;
  status: DerivedStatus;
  complete: boolean;
  subtitle: string | undefined;
  skillData: SkillData | undefined;
  questData: QuestData | undefined;
  quantity: Quantity | undefined;
  tags: string[];
  [key: string]: unknown;
}

const TYPE_COLORS: Record<NodeType, string> = {
  goal: 'bg-amber-900/60',
  quest: 'bg-blue-900/60',
  skill: 'bg-green-900/60',
  task: 'bg-purple-900/60',
};

const TYPE_LABELS: Record<NodeType, string> = {
  goal: 'Goal',
  quest: 'Quest',
  skill: 'Skill',
  task: 'Task',
};

const STATUS_BORDERS: Record<DerivedStatus, string> = {
  blocked: 'border-gray-600',
  available: 'border-gray-500',
  complete: 'border-green-500',
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

  // Derive display title based on node type
  const displayTitle =
    data.nodeType === 'skill' && data.skillData
      ? data.skillData.boost
        ? `${data.skillData.targetLevel - data.skillData.boost}+${data.skillData.boost} ${data.skillData.skillName}`
        : `${data.skillData.targetLevel} ${data.skillData.skillName}`
      : data.nodeType === 'quest' && data.questData
        ? getQuestName(data.questData.questId)
        : data.title;

  return (
    <div
      className={`rounded-lg border-2 ${borderColor} ${bgColor} ${ringClass} px-3 py-2 min-w-[140px] max-w-[200px] shadow-lg relative group transition-opacity duration-300`}
    >
      {/* Top handle - Prerequisites flow IN here */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-400 !w-3 !h-3 !border-2 !border-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Prerequisites connect here"
      />
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 uppercase tracking-wider pointer-events-none whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        ↓ needs
      </div>

      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
          {TYPE_LABELS[data.nodeType]}
        </span>
        {data.complete && <span className="text-green-400 text-xs">&#10003;</span>}
      </div>

      <div className="text-sm font-medium text-white truncate">{displayTitle}</div>

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

      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600/40 text-blue-200 border border-blue-500/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom handle - Dependents flow OUT from here */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-400 !w-3 !h-3 !border-2 !border-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Dependents connect from here"
      />
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 uppercase tracking-wider pointer-events-none whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        ↓ unlocks
      </div>
    </div>
  );
}
