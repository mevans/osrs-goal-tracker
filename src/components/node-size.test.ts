import { describe, expect, it } from 'vitest';
import { NODE_UNIT, NODE_WIDTH, snapUp } from './node-size';

describe('node size grid', () => {
  it('rounds up to the next multiple and leaves exact multiples alone', () => {
    expect(snapUp(1)).toBe(8);
    expect(snapUp(8)).toBe(8);
    expect(snapUp(9)).toBe(16);
    expect(snapUp(52.2)).toBe(56);
    expect(snapUp(0)).toBe(0);
  });

  it('uses widths that sit on the grid', () => {
    for (const width of Object.values(NODE_WIDTH)) {
      expect(width % NODE_UNIT).toBe(0);
    }
  });
});
