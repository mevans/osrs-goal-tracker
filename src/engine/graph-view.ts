import { computeAllStatuses, getAllDependents, getAllPrerequisites } from './graph-engine';
import {
  applyFoldView,
  computeGroupStatus,
  getMemberToGroupMap,
  isGroupComplete,
  resolveStoredEdgeId,
} from './fold-view';
import type { DerivedStatus, GraphEdge, GraphNode } from './types';

export interface GraphViewInput {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  hideCompleted: boolean;
}

export interface GraphView {
  statuses: Map<string, DerivedStatus>;
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
  /** Null when nothing is selected, so the canvas draws every node at full strength. */
  highlightedNodeIds: Set<string> | null;
  highlightedEdgeIds: Set<string> | null;
}

/**
 * Everything the canvas needs from a graph document: fold visibility, completion
 * filter, group status, and the requires-chain highlight.
 */
export function deriveGraphView(input: GraphViewInput): GraphView {
  const { nodes, edges, selectedNodeIds, selectedEdgeIds, hideCompleted } = input;

  const statuses = computeAllStatuses(nodes, edges);
  for (const node of nodes) {
    if (node.type === 'group') {
      statuses.set(node.id, computeGroupStatus(node, nodes, statuses));
    }
  }

  const foldView = applyFoldView(nodes, edges);
  const highlightedNodeIds = highlightNodes(nodes, edges, selectedNodeIds, selectedEdgeIds);
  const highlightedEdgeIds = highlightEdges(
    edges,
    foldView.visibleEdges,
    selectedEdgeIds,
    highlightedNodeIds,
  );

  let visibleNodes = foldView.visibleNodes;
  let visibleEdges = foldView.visibleEdges;
  if (hideCompleted) {
    const hiddenIds = completedIds(nodes);
    visibleNodes = visibleNodes.filter((node) => !hiddenIds.has(node.id));
    visibleEdges = visibleEdges.filter(
      (edge) => !hiddenIds.has(edge.from) && !hiddenIds.has(edge.to),
    );
  }

  return { statuses, visibleNodes, visibleEdges, highlightedNodeIds, highlightedEdgeIds };
}

function completedIds(nodes: GraphNode[]): Set<string> {
  const hidden = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'group') {
      if (isGroupComplete(node, nodes)) hidden.add(node.id);
    } else if (node.complete) {
      hidden.add(node.id);
    }
  }
  return hidden;
}

function highlightNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  selectedNodeIds: string[],
  selectedEdgeIds: string[],
): Set<string> | null {
  const memberToGroup = getMemberToGroupMap(nodes);

  const addGroupForMember = (set: Set<string>, nodeId: string) => {
    const groupId = memberToGroup.get(nodeId);
    if (groupId) set.add(groupId);
  };

  const addChain = (set: Set<string>, nodeId: string) => {
    getAllPrerequisites(nodeId, edges).forEach((id) => {
      set.add(id);
      addGroupForMember(set, id);
    });
    getAllDependents(nodeId, edges).forEach((id) => {
      set.add(id);
      addGroupForMember(set, id);
    });
  };

  if (selectedNodeIds.length > 0) {
    const set = new Set<string>();
    for (const nodeId of selectedNodeIds) {
      set.add(nodeId);
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.type === 'group' && node.groupData) {
        for (const memberId of node.groupData.memberIds) {
          set.add(memberId);
          addChain(set, memberId);
        }
      } else {
        addChain(set, nodeId);
      }
    }
    return set;
  }

  if (selectedEdgeIds.length > 0) {
    const set = new Set<string>();
    for (const edgeId of selectedEdgeIds) {
      const edge = edges.find((e) => e.id === resolveStoredEdgeId(edgeId));
      if (!edge) continue;
      set.add(edge.from);
      set.add(edge.to);
      addGroupForMember(set, edge.from);
      addGroupForMember(set, edge.to);
    }
    return set;
  }

  return null;
}

function highlightEdges(
  edges: GraphEdge[],
  visibleEdges: GraphEdge[],
  selectedEdgeIds: string[],
  highlightedNodeIds: Set<string> | null,
): Set<string> | null {
  if (!highlightedNodeIds) return null;
  const set = new Set<string>(selectedEdgeIds);
  for (const edge of visibleEdges) {
    const stored = edges.find((e) => e.id === resolveStoredEdgeId(edge.id));
    if (stored && highlightedNodeIds.has(stored.from) && highlightedNodeIds.has(stored.to)) {
      set.add(edge.id);
    }
  }
  return set;
}
