import type { SkillName } from '../engine/types';

const WIKI_BASE = 'https://oldschool.runescape.wiki/images';

export function SkillIcon({ skill, size = 16 }: { skill: SkillName; size?: number }) {
  return (
    <img
      src={`${WIKI_BASE}/${skill}_icon.png`}
      alt={skill}
      width={size}
      height={size}
      className="inline-block"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
