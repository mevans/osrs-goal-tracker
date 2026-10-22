export function quantityStep(input: {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}): number {
  if (input.shiftKey && (input.ctrlKey || input.metaKey)) return 100;
  if (input.shiftKey) return 10;
  return 1;
}

/** Move a counter by `delta`, staying at 0 and, when `target` is set, at the target. */
export function adjustQuantity(current: number, target: number, delta: number): number {
  const next = Math.max(0, current + delta);
  return target > 0 ? Math.min(target, next) : next;
}
