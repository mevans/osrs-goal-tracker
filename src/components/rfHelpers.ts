import type { Node, Edge } from '@xyflow/react';
import type { GraphNode, GraphEdge, DerivedStatus } from '../engine/types';
import { getNodeTitle } from '../engine/node-utils';
import type { CustomNodeData } from './nodes/CustomNode';
import type { FoldGroupNodeData } from './nodes/FoldGroupNode';

export type RfNodeData = CustomNodeData | FoldGroupNodeData;

export function buildRfNodes(
  visibleNodes: GraphNode[],
  allNodes: GraphNode[],
  statuses: Map<string, DerivedStatus>,
  options?: {
    highlightedIds?: Set<string> | null;
    selectedNodeIds?: string[];
    draggable?: boolean;
  },
): Node<RfNodeData>[] {
  const { highlightedIds, selectedNodeIds, draggable } = options ?? {};
  const nodeById = new Map(allNodes.map((n) => [n.id, n]));

  return visibleNodes.map((n) => {
    const base = {
      id: n.id,
      position: n.position,
      ...(selectedNodeIds !== undefined && { selected: selectedNodeIds.includes(n.id) }),
      ...(draggable !== undefined && { draggable }),
      className: highlightedIds && !highlightedIds.has(n.id) ? 'opacity-25' : '',
    };

    if (n.type === 'group' && n.groupData) {
      const members = n.groupData.memberIds
        .map((memberId) => {
          const member = nodeById.get(memberId);
          if (!member || member.type === 'group') return undefined;
          return {
            id: member.id,
            title: getNodeTitle(member),
            nodeType: member.type,
            status: statuses.get(member.id) ?? ('available' as DerivedStatus),
            complete: member.complete,
          };
        })
        .filter((m): m is NonNullable<typeof m> => m !== undefined);

      const foldNode: Node<FoldGroupNodeData> = {
        ...base,
        type: 'foldGroup' as const,
        connectable: false,
        data: {
          title: n.title,
          status: statuses.get(n.id) ?? 'available',
          members,
          completeCount: members.filter((m) => m.complete).length,
        },
      };
      return foldNode;
    }

    const customNode: Node<CustomNodeData> = {
      ...base,
      type: 'custom' as const,
      data: {
        title: n.title,
        nodeType: n.type,
        status: statuses.get(n.id) ?? 'available',
        complete: n.complete,
        subtitle: undefined,
        skillData: n.skillData,
        questData: n.questData,
        bossData: n.bossData,
        quantity: n.quantity,
        groupData: undefined,
        tags: n.tags,
      },
    };
    return customNode;
  });
}

export function buildRfEdges(
  edges: GraphEdge[],
  highlightedEdgeIds?: Set<string> | null,
  selectedEdgeIds?: string[],
): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    type: e.type,
    selected: selectedEdgeIds?.includes(e.id) ?? false,
    className: highlightedEdgeIds && !highlightedEdgeIds.has(e.id) ? 'opacity-25' : '',
  }));
}
