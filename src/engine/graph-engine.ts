import type { GraphNode, GraphEdge, DerivedStatus, BottleneckEntry } from './types';

/** Get IDs of nodes that are required prerequisites for `nodeId`. */
export function getRequiredPrerequisites(nodeId: string, edges: GraphEdge[]): string[] {
  return edges.filter((e) => e.to === nodeId && e.type === 'requires').map((e) => e.from);
}

/** Get IDs of nodes that depend on `nodeId` (i.e. nodeId is their prerequisite). */
export function getDependents(nodeId: string, edges: GraphEdge[]): string[] {
  return edges.filter((e) => e.from === nodeId && e.type === 'requires').map((e) => e.to);
}

/** Get IDs of nodes connected via "improves" edges (either direction). */
export function getImprovements(nodeId: string, edges: GraphEdge[]): string[] {
  return edges
    .filter((e) => e.type === 'improves' && (e.from === nodeId || e.to === nodeId))
    .map((e) => (e.from === nodeId ? e.to : e.from));
}

/** Get all nodes connected via "improves" edges transitively (entire improvement network). */
export function getAllImprovements(nodeId: string, edges: GraphEdge[]): Set<string> {
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const improvements = getImprovements(current, edges);
    for (const imp of improvements) {
      if (!visited.has(imp)) {
        queue.push(imp);
      }
    }
  }

  // Remove the starting node itself
  visited.delete(nodeId);
  return visited;
}

/**
 * Get all nodes connected to the given node(s) via any edge type in any direction.
 * @param nodeIds - Starting node IDs
 * @param edges - All edges in the graph
 * @param maxDepth - Maximum depth to traverse (default: 3 levels)
 */
export function getAllConnectedNodes(
  nodeIds: string[],
  edges: GraphEdge[],
  maxDepth: number = 3,
): Set<string> {
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = nodeIds.map((id) => ({ id, depth: 0 }));

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    // Stop traversing if we've reached max depth
    if (current.depth >= maxDepth) continue;

    // Find all edges connected to this node (in either direction, any type)
    const connectedEdges = edges.filter((e) => e.from === current.id || e.to === current.id);

    for (const edge of connectedEdges) {
      const connectedNode = edge.from === current.id ? edge.to : edge.from;
      if (!visited.has(connectedNode)) {
        queue.push({ id: connectedNode, depth: current.depth + 1 });
      }
    }
  }

  return visited;
}

/** Get all prerequisite IDs transitively (entire prerequisite tree). */
export function getAllPrerequisites(nodeId: string, edges: GraphEdge[]): Set<string> {
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const prereqs = getRequiredPrerequisites(current, edges);
    for (const prereq of prereqs) {
      if (!visited.has(prereq)) {
        queue.push(prereq);
      }
    }
  }

  // Remove the starting node itself
  visited.delete(nodeId);
  return visited;
}

/** Get all dependent IDs transitively (entire dependent tree). */
export function getAllDependents(nodeId: string, edges: GraphEdge[]): Set<string> {
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = getDependents(current, edges);
    for (const dep of deps) {
      if (!visited.has(dep)) {
        queue.push(dep);
      }
    }
  }

  // Remove the starting node itself
  visited.delete(nodeId);
  return visited;
}

/** Compute derived status for every node. */
export function computeAllStatuses(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, DerivedStatus> {
  const completedIds = new Set(nodes.filter((n) => n.complete).map((n) => n.id));
  const result = new Map<string, DerivedStatus>();

  for (const node of nodes) {
    if (node.complete) {
      result.set(node.id, 'complete');
      continue;
    }

    const requiredPrereqs = getRequiredPrerequisites(node.id, edges);
    const allPrereqsMet = requiredPrereqs.every((id) => completedIds.has(id));

    result.set(node.id, allPrereqsMet ? 'available' : 'blocked');
  }

  return result;
}

/** Get nodes that are not complete and have all required prerequisites met. */
export function getAvailableNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const statuses = computeAllStatuses(nodes, edges);
  return nodes.filter((n) => statuses.get(n.id) === 'available');
}

/** Get nodes that are blocked by incomplete prerequisites. */
export function getBlockedNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const statuses = computeAllStatuses(nodes, edges);
  return nodes.filter((n) => statuses.get(n.id) === 'blocked');
}

/**
 * Compute bottleneck rankings: for each incomplete node, count how many
 * other incomplete nodes are transitively blocked by it via "requires" edges.
 */
export function computeBottlenecks(
  nodes: GraphNode[],
  edges: GraphEdge[],
  topN: number = 10,
): BottleneckEntry[] {
  const completedIds = new Set(nodes.filter((n) => n.complete).map((n) => n.id));
  const incompleteIds = new Set(nodes.filter((n) => !n.complete).map((n) => n.id));

  // Build adjacency: from → [to] for "requires" edges
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.type !== 'requires') continue;
    const list = adjacency.get(edge.from);
    if (list) {
      list.push(edge.to);
    } else {
      adjacency.set(edge.from, [edge.to]);
    }
  }

  const entries: BottleneckEntry[] = [];

  for (const nodeId of incompleteIds) {
    // BFS forward: count reachable incomplete nodes
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.pop()!;
      const neighbors = adjacency.get(current);
      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && !completedIds.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (visited.size > 0) {
      entries.push({ nodeId, blockedCount: visited.size });
    }
  }

  entries.sort((a, b) => b.blockedCount - a.blockedCount);
  return entries.slice(0, topN);
}
