/**
 * Generates src/engine/item-data.json from the OSRS Wiki Bucket API.
 *
 * Filters to canonical in-game items only — excludes wiki variant rows
 * (empty/broken/locked/poison/beta), removed content, and junk entries.
 *
 *   npm run fetch:items
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const API_URL = 'https://oldschool.runescape.wiki/api.php';
const USER_AGENT = 'Planscape/1.0 (OSRS goal tracker; https://planscape.studio)';
const PAGE_SIZE = 5000;

/** Activity/minigame copies that reuse the real item's display name. */
const ACTIVITY_VARIANT_MARKERS = [
  'Last Man Standing',
  'Barbarian Assault',
  "My Arm's Big Adventure",
  'Mage Training Arena',
  'Soul Wars',
  'Theatre of Blood',
  'Player-owned house',
  'The Slug Menace',
  'The Heart of Darkness',
  'Deadman Mode',
  'discontinued',
  'rotten',
  'flatpack',
  '_icon',
] as const;

interface BucketRow {
  item_id?: string[];
  item_name?: string;
  image?: string[];
  page_name_sub?: string;
  default_version?: string;
  version_anchor?: string | string[];
  removal_date?: string | string[];
}

export function getImageBaseName(file: string | undefined): string {
  if (!file) return '';
  return file
    .replace(/^File:/i, '')
    .replace(/\.png$/i, '')
    .trim();
}

function parseWikiImage(file: string): string {
  const name = getImageBaseName(file);
  return name.replace(/ /g, '_').replace(/'/g, '%27');
}

export { parseWikiImage };

function isRemoved(row: BucketRow): boolean {
  const removed = row.removal_date;
  if (removed == null) return false;
  if (Array.isArray(removed)) return removed.length > 0 && removed[0] !== '';
  return removed !== '';
}

/** Wiki UI-only rows, not real items. */
function isInterfaceRow(id: string): boolean {
  return id.startsWith('interface');
}

/** Minigame/activity copies: metadata mentions a variant the display name omits. */
export function isActivityVariant(row: BucketRow): boolean {
  const name = row.item_name;
  if (!name) return false;

  const imageBase = getImageBaseName(row.image?.[0]);
  const sub = row.page_name_sub ?? '';

  for (const marker of ACTIVITY_VARIANT_MARKERS) {
    if ((imageBase.includes(marker) || sub.includes(marker)) && !name.includes(marker)) {
      return true;
    }
  }

  // e.g. "Noxious halberd (Last Man Standing).png" when name is "Noxious halberd"
  if (imageBase.startsWith(name) && imageBase.length > name.length) {
    const suffix = imageBase.slice(name.length).trim();
    if (suffix.startsWith('(')) return true;
  }

  return false;
}

/** Keep only the canonical wiki row for each item — not empty/beta/broken variants. */
export function isCanonicalItem(row: BucketRow): boolean {
  const id = row.item_id?.[0];
  const name = row.item_name;
  if (!id || !name) return false;

  // Wiki marks the primary row with a default_version field (value is often empty).
  if (!Object.hasOwn(row, 'default_version')) return false;

  // League/beta ids, UI rows, and removed content.
  if (id.startsWith('beta')) return false;
  if (isInterfaceRow(id)) return false;
  if (isRemoved(row)) return false;
  if (isActivityVariant(row)) return false;

  // Wiki markup / internal junk.
  if (/[<[\]|]|Category:|\[\[|^\s*null\s/i.test(name)) return false;
  if (/placeholder|dummy portal|combat dummy/i.test(name)) return false;

  // In-game state variants that aren't useful as acquire goals.
  if (/\(empty\)|\(broken\)|\(l\)|\(beta/i.test(name)) return false;

  return true;
}

interface ItemEntry {
  id: string;
  name: string;
  wikiName: string;
  imageBase: string;
}

/** When the wiki reuses a display name, prefer the row whose image matches exactly. */
export function shouldPreferItemCandidate(existing: ItemEntry, candidate: ItemEntry): boolean {
  const existingExact = existing.imageBase === existing.name;
  const candidateExact = candidate.imageBase === candidate.name;
  if (candidateExact && !existingExact) return true;
  if (existingExact && !candidateExact) return false;
  return Number(candidate.id) < Number(existing.id);
}

async function fetchPage(offset: number): Promise<BucketRow[]> {
  const query = `bucket('infobox_item').select('item_id','item_name','image','page_name_sub','default_version','removal_date').offset(${offset}).limit(${PAGE_SIZE}).run()`;
  const url = new URL(API_URL);
  url.searchParams.set('action', 'bucket');
  url.searchParams.set('query', query);
  url.searchParams.set('format', 'json');

  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Wiki API failed (${response.status}) at offset ${offset}`);
  }

  const data = (await response.json()) as { bucket?: BucketRow[]; error?: string };
  if (data.error) {
    throw new Error(`Wiki API error at offset ${offset}: ${data.error}`);
  }

  return data.bucket ?? [];
}

async function main() {
  const byId = new Map<string, ItemEntry>();
  const byName = new Map<string, ItemEntry>();
  let offset = 0;
  let skipped = 0;

  while (true) {
    const rows = await fetchPage(offset);
    if (rows.length === 0) break;

    for (const row of rows) {
      if (!isCanonicalItem(row)) {
        skipped += 1;
        continue;
      }

      const id = row.item_id![0]!;
      const name = row.item_name!;
      const image = row.image?.[0];
      if (!image) continue;

      const candidate: ItemEntry = {
        id,
        name,
        wikiName: parseWikiImage(image),
        imageBase: getImageBaseName(image),
      };

      const existingByName = byName.get(name);
      if (existingByName) {
        if (shouldPreferItemCandidate(existingByName, candidate)) {
          byId.delete(existingByName.id);
          byId.set(id, candidate);
          byName.set(name, candidate);
        }
        continue;
      }

      if (byId.has(id)) continue;

      byId.set(id, candidate);
      byName.set(name, candidate);
    }

    console.log(`Fetched offset ${offset}: ${byId.size} kept, ${skipped} skipped`);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const items = [...byId.values()]
    .map(({ id, name, wikiName }) => ({ id, name, wikiName }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const outPath = join(ROOT, 'src/engine/item-data.json');
  writeFileSync(outPath, JSON.stringify(items, null, 0));

  console.log(`Wrote ${items.length} items to ${outPath} (skipped ${skipped} variant/junk rows)`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
