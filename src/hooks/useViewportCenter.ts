import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

/** Returns a function that computes the current viewport center in flow coordinates. */
export function useViewportCenter(): () => { x: number; y: number } {
  const { getViewport } = useReactFlow();

  return useCallback(() => {
    const { x, y, zoom } = getViewport();
    return {
      x: (-x + window.innerWidth / 2) / zoom,
      y: (-y + window.innerHeight / 2) / zoom,
    };
  }, [getViewport]);
}
