import { describe, expect, it } from 'vitest';
import { adjustQuantity, quantityStep } from './quantity';

describe('quantity controls', () => {
  it('steps by 1, 10, or 100', () => {
    expect(quantityStep({ shiftKey: false, ctrlKey: false, metaKey: false })).toBe(1);
    expect(quantityStep({ shiftKey: true, ctrlKey: false, metaKey: false })).toBe(10);
    expect(quantityStep({ shiftKey: true, ctrlKey: true, metaKey: false })).toBe(100);
    expect(quantityStep({ shiftKey: true, ctrlKey: false, metaKey: true })).toBe(100);
  });

  it('clamps to zero and to the target when one is set', () => {
    expect(adjustQuantity(3, 10, -10)).toBe(0);
    expect(adjustQuantity(8, 10, 5)).toBe(10);
    expect(adjustQuantity(8, 0, 5)).toBe(13);
  });
});
