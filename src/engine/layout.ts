/**
 * Tidy layout.
 * Each sink is a goal. Nodes that lead only to that goal stay in its column.
 * Nodes that lead to several goals sit between those columns. Goal columns
 * that share nodes are placed beside each other.
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
const COLUMN_GAP = 180;

function adjacency(nodeIds: string[], edges: LayoutEdge[]) {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const id of nodeIds) {
    outgoing.set(id, []);
    incoming.set(id, []);
  }
  for (const edge of edges) {
    if (!outgoing.has(edge.from) || !incoming.has(edge.to)) continue;
    outgoing.get(edge.from)!.push(edge.to);
    incoming.get(edge.to)!.push(edge.from);
  }
  return { outgoing, incoming };
}

/** Sinks each node can reach, including itself when it is a sink. Cycles add none. */
function reachableSinks(
  nodeIds: string[],
  edges: LayoutEdge[],
  outgoing: Map<string, string[]>,
): Map<string, Set<string>> {
  const reach = new Map<string, Set<string>>();
  for (const id of nodeIds) {
    const outs = outgoing.get(id) ?? [];
    reach.set(id, outs.length === 0 ? new Set([id]) : new Set());
  }

  const limit = nodeIds.length;
  for (let pass = 0; pass < limit; pass++) {
    let changed = false;
    for (const edge of edges) {
      const dest = reach.get(edge.from);
      const source = reach.get(edge.to);
      if (!dest || !source) continue;
      for (const sink of source) {
        if (!dest.has(sink)) {
          dest.add(sink);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  return reach;
}

function longestDepths(nodeIds: string[], edges: LayoutEdge[]): Map<string, number> {
  const depth = new Map(nodeIds.map((id) => [id, 0]));
  const limit = nodeIds.length;
  for (let pass = 0; pass < limit; pass++) {
    let changed = false;
    for (const edge of edges) {
      if (!depth.has(edge.from) || !depth.has(edge.to)) continue;
      const next = Math.min(limit, (depth.get(edge.from) ?? 0) + 1);
      if (next > (depth.get(edge.to) ?? 0)) {
        depth.set(edge.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return depth;
}

function orderGoals(
  sinks: string[],
  members: Map<string, string[]>,
  shared: { sinks: Set<string> }[],
): string[] {
  const similarity = new Map<string, Map<string, number>>();
  for (const sink of sinks) similarity.set(sink, new Map());
  for (const node of shared) {
    const reached = [...node.sinks].sort();
    for (let i = 0; i < reached.length; i++) {
      for (let j = i + 1; j < reached.length; j++) {
        const a = reached[i]!;
        const b = reached[j]!;
        similarity.get(a)!.set(b, (similarity.get(a)!.get(b) ?? 0) + 1);
        similarity.get(b)!.set(a, (similarity.get(b)!.get(a) ?? 0) + 1);
      }
    }
  }

  const remaining = [...sinks].sort(
    (a, b) => (members.get(b)?.length ?? 0) - (members.get(a)?.length ?? 0) || a.localeCompare(b),
  );
  const order = [remaining.shift()!];
  while (remaining.length > 0) {
    const last = order[order.length - 1]!;
    let bestIndex = 0;
    let bestScore = -1;
    remaining.forEach((id, index) => {
      const score = similarity.get(last)!.get(id) ?? 0;
      const bestId = remaining[bestIndex]!;
      if (score > bestScore || (score === bestScore && id.localeCompare(bestId) < 0)) {
        bestIndex = index;
        bestScore = score;
      }
    });
    order.push(remaining.splice(bestIndex, 1)[0]!);
  }
  return order;
}

function barycenter(id: string, incoming: Map<string, string[]>, xOf: Map<string, number>): number {
  const parents = (incoming.get(id) ?? []).filter((parent) => xOf.has(parent));
  if (parents.length === 0) return 0;
  return parents.reduce((sum, parent) => sum + (xOf.get(parent) ?? 0), 0) / parents.length;
}

function spreadAround(ids: string[], center: number): Map<string, number> {
  const start = center - ((ids.length - 1) * NODE_GAP_X) / 2;
  return new Map(ids.map((id, index) => [id, start + index * NODE_GAP_X]));
}

/** Keep left-to-right order, but never place two nodes closer than one column step. */
function separateTargets(entries: { id: string; target: number }[]): Map<string, number> {
  const sorted = [...entries].sort((a, b) => a.target - b.target || a.id.localeCompare(b.id));
  const placed: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const min = i === 0 ? sorted[i]!.target : placed[i - 1]! + NODE_GAP_X;
    placed.push(Math.max(sorted[i]!.target, min));
  }
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const shift = mean(sorted.map((entry) => entry.target)) - mean(placed);
  return new Map(sorted.map((entry, index) => [entry.id, placed[index]! + shift]));
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
 * Place each goal's private chain in a column. Shared prerequisites sit
 * between the columns they feed. Columns that share nodes are neighbours.
 */
export function computeLayeredLayout(
  nodeIds: string[],
  edges: LayoutEdge[],
  origin: { x: number; y: number } = { x: 0, y: 0 },
): Map<string, { x: number; y: number }> {
  if (nodeIds.length === 0) return new Map();

  const { outgoing, incoming } = adjacency(nodeIds, edges);
  const reach = reachableSinks(nodeIds, edges, outgoing);
  const sinks = nodeIds.filter((id) => (outgoing.get(id) ?? []).length === 0);
  if (sinks.length === 0) return layoutCluster(nodeIds, edges, origin);

  const members = new Map<string, string[]>(sinks.map((sink) => [sink, []]));
  const shared: { id: string; sinks: Set<string> }[] = [];
  const unsinked: string[] = [];
  for (const id of nodeIds) {
    const sinksReached = reach.get(id) ?? new Set<string>();
    if (sinksReached.size === 1) {
      members.get([...sinksReached][0]!)!.push(id);
    } else if (sinksReached.size > 1) {
      shared.push({ id, sinks: sinksReached });
    } else {
      unsinked.push(id);
    }
  }

  const depth = longestDepths(nodeIds, edges);
  const order = orderGoals(sinks, members, shared);
  const widest = new Map(
    order.map((sink) => {
      const counts = new Map<number, number>();
      for (const id of members.get(sink) ?? []) {
        const layer = depth.get(id) ?? 0;
        counts.set(layer, (counts.get(layer) ?? 0) + 1);
      }
      return [sink, Math.max(1, ...counts.values())];
    }),
  );

  const center = new Map<string, number>();
  let cursor = origin.x;
  for (const sink of order) {
    const pitch = Math.max(NODE_GAP_X, ((widest.get(sink) ?? 1) - 1) * NODE_GAP_X);
    center.set(sink, cursor + pitch / 2);
    cursor += pitch + COLUMN_GAP;
  }

  const layers = new Map<number, string[]>();
  for (const id of nodeIds) {
    if (unsinked.includes(id)) continue;
    const layer = depth.get(id) ?? 0;
    const list = layers.get(layer) ?? [];
    list.push(id);
    layers.set(layer, list);
  }

  const xOf = new Map<string, number>();
  for (const layer of [...layers.keys()].sort((a, b) => a - b)) {
    const ids = layers.get(layer) ?? [];
    const targets = new Map<string, number>();

    const sharedHere = shared.filter((node) => ids.includes(node.id));
    const spans = new Map<string, string[]>();
    for (const node of sharedHere) {
      const key = [...node.sinks].sort().join('\0');
      const list = spans.get(key) ?? [];
      list.push(node.id);
      spans.set(key, list);
    }
    for (const [key, spanIds] of spans) {
      const spanSinks = key.split('\0');
      const spanCenter =
        spanSinks.reduce((sum, sink) => sum + (center.get(sink) ?? origin.x), 0) / spanSinks.length;
      const ordered = [...spanIds].sort(
        (a, b) => barycenter(a, incoming, xOf) - barycenter(b, incoming, xOf) || a.localeCompare(b),
      );
      for (const [id, x] of spreadAround(ordered, spanCenter)) targets.set(id, x);
    }

    for (const sink of order) {
      const columnIds = (members.get(sink) ?? []).filter((id) => ids.includes(id));
      const ordered = [...columnIds].sort(
        (a, b) => barycenter(a, incoming, xOf) - barycenter(b, incoming, xOf) || a.localeCompare(b),
      );
      for (const [id, x] of spreadAround(ordered, center.get(sink) ?? origin.x)) targets.set(id, x);
    }

    for (const [id, x] of separateTargets(
      ids.map((id) => ({ id, target: targets.get(id) ?? 0 })),
    )) {
      xOf.set(id, x);
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const [id, x] of xOf) {
    positions.set(id, { x, y: origin.y + (depth.get(id) ?? 0) * LAYER_GAP_Y });
  }

  if (unsinked.length > 0) {
    const extra = layoutCluster(unsinked, edges, { x: cursor, y: origin.y });
    for (const [id, pos] of extra) positions.set(id, pos);
  }

  return positions;
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
