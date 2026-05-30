import { describe, expect, it } from 'vitest';
import type { GraphEdge, GraphNode } from './types';
import {
  applyFoldView,
  applyGroupMemberTranslation,
  applyLayoutWithFolds,
  collectUnfoldSelection,
  expandCompletionTargetIds,
  expandCopyTargetIds,
  isGroupComplete,
  resolveStoredEdgeId,
  syncGroupCompletionStates,
} from './fold-view';

function node(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    type: 'goal',
    title: id,
    position: { x: 0, y: 0 },
    complete: false,
    notes: undefined,
    skillData: undefined,
    questData: undefined,
    bossData: undefined,
    quantity: undefined,
    groupData: undefined,
    tags: [],
    ...overrides,
  };
}

describe('applyFoldView', () => {
  it('hides members and proxies external edges to the group', () => {
    const nodes: GraphNode[] = [
      node('a'),
      node('b'),
      node('g', {
        type: 'group',
        title: 'Group',
        groupData: { memberIds: ['a', 'b'] },
        position: { x: 100, y: 100 },
      }),
      node('c', { position: { x: 200, y: 0 } }),
    ];
    const edges: GraphEdge[] = [
      { id: 'e1', from: 'c', to: 'a', type: 'requires' },
      { id: 'e2', from: 'a', to: 'b', type: 'requires' },
    ];

    const view = applyFoldView(nodes, edges);

    expect(view.visibleNodes.map((n) => n.id).sort()).toEqual(['c', 'g']);
    expect(view.visibleEdges).toHaveLength(1);
    expect(view.visibleEdges[0]).toMatchObject({
      id: 'fold-e1',
      from: 'c',
      to: 'g',
    });
  });
});

describe('resolveStoredEdgeId', () => {
  it('strips fold proxy prefix', () => {
    expect(resolveStoredEdgeId('fold-abc')).toBe('abc');
    expect(resolveStoredEdgeId('abc')).toBe('abc');
  });
});

describe('group helpers', () => {
  const nodes: GraphNode[] = [
    node('a', { complete: true }),
    node('b', { complete: false }),
    node('g', {
      type: 'group',
      title: 'Group',
      complete: false,
      groupData: { memberIds: ['a', 'b'] },
    }),
  ];

  it('detects when all members are complete', () => {
    expect(isGroupComplete(nodes[2]!, [nodes[0]!, nodes[1]!, nodes[2]!])).toBe(false);
    expect(
      isGroupComplete(nodes[2]!, [
        node('a', { complete: true }),
        node('b', { complete: true }),
        nodes[2]!,
      ]),
    ).toBe(true);
  });

  it('syncs group.complete from members', () => {
    const synced = syncGroupCompletionStates([
      node('a', { complete: true }),
      node('b', { complete: true }),
      node('g', {
        type: 'group',
        title: 'Group',
        complete: false,
        groupData: { memberIds: ['a', 'b'] },
      }),
    ]);
    expect(synced.find((n) => n.id === 'g')?.complete).toBe(true);
  });

  it('expands group ids for completion and copy', () => {
    expect(expandCompletionTargetIds(['g'], nodes)).toEqual(['a', 'b']);
    expect(expandCopyTargetIds(['g'], nodes)).toEqual(['a', 'b']);
  });

  it('collects member selection after removing a group', () => {
    const removed = new Set(['g']);
    expect(collectUnfoldSelection(removed, nodes)).toEqual(['a', 'b']);
  });
});

describe('applyGroupMemberTranslation', () => {
  it('translates members when a group moves', () => {
    const nodes: GraphNode[] = [
      node('a', { position: { x: 0, y: 0 } }),
      node('b', { position: { x: 10, y: 0 } }),
      node('g', {
        type: 'group',
        title: 'Group',
        position: { x: 5, y: 0 },
        groupData: { memberIds: ['a', 'b'] },
      }),
    ];

    const moved = applyGroupMemberTranslation(nodes, 'g', { x: 100, y: 50 });

    expect(moved.find((n) => n.id === 'a')?.position).toEqual({ x: 100, y: 50 });
    expect(moved.find((n) => n.id === 'b')?.position).toEqual({ x: 110, y: 50 });
  });
});

describe('applyLayoutWithFolds', () => {
  it('layouts visible nodes and keeps members aligned with their group', () => {
    const nodes: GraphNode[] = [
      node('a', { position: { x: 0, y: 0 } }),
      node('b', { position: { x: 40, y: 0 } }),
      node('g', {
        type: 'group',
        title: 'Group',
        position: { x: 20, y: 0 },
        groupData: { memberIds: ['a', 'b'] },
      }),
      node('c', { position: { x: 0, y: 100 } }),
    ];
    const edges: GraphEdge[] = [{ id: 'e1', from: 'a', to: 'c', type: 'requires' }];

    const laidOut = applyLayoutWithFolds(nodes, edges, { x: 0, y: 0 });
    const group = laidOut.find((n) => n.id === 'g');
    const memberA = laidOut.find((n) => n.id === 'a');

    expect(group?.position.x).not.toBe(20);
    expect(memberA?.position.x).not.toBe(0);
    expect(memberA!.position.x - group!.position.x).toBe(-20);
  });
});
