import { BaseEdge, getSmoothStepPath, type EdgeProps, type Edge } from '@xyflow/react';
import { EdgeActionBar } from './EdgeActions';

export function ImprovesEdge(props: EdgeProps<Edge>) {
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
        markerEnd="url(#improves-arrow)"
        style={{ stroke: '#a78bfa', strokeWidth: 2, strokeDasharray: '6 3' }}
        interactionWidth={20}
      />
      {props.selected && (
        <EdgeActionBar edgeId={props.id} edgeType="improves" labelX={labelX} labelY={labelY} />
      )}
    </>
  );
}

export function ImprovesArrowDef() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker
          id="improves-arrow"
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
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
    </svg>
  );
}
