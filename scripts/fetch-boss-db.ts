/**
 * Generates src/engine/boss-data.json from Wise Old Man hiscores bosses.
 *
 * Names come from @wise-old-man/utils (MetricProps). Missing names title-case the metric key.
 *
 *   npm run fetch:bosses
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const WOM_URL = 'https://api.wiseoldman.net/v2';
const WOM_UTILS_JS = 'https://cdn.jsdelivr.net/npm/@wise-old-man/utils/dist/es/index.mjs';
const USER_AGENT = 'Planscape/1.0 (OSRS goal tracker; https://planscape.studio)';
const WOM_SAMPLE_PLAYER = 'Lynx Titan';

export interface BossRecord {
  id: string;
  name: string;
  womKey: string;
}

const SMALL_WORDS = new Set(['of', 'the']);

export function titleCaseWomKey(key: string): string {
  return key
    .split('_')
    .map((word, i) => {
      if (i > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Pull metric key → display name from the published WOM utils bundle. */
export function parseWomBossNames(source: string): Record<string, string> {
  const bossStart = source.indexOf('const Boss = {');
  const bossEnd = source.indexOf('};', bossStart);
  if (bossStart < 0 || bossEnd < 0) {
    throw new Error('Could not find Boss enum in WOM utils');
  }
  const keys = [...source.slice(bossStart, bossEnd).matchAll(/:\s*'([a-z0-9_]+)'/g)].map(
    (m) => m[1]!,
  );

  const propsStart = source.indexOf('const BossProps = mapValues({');
  const propsEnd = source.indexOf('const ActivityProps');
  if (propsStart < 0 || propsEnd < 0) {
    throw new Error('Could not find BossProps in WOM utils');
  }
  const names = [...source.slice(propsStart, propsEnd).matchAll(/name:\s*(['"])(.*?)\1/g)].map(
    (m) => m[2]!,
  );

  if (keys.length === 0 || keys.length !== names.length) {
    throw new Error(`WOM name parse mismatch (${keys.length} keys, ${names.length} names)`);
  }
  return Object.fromEntries(keys.map((key, i) => [key, names[i]!]));
}

export function buildBossList(womKeys: string[], names: Record<string, string> = {}): BossRecord[] {
  return womKeys
    .map((womKey) => {
      const name = names[womKey] ?? titleCaseWomKey(womKey);
      return { id: name, name, womKey };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchWomBossKeys(): Promise<string[]> {
  const res = await fetch(`${WOM_URL}/players/${encodeURIComponent(WOM_SAMPLE_PLAYER)}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`WOM lookup failed (${res.status})`);
  }
  const data = (await res.json()) as {
    latestSnapshot: { data: { bosses: Record<string, unknown> } } | null;
  };
  if (!data.latestSnapshot) {
    throw new Error('WOM sample player has no snapshot');
  }
  return Object.keys(data.latestSnapshot.data.bosses).sort((a, b) => a.localeCompare(b));
}

async function fetchWomDisplayNames(): Promise<Record<string, string>> {
  const res = await fetch(WOM_UTILS_JS, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    throw new Error(`WOM utils fetch failed (${res.status})`);
  }
  return parseWomBossNames(await res.text());
}

async function main(): Promise<void> {
  const [keys, names] = await Promise.all([fetchWomBossKeys(), fetchWomDisplayNames()]);
  const bosses = buildBossList(keys, names);
  const outPath = join(ROOT, 'src/engine/boss-data.json');
  writeFileSync(outPath, `${JSON.stringify(bosses, null, 2)}\n`);
  console.log(`Wrote ${bosses.length} bosses to ${outPath}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
