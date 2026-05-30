import type { GraphNode, GraphEdge, DerivedStatus } from './types';
import { applyLayout } from './layout';

/** Strip fold proxy prefix from a canvas edge id. */
export function resolveStoredEdgeId(edgeId: string): string {
  return edgeId.startsWith('fold-') ? edgeId.slice(5) : edgeId;
}

/** IDs of member nodes hidden while their group exists on the canvas. */
export function getHiddenMemberIds(nodes: GraphNode[]): Set<string> {
  const hidden = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'group' && node.groupData) {
      for (const memberId of node.groupData.memberIds) {
        hidden.add(memberId);
      }
    }
  }
  return hidden;
}

/** Map hidden member id → containing group node id. */
export function getMemberToGroupMap(nodes: GraphNode[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of nodes) {
    if (node.type === 'group' && node.groupData) {
      for (const memberId of node.groupData.memberIds) {
        map.set(memberId, node.id);
      }
    }
  }
  return map;
}

/** Resolve an endpoint through fold proxies (member → group). */
export function resolveFoldEndpoint(id: string, memberToGroup: Map<string, string>): string {
  return memberToGroup.get(id) ?? id;
}

export interface FoldViewResult {
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
  hiddenMemberIds: Set<string>;
}

/**
 * Apply fold state for canvas rendering: hide group members and proxy
 * external edges to their group node. Stored graph data is unchanged.
 */
export function applyFoldView(nodes: GraphNode[], edges: GraphEdge[]): FoldViewResult {
  const hiddenMemberIds = getHiddenMemberIds(nodes);
  const visibleNodes = nodes.filter((n) => !hiddenMemberIds.has(n.id));

  if (hiddenMemberIds.size === 0) {
    return { visibleNodes, visibleEdges: edges, hiddenMemberIds };
  }

  const memberToGroup = getMemberToGroupMap(nodes);
  const seen = new Set<string>();
  const visibleEdges: GraphEdge[] = [];

  for (const edge of edges) {
    const from = resolveFoldEndpoint(edge.from, memberToGroup);
    const to = resolveFoldEndpoint(edge.to, memberToGroup);
    if (from === to) continue;

    const key = `${from}|${to}|${edge.type}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const proxied = edge.from !== from || edge.to !== to;
    visibleEdges.push({
      ...edge,
      id: proxied ? `fold-${edge.id}` : edge.id,
      from,
      to,
    });
  }

  return { visibleNodes, visibleEdges, hiddenMemberIds };
}

/** Aggregate status for a folded group from its members. */
export function computeGroupStatus(
  group: GraphNode,
  nodes: GraphNode[],
  statuses: Map<string, DerivedStatus>,
): DerivedStatus {
  const memberIds = group.groupData?.memberIds ?? [];
  if (memberIds.length === 0) return 'available';

  const members = memberIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is GraphNode => n !== undefined);

  if (members.length === 0) return 'available';
  if (members.every((m) => statuses.get(m.id) === 'complete')) return 'complete';
  if (members.some((m) => statuses.get(m.id) === 'available')) return 'available';
  return 'blocked';
}

/** Whether a node is already a member of any group. */
export function isGroupMember(nodeId: string, nodes: GraphNode[]): boolean {
  return nodes.some((n) => n.type === 'group' && n.groupData?.memberIds.includes(nodeId));
}

/** Group node id containing this member, if any. */
export function getGroupIdForMember(nodeId: string, nodes: GraphNode[]): string | undefined {
  const group = nodes.find((n) => n.type === 'group' && n.groupData?.memberIds.includes(nodeId));
  return group?.id;
}

/** Whether all members of a group are complete. */
export function isGroupComplete(group: GraphNode, nodes: GraphNode[]): boolean {
  const memberIds = group.groupData?.memberIds ?? [];
  if (memberIds.length === 0) return false;
  return memberIds.every((id) => nodes.find((n) => n.id === id)?.complete ?? false);
}

/** Expand group selections to their members for completion toggles. */
export function expandCompletionTargetIds(ids: string[], nodes: GraphNode[]): string[] {
  const result = new Set<string>();
  for (const id of ids) {
    const node = nodes.find((n) => n.id === id);
    if (node?.type === 'group' && node.groupData) {
      for (const memberId of node.groupData.memberIds) result.add(memberId);
    } else if (node && node.type !== 'group') {
      result.add(id);
    }
  }
  return [...result];
}

/** Expand group selections to members for clipboard copy (groups are not copied). */
export function expandCopyTargetIds(ids: string[], nodes: GraphNode[]): string[] {
  const result = new Set<string>();
  for (const id of ids) {
    const node = nodes.find((n) => n.id === id);
    if (node?.type === 'group' && node.groupData) {
      for (const memberId of node.groupData.memberIds) result.add(memberId);
    } else if (node && node.type !== 'group') {
      result.add(id);
    }
  }
  return [...result];
}

/** Member ids to select after removing group node(s). */
export function collectUnfoldSelection(removedIds: Set<string>, nodes: GraphNode[]): string[] {
  const selection: string[] = [];
  for (const id of removedIds) {
    const node = nodes.find((n) => n.id === id);
    if (node?.type === 'group' && node.groupData) {
      for (const memberId of node.groupData.memberIds) {
        if (!removedIds.has(memberId)) selection.push(memberId);
      }
    }
  }
  return selection;
}

/** Translate all members of a group by a delta (used when the group moves). */
export function applyGroupMemberTranslation(
  nodes: GraphNode[],
  groupId: string,
  delta: { x: number; y: number },
): GraphNode[] {
  const group = nodes.find((n) => n.id === groupId);
  if (!group?.groupData || (delta.x === 0 && delta.y === 0)) return nodes;

  const memberSet = new Set(group.groupData.memberIds);
  return nodes.map((n) =>
    memberSet.has(n.id)
      ? { ...n, position: { x: n.position.x + delta.x, y: n.position.y + delta.y } }
      : n,
  );
}

/** Sync group.complete from member completion state. */
export function syncGroupCompletionStates(nodes: GraphNode[]): GraphNode[] {
  return nodes.map((n) => {
    if (n.type !== 'group' || !n.groupData) return n;
    const complete = isGroupComplete(n, nodes);
    return complete === n.complete ? n : { ...n, complete };
  });
}

/** Apply position updates, moving group members when a group node moves. */
export function applyPositionUpdates(
  nodes: GraphNode[],
  positions: Map<string, { x: number; y: number }>,
): GraphNode[] {
  let result = nodes.map((n) => {
    const pos = positions.get(n.id);
    return pos ? { ...n, position: pos } : n;
  });

  for (const [id, newPos] of positions) {
    const oldNode = nodes.find((n) => n.id === id);
    if (oldNode?.type === 'group' && oldNode.groupData) {
      const delta = { x: newPos.x - oldNode.position.x, y: newPos.y - oldNode.position.y };
      result = applyGroupMemberTranslation(result, id, delta);
    }
  }

  return result;
}

/** Run tidy layout on the folded canvas view, keeping members aligned with their group. */
export function applyLayoutWithFolds(
  nodes: GraphNode[],
  edges: GraphEdge[],
  origin?: { x: number; y: number },
): GraphNode[] {
  const foldView = applyFoldView(nodes, edges);
  const laidOutVisible = applyLayout(
    foldView.visibleNodes,
    foldView.visibleEdges.map((e) => ({ from: e.from, to: e.to })),
    origin,
  );

  const posMap = new Map(laidOutVisible.map((n) => [n.id, n.position]));
  const positions = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const newPos = posMap.get(n.id);
    if (newPos) positions.set(n.id, newPos);
  }

  return applyPositionUpdates(nodes, positions);
}
