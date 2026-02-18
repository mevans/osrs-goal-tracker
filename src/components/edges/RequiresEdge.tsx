import { BaseEdge, getSmoothStepPath, type EdgeProps, type Edge } from '@xyflow/react';
import { EdgeActionBar } from './EdgeActions';

export function RequiresEdge(props: EdgeProps<Edge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 16,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd="url(#requires-arrow)"
        style={{ stroke: '#94a3b8', strokeWidth: 2 }}
        interactionWidth={20}
      />
      {props.selected && (
        <EdgeActionBar edgeId={props.id} edgeType="requires" labelX={labelX} labelY={labelY} />
      )}
    </>
  );
}

/** SVG marker definition — render once inside the ReactFlow wrapper. */
export function RequiresArrowDef() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker
          id="requires-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path
            d="M 1 1 L 9 5 L 1 9"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
    </svg>
  );
}
