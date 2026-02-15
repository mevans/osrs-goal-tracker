import {
  SmoothStepEdge,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';
import { EdgeActionsLabel } from './EdgeActions';

export function RequiresEdge(props: EdgeProps<Edge>) {
  return (
    <>
      <SmoothStepEdge
        {...props}
        style={{
          stroke: '#94a3b8',
          strokeWidth: 2,
        }}
        markerEnd="url(#requires-arrow)"
      />
      <EdgeActionsLabel
        id={props.id}
        sourceX={props.sourceX}
        sourceY={props.sourceY}
        targetX={props.targetX}
        targetY={props.targetY}
        sourcePosition={props.sourcePosition}
        targetPosition={props.targetPosition}
      />
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
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
        </marker>
      </defs>
    </svg>
  );
}
