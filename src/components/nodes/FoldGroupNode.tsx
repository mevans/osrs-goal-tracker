import { useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { DerivedStatus, NodeType } from '../../engine/types';
import { nodeAppearance, statusAppearance } from '../node-appearance';
import { NODE_WIDTH, useSnappedFrame } from '../node-size';
import { useGraphActions } from '../graph-actions';

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
  title,
  onRename,
}: {
  title: string;
  onRename: ((title: string) => void) | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && onRename) onRename(trimmed);
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
        className="w-full text-sm font-semibold text-stone-100 bg-surface-700 border border-amber-500/50 rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-400"
        aria-label="Group name"
      />
    );
  }

  if (!onRename) {
    return (
      <div className="text-sm font-semibold text-stone-100 leading-snug break-words text-left w-full">
        {title}
      </div>
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
  const actions = useGraphActions();
  const [listExpanded, setListExpanded] = useState(false);
  const ringClass = selected ? 'ring-2 ring-amber-400/60' : '';
  const total = data.members.length;
  const done = data.completeCount;
  const toggleList = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setListExpanded((v) => !v);
  };
  const { frameRef, contentRef, height } = useSnappedFrame();

  return (
    <div
      ref={frameRef}
      className={`rounded-xl border border-dashed ${statusAppearance(data.status).ring} bg-surface-900/95 ${ringClass} shadow-xl overflow-hidden flex flex-col justify-center`}
      style={{ width: NODE_WIDTH.group, height }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="bg-amber-500/80! w-2.5! h-2.5! border-2! border-surface-900!"
      />

      <div ref={contentRef}>
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
              <GroupTitleInput
                title={data.title}
                onRename={actions ? (next) => actions.updateNode(id, { title: next }) : undefined}
              />
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
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md border-l-2 ${nodeAppearance(member.nodeType).accentBorder} bg-surface-800/50 hover:bg-surface-800`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusAppearance(member.status).dot}`}
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
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-amber-500/80! w-2.5! h-2.5! border-2! border-surface-900!"
      />
    </div>
  );
}
