import { describe, expect, it } from 'vitest';
import { preserveDraggingPositions } from './rfHelpers';

describe('preserveDraggingPositions', () => {
  it('keeps the live position of a node that is still being dragged', () => {
    const previous = [
      { id: 'a', position: { x: 40, y: 10 }, dragging: true },
      { id: 'b', position: { x: 0, y: 0 }, dragging: false },
    ];
    const next = [
      { id: 'a', position: { x: 0, y: 0 }, dragging: false },
      { id: 'b', position: { x: 5, y: 5 }, dragging: false },
    ];

    expect(preserveDraggingPositions(previous, next)).toEqual([
      { id: 'a', position: { x: 40, y: 10 }, dragging: true },
      { id: 'b', position: { x: 5, y: 5 }, dragging: false },
    ]);
  });

  it('returns the next list unchanged when nothing is dragging', () => {
    const next = [{ id: 'a', position: { x: 1, y: 2 } }];
    expect(preserveDraggingPositions([], next)).toBe(next);
  });
});
