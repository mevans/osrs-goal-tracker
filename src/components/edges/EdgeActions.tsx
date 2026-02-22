import { EdgeLabelRenderer } from '@xyflow/react';
import { useGraphStore } from '../../store/graph-store';
import { ShortcutHint } from '../Kbd';
import type { EdgeType } from '../../engine/types';

interface EdgeActionBarProps {
  edgeId: string;
  edgeType: EdgeType;
  labelX: number;
  labelY: number;
}

export function EdgeActionBar({ edgeId, edgeType, labelX, labelY }: EdgeActionBarProps) {
  const { reverseEdge, setEdgeType, removeEdge } = useGraphStore.getState();
  const isRequires = edgeType === 'requires';

  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          pointerEvents: 'all',
        }}
        className="nodrag nopan"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 bg-surface-800 border border-surface-border rounded-lg px-2 py-1.5 shadow-xl">
          {/* Reverse */}
          <button
            onClick={() => reverseEdge(edgeId)}
            className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-white px-1.5 py-1 rounded hover:bg-surface-700"
            title="Reverse direction"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Reverse
          </button>

          <div className="w-px h-5 bg-surface-border" />

          {/* Type toggle */}
          <div className="flex items-center bg-surface-700/60 rounded p-0.5">
            <button
              onClick={() => setEdgeType(edgeId, 'requires')}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                isRequires
                  ? 'bg-surface-600 text-stone-200 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Hard dependency"
            >
              Requires
            </button>
            <button
              onClick={() => setEdgeType(edgeId, 'improves')}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                !isRequires
                  ? 'bg-purple-600/60 text-purple-200 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Soft recommendation"
            >
              Improves
            </button>
          </div>

          <div className="w-px h-5 bg-surface-border" />

          {/* Delete */}
          <button
            onClick={() => removeEdge(edgeId)}
            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-surface-700"
            title="Delete edge"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Delete
            <ShortcutHint id="delete" />
          </button>
        </div>
      </div>
    </EdgeLabelRenderer>
  );
}
