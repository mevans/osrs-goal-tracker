import { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeToolbar, type NodeProps, type Node } from '@xyflow/react';
import { toast } from 'sonner';
import type { DerivedStatus, NodeType } from '../../engine/types';
import { useGraphStore } from '../../store/graph-store';

export interface GroupMemberSummary {
  id: string;
  title: string;
  nodeType: NodeType;
  status: DerivedStatus;
  complete: boolean;
}

export interface FoldGroupNodeData {
  title: string;
  status: DerivedStatus;
  members: GroupMemberSummary[];
  completeCount: number;
  [key: string]: unknown;
}

const STATUS_DOT: Record<DerivedStatus, string> = {
  complete: 'bg-green-500',
  available: 'bg-amber-400',
  blocked: 'bg-stone-500',
};

const STATUS_RING: Record<DerivedStatus, string> = {
  complete: 'border-green-500/70',
  available: 'border-amber-500/50',
  blocked: 'border-stone-600',
};

const MEMBER_TYPE_ACCENT: Record<NodeType, string> = {
  goal: 'border-l-amber-500',
  quest: 'border-l-blue-500',
  skill: 'border-l-green-500',
  task: 'border-l-purple-500',
  kill: 'border-l-red-500',
  item: 'border-l-cyan-500',
  group: 'border-l-stone-500',
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GroupTitleInput({
  groupId,
  title,
  variant,
}: {
  groupId: string;
  title: string;
  variant: 'header' | 'toolbar';
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateNode } = useGraphStore.getState();

  useEffect(() => {
    setDraft(title);
  }, [title]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) updateNode(groupId, { title: trimmed });
    else setDraft(title);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(title);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') cancel();
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={
          variant === 'header'
            ? 'w-full text-sm font-semibold text-stone-100 bg-surface-700 border border-amber-500/50 rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-400'
            : 'w-full text-xs bg-surface-700 text-stone-200 rounded border border-surface-border px-2 py-1.5 focus:border-amber-500/50 focus:outline-none'
        }
        aria-label="Group name"
      />
    );
  }

  if (variant === 'toolbar') {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs py-1.5 px-2 rounded font-medium bg-surface-600 text-stone-200 hover:bg-surface-700 text-left w-full"
      >
        Rename…
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      title="Click to rename"
      className="text-sm font-semibold text-stone-100 leading-snug break-words text-left w-full hover:text-amber-100 transition-colors rounded px-0.5 -mx-0.5 hover:bg-surface-700/50"
    >
      {title}
    </button>
  );
}

export function FoldGroupNode({ data, selected, id }: NodeProps<Node<FoldGroupNodeData>>) {
  const { unfoldGroup } = useGraphStore.getState();
  const isMultiSelect = useGraphStore((s) => s.selectedNodeIds.length > 1);
  const [listExpanded, setListExpanded] = useState(false);
  const ringClass = selected ? 'ring-2 ring-amber-400/60' : '';
  const total = data.members.length;
  const done = data.completeCount;
  const toggleList = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setListExpanded((v) => !v);
  };

  return (
    <>
      <NodeToolbar isVisible={selected && !isMultiSelect} position={Position.Right} offset={12}>
        <div
          className="flex flex-col gap-1.5 bg-surface-800 border border-surface-border rounded-lg shadow-xl p-2 min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <GroupTitleInput groupId={id} title={data.title} variant="toolbar" />
          <button
            onClick={() => {
              unfoldGroup(id);
              toast.success('Group unfolded');
            }}
            className="text-xs py-1.5 px-2 rounded font-medium bg-amber-700/80 text-white hover:bg-amber-600"
          >
            Unfold
          </button>
        </div>
      </NodeToolbar>

      <div
        className={`rounded-xl border border-dashed ${STATUS_RING[data.status]} bg-surface-900/95 ${ringClass} shadow-xl w-[240px] overflow-hidden`}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="bg-amber-500/80! w-2.5! h-2.5! border-2! border-surface-900!"
        />

        {/* Header */}
        <div
          className={`px-3 py-2.5 bg-stone-800/40 ${listExpanded ? 'border-b border-surface-border/80' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-amber-500/90 shrink-0"
                  aria-hidden
                >
                  <path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" />
                </svg>
                <span className="text-[10px] uppercase tracking-wider text-amber-500/90 font-semibold">
                  Folded group
                </span>
              </div>
              <GroupTitleInput groupId={id} title={data.title} variant="header" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500/80 rounded-full transition-all"
                style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-[10px] text-stone-400 tabular-nums shrink-0">
              {done}/{total}
            </span>
          </div>
        </div>

        {listExpanded && (
          <ul className="py-1.5 px-1.5 space-y-0.5 max-h-[280px] overflow-y-auto">
            {data.members.map((member) => (
              <li
                key={member.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md border-l-2 ${MEMBER_TYPE_ACCENT[member.nodeType]} bg-surface-800/50 hover:bg-surface-800`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[member.status]}`}
                  title={member.status}
                />
                <span
                  className={`text-xs leading-snug break-words min-w-0 flex-1 ${
                    member.complete ? 'text-stone-500 line-through' : 'text-stone-200'
                  }`}
                >
                  {member.title}
                </span>
                {member.complete && (
                  <span className="text-green-500/80 text-[10px] shrink-0" aria-label="Complete">
                    ✓
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {total > 0 && (
          <button
            type="button"
            onClick={toggleList}
            className={`w-full px-3 py-2 text-[11px] text-stone-400 hover:text-amber-300 hover:bg-surface-800/80 flex items-center justify-center gap-1 transition-colors ${
              listExpanded ? 'border-t border-surface-border/60' : ''
            }`}
          >
            <span>{listExpanded ? 'View less' : 'View more'}</span>
            <ChevronIcon expanded={listExpanded} />
          </button>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          className="bg-amber-500/80! w-2.5! h-2.5! border-2! border-surface-900!"
        />
      </div>
    </>
  );
}
