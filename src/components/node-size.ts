import { useLayoutEffect, useRef, useState } from 'react';

/** Node boxes are always a multiple of this many pixels. */
export const NODE_UNIT = 8;

export const NODE_WIDTH = {
  standard: 184,
  diary: 264,
  group: 240,
} as const;

/** Smallest multiple of `unit` that is at least `px`. */
export function snapUp(px: number, unit = NODE_UNIT): number {
  if (px <= 0) return 0;
  return Math.ceil(px / unit) * unit;
}

/**
 * Measures the content box and returns a frame height on the node grid.
 * The frame's own vertical border is included. Padding belongs on the content.
 */
export function useSnappedFrame(unit = NODE_UNIT) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    const measure = () => {
      const style = getComputedStyle(frame);
      const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      // offsetHeight ignores the canvas zoom. getBoundingClientRect does not,
      // and using it here shrinks the node to its on-screen size.
      const next = snapUp(content.offsetHeight + border, unit);
      setHeight((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [unit]);

  return { frameRef, contentRef, height };
}
