import type { GraphNode, GraphEdge } from '../engine/types';
import { generateId } from '../engine/types';
import { applyLayout } from '../engine/layout';
import type { TemplateDefinition, TemplateNode, SoftDecision, ExpansionResult } from './types';

/**
 * Apply a template with user decisions on soft nodes.
 * Hard nodes are always included. Soft nodes follow the decisions map.
 * Idempotent: nodes matched by title are reused, skill levels merged by max.
 * New nodes are auto-laid out in topological layers.
 */
export function expandTemplate(
  template: TemplateDefinition,
  decisions: Map<string, SoftDecision>,
  existingNodes: GraphNode[],
  existingEdges: GraphEdge[],
): ExpansionResult {
  const nodesToAdd: GraphNode[] = [];
  const edgesToAdd: GraphEdge[] = [];
  const nodesToUpdate: { id: string; updates: Partial<GraphNode> }[] = [];

  const existingByTitle = new Map(existingNodes.map((n) => [n.title.toLowerCase(), n]));

  // Resolve which template nodes are included
  const includedKeys = new Set<string>();
  const keyToId = new Map<string, string>();

  for (const tNode of template.nodes) {
    if (tNode.requirement === 'hard') {
      includedKeys.add(tNode.key);
    } else {
      const decision = decisions.get(tNode.key);
      if (!decision || decision.action === 'discard') continue;
      includedKeys.add(tNode.key);
    }
  }

  // Build final node data (apply edits from decisions)
  for (const tNode of template.nodes) {
    if (!includedKeys.has(tNode.key)) continue;

    let finalNode: TemplateNode = tNode;
    const decision = decisions.get(tNode.key);
    if (decision && decision.action === 'edit') {
      finalNode = { ...tNode, ...decision.edits };
    }

    // Check if node already exists in the graph (by title)
    const existing = existingByTitle.get(finalNode.title.toLowerCase());
    if (existing) {
      keyToId.set(tNode.key, existing.id);

      // Merge skill levels upward
      if (finalNode.skillData && existing.skillData) {
        if (finalNode.skillData.targetLevel > existing.skillData.targetLevel) {
          nodesToUpdate.push({
            id: existing.id,
            updates: { skillData: finalNode.skillData },
          });
        }
      }
    } else {
      const id = generateId();
      keyToId.set(tNode.key, id);

      nodesToAdd.push({
        id,
        type: finalNode.type,
        title: finalNode.title,
        position: { x: 0, y: 0 }, // placeholder — layout applied below
        complete: false,
        notes: finalNode.notes,
        skillData: finalNode.skillData,
        questData: finalNode.questData,
        quantity: undefined,
        tags: [],
      });
    }
  }

  // Build edges (only if both endpoints are included)
  const existingEdgeSet = new Set(existingEdges.map((e) => `${e.from}->${e.to}`));

  for (const tEdge of template.edges) {
    if (!includedKeys.has(tEdge.fromKey) || !includedKeys.has(tEdge.toKey)) continue;

    const fromId = keyToId.get(tEdge.fromKey);
    const toId = keyToId.get(tEdge.toKey);
    if (!fromId || !toId) continue;

    const edgeKey = `${fromId}->${toId}`;
    if (existingEdgeSet.has(edgeKey)) continue;

    edgesToAdd.push({
      id: generateId(),
      from: fromId,
      to: toId,
      type: tEdge.type,
    });
  }

  // Apply topological layout to new nodes using all edges (new + existing involving these nodes)
  const allRelevantEdges = [
    ...edgesToAdd.map((e) => ({ from: e.from, to: e.to })),
    ...existingEdges
      .filter((e) => {
        const newIds = new Set(nodesToAdd.map((n) => n.id));
        return newIds.has(e.from) || newIds.has(e.to);
      })
      .map((e) => ({ from: e.from, to: e.to })),
  ];

  const laidOut = applyLayout(nodesToAdd, allRelevantEdges);

  return { nodesToAdd: laidOut, edgesToAdd, nodesToUpdate };
}
