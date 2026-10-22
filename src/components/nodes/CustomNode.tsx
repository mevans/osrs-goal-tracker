import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type {
  NodeType,
  DerivedStatus,
  Quantity,
  SkillData,
  QuestData,
  BossData,
  ItemData,
  DiaryData,
} from '../../engine/types';
import { getNodeTitle } from '../../engine/node-utils';
import { diaryCheckedCount, getDiary } from '../../engine/diary-db';
import { SkillIcon } from '../SkillIcon';
import { BossIcon } from '../BossIcon';
import { ItemIcon } from '../ItemIcon';
import { nodeAppearance, statusAppearance } from '../node-appearance';
import { NODE_WIDTH, useSnappedFrame } from '../node-size';
import { useGraphActions } from '../graph-actions';

export interface CustomNodeData {
  title: string;
  nodeType: NodeType;
  status: DerivedStatus;
  complete: boolean;
  subtitle: string | undefined;
  skillData: SkillData | undefined;
  questData: QuestData | undefined;
  bossData: BossData | undefined;
  itemData: ItemData | undefined;
  diaryData: DiaryData | undefined;
  quantity: Quantity | undefined;
  tags: string[];
  [key: string]: unknown;
}

const PROGRESS_COLORS: Record<string, string> = {
  empty: 'bg-surface-600',
  partial: 'bg-amber-500',
  full: 'bg-green-500',
};

export function CustomNode({ data, selected, id }: NodeProps<Node<CustomNodeData>>) {
  const appearance = nodeAppearance(data.nodeType);
  const bgColor = appearance.surface;
  const borderColor = statusAppearance(data.status).border;
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

  const displayTitle = getNodeTitle({
    type: data.nodeType,
    title: data.title,
    skillData: data.skillData,
    questData: data.questData,
    bossData: data.bossData,
    itemData: data.itemData,
    diaryData: data.diaryData,
  });

  const actions = useGraphActions();
  const { frameRef, contentRef, height } = useSnappedFrame();
  const width = data.nodeType === 'diary' ? NODE_WIDTH.diary : NODE_WIDTH.standard;

  return (
    <div
      ref={frameRef}
      className={`rounded-lg border-2 ${borderColor} ${bgColor} ${ringClass} shadow-lg relative flex flex-col justify-center group transition-opacity duration-300`}
      style={{ width, height }}
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

      <div ref={contentRef} className="px-3 py-2">
        {data.skillData ? (
          <div className="flex items-center gap-2.5">
            <SkillIcon skill={data.skillData.skillName} size={36} />
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] uppercase tracking-wide text-stone-400 font-medium">
                  {appearance.shortLabel}
                </span>
                {data.complete && <span className="text-green-400 text-xs">&#10003;</span>}
              </div>
              <div className="text-sm font-medium text-white break-words">{displayTitle}</div>
            </div>
          </div>
        ) : data.bossData ? (
          <div className="flex items-center gap-2.5">
            <BossIcon bossId={data.bossData.bossId} size={36} />
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] uppercase tracking-wide text-stone-400 font-medium">
                  {appearance.shortLabel}
                </span>
                {data.complete && <span className="text-green-400 text-xs">&#10003;</span>}
              </div>
              <div className="text-sm font-medium text-white break-words">{displayTitle}</div>
            </div>
          </div>
        ) : data.itemData ? (
          <div className="flex items-center gap-2.5">
            <ItemIcon itemId={data.itemData.itemId} size={36} />
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] uppercase tracking-wide text-stone-400 font-medium">
                  {appearance.shortLabel}
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
                {appearance.shortLabel}
              </span>
              {data.complete && <span className="text-green-400 text-xs">&#10003;</span>}
            </div>
            <div className="text-sm font-medium text-white break-words">{displayTitle}</div>
            {data.subtitle && (
              <div className="text-xs text-stone-400 break-words mt-0.5">{data.subtitle}</div>
            )}
          </>
        )}

        {data.nodeType === 'diary' && data.diaryData && (
          <DiaryTaskList
            nodeId={id}
            diaryId={data.diaryData.diaryId}
            completed={data.diaryData.completed}
            onToggle={actions ? actions.toggleDiaryTask : undefined}
          />
        )}

        {q && (data.nodeType !== 'kill' || q.target > 0 || q.current > 0) && (
          <div className="mt-1.5">
            {data.nodeType === 'kill' && q.target === 0 ? (
              <span className="text-[10px] text-stone-400">{q.current} KC</span>
            ) : (
              <>
                <div className="flex items-center justify-between mb-0.5">
                  {data.nodeType === 'kill' ? (
                    <span className="text-[10px] text-stone-400">
                      {q.current} / {q.target} KC
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">
                      {q.current} / {q.target}
                    </span>
                  )}
                  <span className="text-[10px] text-stone-500">{progressPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-600/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </>
            )}
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
      </div>

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
  );
}

function DiaryTaskList({
  nodeId,
  diaryId,
  completed,
  onToggle,
}: {
  nodeId: string;
  diaryId: string;
  completed: boolean[];
  onToggle: ((nodeId: string, taskIndex: number) => void) | undefined;
}) {
  const tasks = getDiary(diaryId)?.tasks ?? [];
  if (tasks.length === 0) return null;
  const done = diaryCheckedCount(completed, tasks.length);

  return (
    <div className="mt-2 border-t border-green-800/80 pt-1.5">
      <div className="text-[10px] text-green-300/80 mb-1">
        {done}/{tasks.length}
      </div>
      <ul className="flex flex-col gap-1">
        {tasks.map((task, index) => {
          const checked = completed[index] ?? false;
          return (
            <li key={index}>
              <label className="nodrag nopan flex items-start gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!onToggle}
                  className="nodrag nopan mt-0.5 accent-green-500 shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => onToggle?.(nodeId, index)}
                />
                <span
                  className={`text-[11px] leading-snug ${
                    checked ? 'text-stone-500 line-through' : 'text-stone-100'
                  }`}
                >
                  {task.text}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
