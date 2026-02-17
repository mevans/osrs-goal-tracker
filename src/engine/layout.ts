/**
 * Improved topological layout for graph nodes.
 * Groups nodes by their goal clusters and reduces edge crossings.
 */

interface LayoutNode {
  id: string;
  position: { x: number; y: number };
}

interface LayoutEdge {
  from: string;
  to: string;
}

const LAYER_GAP_Y = 160;
const NODE_GAP_X = 220;
const CLUSTER_GAP_X = 400;

/**
 * Find all sink nodes (nodes with no outgoing edges or type === 'goal').
 * These are the root goals that define clusters.
 */
function findSinkNodes(nodeIds: string[], edges: LayoutEdge[]): string[] {
  const hasOutgoing = new Set<string>();
  for (const edge of edges) {
    hasOutgoing.add(edge.from);
  }
  return nodeIds.filter((id) => !hasOutgoing.has(id));
}

/**
 * BFS backwards from a sink node to find all nodes in its cluster.
 * Returns a map of nodeId -> distance from sink.
 */
function findCluster(
  sinkId: string,
  nodeIds: Set<string>,
  edges: LayoutEdge[],
): Map<string, number> {
  // Build reverse adjacency: to -> [from]
  const incoming = new Map<string, string[]>();
  for (const id of nodeIds) {
    incoming.set(id, []);
  }
  for (const edge of edges) {
    if (nodeIds.has(edge.from) && nodeIds.has(edge.to)) {
      const list = incoming.get(edge.to);
      if (list) list.push(edge.from);
    }
  }

  const distances = new Map<string, number>();
  const queue: Array<{ id: string; dist: number }> = [{ id: sinkId, dist: 0 }];
  distances.set(sinkId, 0);

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    const parents = incoming.get(id) ?? [];

    for (const parentId of parents) {
      if (!distances.has(parentId)) {
        distances.set(parentId, dist + 1);
        queue.push({ id: parentId, dist: dist + 1 });
      }
    }
  }

  return distances;
}

/**
 * Assign nodes to clusters based on which sink they're closest to.
 * Returns a map of sinkId -> Set<nodeId>.
 */
function assignClusters(
  nodeIds: string[],
  edges: LayoutEdge[],
  sinkIds: string[],
): Map<string, Set<string>> {
  const nodeSet = new Set(nodeIds);
  const clusterAssignments = new Map<string, Set<string>>();
  const nodeToCluster = new Map<string, string>();

  for (const sinkId of sinkIds) {
    clusterAssignments.set(sinkId, new Set());
  }

  // For each sink, find all reachable nodes
  const allClusters = new Map<string, Map<string, number>>();
  for (const sinkId of sinkIds) {
    allClusters.set(sinkId, findCluster(sinkId, nodeSet, edges));
  }

  // Assign each node to the sink it's closest to
  for (const nodeId of nodeIds) {
    let minDist = Infinity;
    let bestSink: string | undefined;

    for (const [sinkId, distances] of allClusters) {
      const dist = distances.get(nodeId);
      if (dist !== undefined && dist < minDist) {
        minDist = dist;
        bestSink = sinkId;
      }
    }

    if (bestSink) {
      clusterAssignments.get(bestSink)!.add(nodeId);
      nodeToCluster.set(nodeId, bestSink);
    } else {
      // Orphan node — assign to first sink as fallback
      if (sinkIds.length > 0) {
        clusterAssignments.get(sinkIds[0]!)!.add(nodeId);
      }
    }
  }

  return clusterAssignments;
}

/**
 * Compute layered layout for a single cluster with barycenter crossing reduction.
 */
function layoutCluster(
  nodeIds: string[],
  edges: LayoutEdge[],
  origin: { x: number; y: number },
): Map<string, { x: number; y: number }> {
  const idSet = new Set(nodeIds);

  // Build adjacency
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  for (const id of nodeIds) {
    children.set(id, []);
    parents.set(id, []);
  }
  for (const edge of edges) {
    if (!idSet.has(edge.from) || !idSet.has(edge.to)) continue;
    children.get(edge.from)!.push(edge.to);
    parents.get(edge.to)!.push(edge.from);
  }

  // Compute depth via topological sort
  const depth = new Map<string, number>();

  function getDepth(id: string, visited: Set<string>): number {
    if (depth.has(id)) return depth.get(id)!;
    if (visited.has(id)) return 0; // cycle guard
    visited.add(id);

    const parentIds = parents.get(id) ?? [];
    if (parentIds.length === 0) {
      depth.set(id, 0);
      return 0;
    }

    const maxParentDepth = Math.max(...parentIds.map((p) => getDepth(p, visited)));
    const d = maxParentDepth + 1;
    depth.set(id, d);
    return d;
  }

  for (const id of nodeIds) {
    getDepth(id, new Set());
  }

  // Group by layer
  const layers = new Map<number, string[]>();
  for (const id of nodeIds) {
    const d = depth.get(id) ?? 0;
    const layer = layers.get(d);
    if (layer) {
      layer.push(id);
    } else {
      layers.set(d, [id]);
    }
  }

  const sortedDepths = [...layers.keys()].sort((a, b) => a - b);

  // Barycenter heuristic to reduce crossings
  // Sort nodes within each layer by average position of their parents/children
  const positions = new Map<string, { x: number; y: number }>();
  const layerXPos = new Map<string, number>(); // temp x positions for barycenter calc

  // Initial pass: assign preliminary x positions
  for (let i = 0; i < sortedDepths.length; i++) {
    const d = sortedDepths[i]!;
    const layerNodes = layers.get(d)!;

    if (i === 0) {
      // Root layer: just space evenly
      layerNodes.forEach((id, idx) => {
        layerXPos.set(id, idx * NODE_GAP_X);
      });
    } else {
      // Sort by barycenter of parent positions
      const withBarycenter = layerNodes.map((id) => {
        const parentIds = parents.get(id) ?? [];
        if (parentIds.length === 0) return { id, bc: 0 };
        const parentXs = parentIds.map((p) => layerXPos.get(p) ?? 0);
        const bc = parentXs.reduce((a, b) => a + b, 0) / parentXs.length;
        return { id, bc };
      });

      withBarycenter.sort((a, b) => a.bc - b.bc);
      withBarycenter.forEach(({ id }, idx) => {
        layerXPos.set(id, idx * NODE_GAP_X);
      });
    }
  }

  // Final pass: center each layer and assign absolute positions
  const maxWidth =
    Math.max(...sortedDepths.map((d) => (layers.get(d)?.length ?? 1) - 1)) * NODE_GAP_X;

  for (const d of sortedDepths) {
    const layerNodes = layers.get(d)!;
    const layerWidth = (layerNodes.length - 1) * NODE_GAP_X;
    const offsetX = (maxWidth - layerWidth) / 2;

    layerNodes.forEach((id, idx) => {
      positions.set(id, {
        x: origin.x + offsetX + idx * NODE_GAP_X,
        y: origin.y + d * LAYER_GAP_Y,
      });
    });
  }

  return positions;
}

/**
 * Main layout function: cluster by goals, layout each cluster, arrange horizontally.
 */
export function computeLayeredLayout(
  nodeIds: string[],
  edges: LayoutEdge[],
  origin: { x: number; y: number } = { x: 0, y: 0 },
): Map<string, { x: number; y: number }> {
  if (nodeIds.length === 0) return new Map();

  const sinkIds = findSinkNodes(nodeIds, edges);

  // If no clear sinks, fall back to simple layout
  if (sinkIds.length === 0) {
    return layoutCluster(nodeIds, edges, origin);
  }

  const clusters = assignClusters(nodeIds, edges, sinkIds);
  const allPositions = new Map<string, { x: number; y: number }>();

  let clusterOffsetX = origin.x;

  for (const [, clusterNodes] of clusters) {
    if (clusterNodes.size === 0) continue;

    const clusterNodeList = [...clusterNodes];
    const clusterPositions = layoutCluster(clusterNodeList, edges, {
      x: clusterOffsetX,
      y: origin.y,
    });

    // Find max X in this cluster to determine next cluster offset
    let maxX = clusterOffsetX;
    for (const pos of clusterPositions.values()) {
      if (pos.x > maxX) maxX = pos.x;
    }

    for (const [id, pos] of clusterPositions) {
      allPositions.set(id, pos);
    }

    clusterOffsetX = maxX + CLUSTER_GAP_X;
  }

  return allPositions;
}

/**
 * Apply layered layout to an array of nodes, returning new nodes with updated positions.
 */
export function applyLayout<T extends LayoutNode>(
  nodes: T[],
  edges: LayoutEdge[],
  origin?: { x: number; y: number },
): T[] {
  const positions = computeLayeredLayout(
    nodes.map((n) => n.id),
    edges,
    origin,
  );

  return nodes.map((n) => {
    const pos = positions.get(n.id);
    return pos ? { ...n, position: pos } : n;
  });
}
