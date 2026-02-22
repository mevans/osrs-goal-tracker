import { Handle, Position, NodeToolbar, type NodeProps, type Node } from '@xyflow/react';
import { toast } from 'sonner';
import type { NodeType, DerivedStatus, Quantity, SkillData, QuestData } from '../../engine/types';
import { getQuestName } from '../../engine/quest-db';
import { SkillIcon } from '../SkillIcon';
import { ShortcutHint } from '../Kbd';
import { useGraphStore } from '../../store/graph-store';
import { useUIStore } from '../../store/ui-store';

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
  blocked: 'border-surface-border',
  available: 'border-surface-600',
  complete: 'border-green-500',
};

const PROGRESS_COLORS: Record<string, string> = {
  empty: 'bg-surface-600',
  partial: 'bg-amber-500',
  full: 'bg-green-500',
};

export function CustomNode({ data, selected, id }: NodeProps<Node<CustomNodeData>>) {
  const bgColor = TYPE_COLORS[data.nodeType];
  const borderColor = STATUS_BORDERS[data.status];
  const ringClass = selected ? 'ring-2 ring-white/50' : '';

  const q = data.quantity;
  const progressPct =
    q && q.target > 0 ? Math.min(100, Math.round((q.current / q.target) * 100)) : 0;
  const progressColor = q
    ? q.current >= q.target
      ? PROGRESS_COLORS['full']
      : q.current > 0
        ? PROGRESS_COLORS['partial']
        : PROGRESS_COLORS['empty']
    : '';

  const displayTitle =
    data.nodeType === 'skill' && data.skillData
      ? data.skillData.boost
        ? `${data.skillData.targetLevel - data.skillData.boost}+${data.skillData.boost} ${data.skillData.skillName}`
        : `${data.skillData.targetLevel} ${data.skillData.skillName}`
      : data.nodeType === 'quest' && data.questData
        ? getQuestName(data.questData.questId)
        : data.title;

  const canEdit = true;
  const isMultiSelect = useGraphStore((s) => s.selectedNodeIds.length > 1);
  const { updateNode, toggleNodeComplete, removeNode } = useGraphStore.getState();
  const { setEditingNodeId } = useUIStore.getState();

  return (
    <>
      <NodeToolbar
        isVisible={selected === true && !isMultiSelect}
        position={Position.Right}
        offset={8}
      >
        <div
          className="flex flex-col gap-1.5 bg-surface-800 border border-surface-border rounded-lg shadow-xl p-2 min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleNodeComplete(id)}
            className={`text-xs py-1.5 px-2 rounded font-medium flex items-center justify-between gap-2 ${
              data.complete
                ? 'bg-surface-600 text-stone-300 hover:bg-surface-700'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
          >
            <span>{data.complete ? '✓ Completed' : 'Mark Complete'}</span>
            <ShortcutHint id="toggleComplete" />
          </button>

          {q && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    const step = e.shiftKey ? (e.ctrlKey || e.metaKey ? 100 : 10) : 1;
                    updateNode(id, { quantity: { ...q, current: Math.max(0, q.current - step) } });
                  }}
                  disabled={q.current === 0}
                  className="text-xs w-7 h-7 rounded bg-surface-700 text-stone-300 hover:bg-surface-600 disabled:opacity-50 shrink-0"
                  title="−1  (shift: −10,  ctrl+shift: −100)"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={q.target}
                  value={q.current}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(q.target, Number(e.target.value) || 0));
                    updateNode(id, { quantity: { ...q, current: val } });
                  }}
                  className="min-w-0 flex-1 text-center text-xs bg-surface-700 text-stone-200 rounded border border-surface-border focus:border-brand focus:outline-none py-1 [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                />
                <span className="text-xs text-stone-400 shrink-0">/ {q.target}</span>
                <button
                  onClick={(e) => {
                    const step = e.shiftKey ? (e.ctrlKey || e.metaKey ? 100 : 10) : 1;
                    updateNode(id, {
                      quantity: { ...q, current: Math.min(q.target, q.current + step) },
                    });
                  }}
                  disabled={q.current >= q.target}
                  className="text-xs w-7 h-7 rounded bg-surface-700 text-stone-300 hover:bg-surface-600 disabled:opacity-50 shrink-0"
                  title="+1  (shift: +10,  ctrl+shift: +100)"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-stone-500 text-center">shift ×10 · ctrl ×100</p>
            </div>
          )}

          {canEdit && (
            <button
              onClick={() => setEditingNodeId(id)}
              className="text-xs py-1.5 px-2 rounded bg-brand/20 text-brand-text hover:bg-brand/30 border border-brand/30 flex items-center justify-between gap-2"
            >
              <span>Edit Details</span>
              <ShortcutHint id="editNode" />
            </button>
          )}

          <div className="h-px bg-surface-border -mx-0.5" />

          <button
            onClick={() => {
              removeNode(id);
              toast.success('Node deleted');
            }}
            className="text-xs py-1.5 px-2 rounded text-red-400 hover:text-red-300 hover:bg-surface-700 flex items-center justify-between gap-2"
          >
            <span>Delete</span>
            <ShortcutHint id="delete" />
          </button>
        </div>
      </NodeToolbar>

      <div
        className={`rounded-lg border-2 ${borderColor} ${bgColor} ${ringClass} px-3 py-2 w-[180px] shadow-lg relative group transition-opacity duration-300`}
      >
        {/* Top handle - Prerequisites flow IN here */}
        <Handle
          type="target"
          position={Position.Top}
          className="bg-blue-400! w-3! h-3! border-2! border-surface-900! opacity-0 group-hover:opacity-100 transition-opacity"
          title="Prerequisites connect here"
        />
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-stone-400 uppercase tracking-wider pointer-events-none whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          ↓ needs
        </div>

        {data.skillData ? (
          <div className="flex items-center gap-2.5">
            <SkillIcon skill={data.skillData.skillName} size={36} />
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] uppercase tracking-wide text-stone-400 font-medium">
                  {TYPE_LABELS[data.nodeType]}
                </span>
                {data.complete && <span className="text-green-400 text-xs">&#10003;</span>}
              </div>
              <div className="text-sm font-medium text-white break-words">{displayTitle}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] uppercase tracking-wide text-stone-400 font-medium">
                {TYPE_LABELS[data.nodeType]}
              </span>
              {data.complete && <span className="text-green-400 text-xs">&#10003;</span>}
            </div>
            <div className="text-sm font-medium text-white break-words">{displayTitle}</div>
            {data.subtitle && (
              <div className="text-xs text-stone-400 break-words mt-0.5">{data.subtitle}</div>
            )}
          </>
        )}

        {q && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-stone-400">
                {q.current} / {q.target}
              </span>
              <span className="text-[10px] text-stone-500">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-600/80 rounded-full overflow-hidden">
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
                className="text-[9px] px-1.5 py-0.5 rounded bg-brand/20 text-brand-text border border-brand/30"
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
          className="bg-purple-400! w-3! h-3! border-2! border-surface-900! opacity-0 group-hover:opacity-100 transition-opacity"
          title="Dependents connect from here"
        />
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-stone-400 uppercase tracking-wider pointer-events-none whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          ↓ unlocks
        </div>
      </div>
    </>
  );
}
