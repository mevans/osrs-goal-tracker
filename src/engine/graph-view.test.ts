import { describe, expect, it } from 'vitest';
import { deriveGraphView } from './graph-view';
import type { GraphEdge, GraphNode } from './types';

function node(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    type: 'task',
    title: id,
    position: { x: 0, y: 0 },
    complete: false,
    notes: undefined,
    skillData: undefined,
    questData: undefined,
    bossData: undefined,
    itemData: undefined,
    diaryData: undefined,
    quantity: undefined,
    groupData: undefined,
    tags: [],
    ...overrides,
  };
}

function view(
  nodes: GraphNode[],
  edges: GraphEdge[],
  overrides: Partial<Parameters<typeof deriveGraphView>[0]> = {},
) {
  return deriveGraphView({
    nodes,
    edges,
    selectedNodeIds: [],
    selectedEdgeIds: [],
    hideCompleted: false,
    ...overrides,
  });
}

describe('deriveGraphView', () => {
  const nodes = [node('a'), node('b'), node('c'), node('gear')];
  const edges: GraphEdge[] = [
    { id: 'ab', from: 'a', to: 'b', type: 'requires' },
    { id: 'bc', from: 'b', to: 'c', type: 'requires' },
    { id: 'gear', from: 'gear', to: 'c', type: 'improves' },
  ];

  it('leaves every node at full strength when nothing is selected', () => {
    const result = view(nodes, edges);
    expect(result.highlightedNodeIds).toBeNull();
    expect(result.highlightedEdgeIds).toBeNull();
    expect(result.visibleNodes.map((n) => n.id).sort()).toEqual(['a', 'b', 'c', 'gear']);
  });

  it('highlights the requires chain and skips improves edges', () => {
    const result = view(nodes, edges, { selectedNodeIds: ['c'] });
    expect([...(result.highlightedNodeIds ?? [])].sort()).toEqual(['a', 'b', 'c']);
    expect(result.highlightedEdgeIds?.has('ab')).toBe(true);
    expect(result.highlightedEdgeIds?.has('bc')).toBe(true);
    expect(result.highlightedEdgeIds?.has('gear')).toBe(false);
  });

  it('hides completed nodes and a group whose members are all complete', () => {
    const grouped = [
      node('a', { complete: true }),
      node('b', { complete: true }),
      node('c'),
      node('g', { type: 'group', groupData: { memberIds: ['a', 'b'] } }),
    ];
    const result = view(grouped, [], { hideCompleted: true });
    expect(result.visibleNodes.map((n) => n.id)).toEqual(['c']);
  });

  it('marks a folded group available when one member is available', () => {
    const grouped = [
      node('a', { complete: true }),
      node('b'),
      node('g', { type: 'group', complete: false, groupData: { memberIds: ['a', 'b'] } }),
    ];
    const result = view(grouped, [{ id: 'e', from: 'missing', to: 'a', type: 'requires' }]);
    expect(result.statuses.get('g')).toBe('available');
  });
});
