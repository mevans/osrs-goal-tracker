import { describe, expect, it } from 'vitest';
import { applyLayout, computeLayeredLayout } from './layout';

function pos(layout: Map<string, { x: number; y: number }>, id: string) {
  const position = layout.get(id);
  expect(position).toBeDefined();
  return position!;
}

describe('computeLayeredLayout', () => {
  it('places prerequisites above the nodes that require them', () => {
    const layout = computeLayeredLayout(
      ['prep', 'mid', 'goal'],
      [
        { from: 'prep', to: 'mid' },
        { from: 'mid', to: 'goal' },
      ],
    );

    expect(pos(layout, 'prep').y).toBeLessThan(pos(layout, 'mid').y);
    expect(pos(layout, 'mid').y).toBeLessThan(pos(layout, 'goal').y);
  });

  it('separates independent goals horizontally', () => {
    const layout = computeLayeredLayout(
      ['prep-a', 'goal-a', 'prep-b', 'goal-b'],
      [
        { from: 'prep-a', to: 'goal-a' },
        { from: 'prep-b', to: 'goal-b' },
      ],
    );

    const left = Math.max(pos(layout, 'prep-a').x, pos(layout, 'goal-a').x);
    const right = Math.min(pos(layout, 'prep-b').x, pos(layout, 'goal-b').x);
    expect(right).toBeGreaterThan(left);
  });

  it('assigns every node a position when the graph contains a cycle', () => {
    const layout = computeLayeredLayout(
      ['a', 'b'],
      [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
    );

    expect(layout.size).toBe(2);
    expect(Number.isFinite(pos(layout, 'a').x)).toBe(true);
    expect(Number.isFinite(pos(layout, 'b').y)).toBe(true);
  });

  it('returns no positions for an empty graph', () => {
    expect(computeLayeredLayout([], []).size).toBe(0);
  });

  it('places a shared prerequisite between the goals that need it', () => {
    const layout = computeLayeredLayout(
      ['skill', 'goal-a', 'goal-b'],
      [
        { from: 'skill', to: 'goal-a' },
        { from: 'skill', to: 'goal-b' },
      ],
    );

    const skill = pos(layout, 'skill');
    const goalA = pos(layout, 'goal-a');
    const goalB = pos(layout, 'goal-b');
    const [left, right] = goalA.x < goalB.x ? [goalA, goalB] : [goalB, goalA];

    expect(skill.y).toBeLessThan(goalA.y);
    expect(skill.y).toBeLessThan(goalB.y);
    expect(skill.x).toBeGreaterThan(left.x);
    expect(skill.x).toBeLessThan(right.x);
  });

  it('keeps a goal’s private chain in that goal’s column', () => {
    const layout = computeLayeredLayout(
      ['only-a', 'only-b', 'shared', 'goal-a', 'goal-b'],
      [
        { from: 'only-a', to: 'goal-a' },
        { from: 'only-b', to: 'goal-b' },
        { from: 'shared', to: 'goal-a' },
        { from: 'shared', to: 'goal-b' },
      ],
    );

    const goalA = pos(layout, 'goal-a');
    const goalB = pos(layout, 'goal-b');
    expect(Math.abs(pos(layout, 'only-a').x - goalA.x)).toBeLessThan(
      Math.abs(pos(layout, 'only-a').x - goalB.x),
    );
    expect(Math.abs(pos(layout, 'only-b').x - goalB.x)).toBeLessThan(
      Math.abs(pos(layout, 'only-b').x - goalA.x),
    );
  });

  it('puts goals that share prerequisites next to each other', () => {
    const layout = computeLayeredLayout(
      ['shared', 'goal-a', 'goal-b', 'goal-c'],
      [
        { from: 'shared', to: 'goal-a' },
        { from: 'shared', to: 'goal-c' },
      ],
    );

    const a = pos(layout, 'goal-a').x;
    const b = pos(layout, 'goal-b').x;
    const c = pos(layout, 'goal-c').x;
    const between = b > Math.min(a, c) && b < Math.max(a, c);
    expect(between).toBe(false);
  });

  it('orders a layer so edges to the same goal do not cross', () => {
    const layout = computeLayeredLayout(
      ['p1', 'p2', 'c1', 'c2', 'goal'],
      [
        { from: 'p1', to: 'c2' },
        { from: 'p2', to: 'c1' },
        { from: 'c1', to: 'goal' },
        { from: 'c2', to: 'goal' },
      ],
    );

    const parentsLeftToRight = pos(layout, 'p1').x < pos(layout, 'p2').x;
    if (parentsLeftToRight) {
      expect(pos(layout, 'c2').x).toBeLessThan(pos(layout, 'c1').x);
    } else {
      expect(pos(layout, 'c1').x).toBeLessThan(pos(layout, 'c2').x);
    }
  });
});

describe('applyLayout', () => {
  it('keeps node identity and only replaces positions that were laid out', () => {
    const laidOut = applyLayout(
      [
        { id: 'a', position: { x: 9, y: 9 }, title: 'A' },
        { id: 'b', position: { x: 8, y: 8 }, title: 'B' },
      ],
      [{ from: 'a', to: 'b' }],
    );

    expect(laidOut.map((n) => n.title)).toEqual(['A', 'B']);
    expect(laidOut[0]!.position.y).toBeLessThan(laidOut[1]!.position.y);
  });
});
