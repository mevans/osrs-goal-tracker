import { describe, expect, it } from 'vitest';
import {
  computeAllStatuses,
  computeBottlenecks,
  getAllDependents,
  getAllPrerequisites,
  getAvailableNodes,
  getBlockedNodes,
} from './graph-engine';
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

function requires(from: string, to: string): GraphEdge {
  return { id: `${from}->${to}`, from, to, type: 'requires' };
}

function improves(from: string, to: string): GraphEdge {
  return { id: `${from}~>${to}`, from, to, type: 'improves' };
}

describe('derived status', () => {
  const nodes = [node('prereq'), node('goal'), node('done', { complete: true }), node('upgrade')];

  it('blocks a node only while a direct requires prerequisite is incomplete', () => {
    const edges = [requires('prereq', 'goal'), improves('upgrade', 'goal')];

    const statuses = computeAllStatuses(nodes, edges);

    expect(statuses.get('goal')).toBe('blocked');
    expect(statuses.get('prereq')).toBe('available');
    expect(statuses.get('upgrade')).toBe('available');
    expect(statuses.get('done')).toBe('complete');
    expect(getBlockedNodes(nodes, edges).map((n) => n.id)).toEqual(['goal']);
    expect(
      getAvailableNodes(nodes, edges)
        .map((n) => n.id)
        .sort(),
    ).toEqual(['prereq', 'upgrade']);
  });

  it('treats a manually completed node as complete even when its prerequisite is not', () => {
    const edges = [requires('prereq', 'done')];
    expect(computeAllStatuses(nodes, edges).get('done')).toBe('complete');
  });

  it('opens a node once its direct prerequisites are complete', () => {
    const edges = [requires('done', 'goal'), requires('prereq', 'done')];
    expect(computeAllStatuses(nodes, edges).get('goal')).toBe('available');
  });
});

describe('dependency chains', () => {
  const edges = [requires('a', 'b'), requires('b', 'c'), improves('gear', 'c')];

  it('walks requires edges in both directions and ignores improves edges', () => {
    expect(getAllPrerequisites('c', edges)).toEqual(new Set(['a', 'b']));
    expect(getAllDependents('a', edges)).toEqual(new Set(['b', 'c']));
    expect(getAllPrerequisites('a', edges).size).toBe(0);
    expect(getAllDependents('gear', edges).size).toBe(0);
  });

  it('stops on a cycle', () => {
    const cycle = [requires('a', 'b'), requires('b', 'a')];
    expect(getAllPrerequisites('a', cycle)).toEqual(new Set(['b']));
    expect(getAllDependents('a', cycle)).toEqual(new Set(['b']));
  });
});

describe('bottlenecks', () => {
  const nodes = [node('root'), node('left'), node('right'), node('end'), node('gear')];
  const edges = [
    requires('root', 'left'),
    requires('root', 'right'),
    requires('left', 'end'),
    improves('gear', 'end'),
  ];

  it('ranks a node above another when it blocks more incomplete work', () => {
    const ranked = computeBottlenecks(nodes, edges);
    const root = ranked.find((entry) => entry.nodeId === 'root');
    const left = ranked.find((entry) => entry.nodeId === 'left');

    expect(root).toBeDefined();
    expect(left).toBeDefined();
    expect(root!.blockedCount).toBeGreaterThan(left!.blockedCount);
    expect(ranked.map((entry) => entry.nodeId)).not.toContain('gear');
    expect(ranked[0]?.nodeId).toBe('root');
  });

  it('respects the requested list length', () => {
    expect(computeBottlenecks(nodes, edges, 1)).toHaveLength(1);
  });

  it('does not treat a finished node as a bottleneck', () => {
    const finished = nodes.map((n) => (n.id === 'root' ? { ...n, complete: true } : n));
    const ranked = computeBottlenecks(finished, edges);
    expect(ranked.map((entry) => entry.nodeId)).not.toContain('root');
  });
});
