import { BaseEdge, getSmoothStepPath, type EdgeProps, type Edge } from '@xyflow/react';

export function ImprovesEdge(props: EdgeProps<Edge>) {
  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd="url(#improves-arrow)"
      style={{
        stroke: '#a78bfa',
        strokeWidth: 2,
        strokeDasharray: '6 3',
      }}
      interactionWidth={20}
    />
  );
}

export function ImprovesArrowDef() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker
          id="improves-arrow"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" />
        </marker>
      </defs>
    </svg>
  );
}
