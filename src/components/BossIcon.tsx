import { useState } from 'react';
import { getBossWikiName } from '../engine/boss-db';

const WIKI_THUMB = 'https://oldschool.runescape.wiki/images/thumb';

export function BossIcon({ bossId, size = 36 }: { bossId: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const wikiName = getBossWikiName(bossId);

  if (errored) {
    return (
      <div
        style={{ width: size, height: size }}
        className="inline-flex items-center justify-center rounded bg-surface-700 text-stone-500 shrink-0"
        title={bossId}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7zm-2 18h4v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={`${WIKI_THUMB}/${wikiName}.png/${size}px-${wikiName}.png`}
      alt={bossId}
      width={size}
      height={size}
      className="inline-block object-contain rounded shrink-0"
      onError={() => setErrored(true)}
    />
  );
}
