import { EdgeLabelRenderer, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react';
import { useGraphStore } from '../../store/graph-store';

interface EdgeActionsLabelProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps<Edge>['sourcePosition'];
  targetPosition: EdgeProps<Edge>['targetPosition'];
}

export function EdgeActionsLabel({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeActionsLabelProps) {
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId);
  const edge = useGraphStore((s) => s.edges.find((e) => e.id === id));

  if (selectedEdgeId !== id || !edge) return null;

  const { reverseEdge, setEdgeType, removeEdge, selectEdge } = useGraphStore.getState();

  // Get midpoint using bezier path calculation
  const [, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isRequires = edge.type === 'requires';

  return (
    <EdgeLabelRenderer>
      <div
        className="absolute flex items-center gap-1 bg-gray-800 border border-gray-600 rounded-lg px-1.5 py-1 shadow-xl pointer-events-auto"
        style={{
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            reverseEdge(id);
          }}
          className="text-[11px] text-gray-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-gray-700"
          title="Reverse direction"
        >
          Reverse
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEdgeType(id, isRequires ? 'improves' : 'requires');
          }}
          className={`text-[11px] px-1.5 py-0.5 rounded hover:bg-gray-700 ${
            isRequires ? 'text-purple-400 hover:text-purple-300' : 'text-slate-400 hover:text-slate-300'
          }`}
          title={`Switch to ${isRequires ? 'improves' : 'requires'}`}
        >
          {isRequires ? 'Improves' : 'Requires'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeEdge(id);
            selectEdge(undefined);
          }}
          className="text-[11px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-gray-700"
          title="Delete edge"
        >
          Delete
        </button>
      </div>
    </EdgeLabelRenderer>
  );
}
