import { useState } from 'react';
import { getItemImageUrl } from '../engine/item-db';

export function ItemIcon({ itemId, size = 36 }: { itemId: string; size?: number }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        style={{ width: size, height: size }}
        className="inline-flex items-center justify-center rounded bg-surface-700 text-stone-500 shrink-0"
        title={itemId}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={getItemImageUrl(itemId)}
      alt=""
      width={size}
      height={size}
      className="inline-block object-contain rounded shrink-0 osrs-pixel-icon"
      onError={() => setErrored(true)}
    />
  );
}
