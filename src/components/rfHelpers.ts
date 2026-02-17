import type { Node, Edge } from '@xyflow/react';
import type { GraphNode, GraphEdge, DerivedStatus } from '../engine/types';
import type { CustomNodeData } from './nodes/CustomNode';

export function buildRfNodes(
  nodes: GraphNode[],
  statuses: Map<string, DerivedStatus>,
  options?: {
    highlightedIds?: Set<string> | null;
    selectedNodeIds?: string[];
    draggable?: boolean;
  },
): Node<CustomNodeData>[] {
  const { highlightedIds, selectedNodeIds, draggable } = options ?? {};
  return nodes.map((n) => {
    const node: Node<CustomNodeData> = {
      id: n.id,
      type: 'custom' as const,
      position: n.position,
      selected: selectedNodeIds ? selectedNodeIds.includes(n.id) : false,
      draggable: draggable ?? false,
      className: highlightedIds && !highlightedIds.has(n.id) ? 'opacity-25' : '',
      data: {
        title: n.title,
        nodeType: n.type,
        status: statuses.get(n.id) ?? 'available',
        complete: n.complete,
        // subtitle is only meaningful for non-skill nodes; skill nodes show the icon row
        subtitle: n.skillData ? undefined : undefined,
        skillData: n.skillData,
        questData: n.questData,
        quantity: n.quantity,
        tags: n.tags,
      },
    };
    return node;
  });
}

export function buildRfEdges(edges: GraphEdge[], highlightedEdgeIds?: Set<string> | null): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    type: e.type,
    className: highlightedEdgeIds && !highlightedEdgeIds.has(e.id) ? 'opacity-25' : '',
  }));
}
