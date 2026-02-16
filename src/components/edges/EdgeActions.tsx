import { useGraphStore } from '../../store/graph-store';

interface EdgeActionsProps {
  clickX: number;
  clickY: number;
}

export function EdgeActions({ clickX, clickY }: EdgeActionsProps) {
  const selectedEdgeIds = useGraphStore((s) => s.selectedEdgeIds);
  const selectedEdgeId = selectedEdgeIds[0];
  const edge = useGraphStore((s) =>
    selectedEdgeIds[0] ? s.edges.find((e) => e.id === selectedEdgeIds[0]) : undefined,
  );

  if (!selectedEdgeId || !edge) return null;

  const { reverseEdge, setEdgeType, removeEdge, selectEdges } = useGraphStore.getState();
  const isRequires = edge.type === 'requires';

  return (
    <div
      className="fixed flex items-center gap-1.5 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 shadow-xl z-50"
      style={{
        left: clickX,
        top: clickY,
        transform: 'translate(-50%, -120%)',
      }}
    >
      {/* Reverse */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          reverseEdge(selectedEdgeId);
        }}
        className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white px-1.5 py-1 rounded hover:bg-gray-700"
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

      <div className="w-px h-5 bg-gray-600" />

      {/* Type toggle */}
      <div className="flex items-center bg-gray-700/60 rounded p-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEdgeType(selectedEdgeId, 'requires');
          }}
          className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
            isRequires
              ? 'bg-gray-600 text-slate-200 shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          title="Hard dependency"
        >
          Requires
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEdgeType(selectedEdgeId, 'improves');
          }}
          className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
            !isRequires
              ? 'bg-purple-600/60 text-purple-200 shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          title="Soft recommendation"
        >
          Improves
        </button>
      </div>

      <div className="w-px h-5 bg-gray-600" />

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeEdge(selectedEdgeId);
          selectEdges([]);
        }}
        className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-gray-700"
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
      </button>
    </div>
  );
}
