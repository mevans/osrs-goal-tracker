import itemDataJson from './item-data.json';

export interface ItemInfo {
  id: string;
  name: string;
  wikiName: string;
}

export const ITEM_DATABASE = itemDataJson as ItemInfo[];

export const ITEM_BY_ID = new Map(ITEM_DATABASE.map((item) => [item.id, item]));

export const ALL_ITEMS = ITEM_DATABASE;

export function getItemName(itemId: string): string {
  return ITEM_BY_ID.get(itemId)?.name ?? itemId;
}

export function getItemWikiName(itemId: string): string {
  return ITEM_BY_ID.get(itemId)?.wikiName ?? itemId.replace(/ /g, '_');
}

const WIKI_IMAGES = 'https://oldschool.runescape.wiki/images';

/** Direct wiki image URL — more reliable than /thumb/ for apostrophes and stack icons. */
export function getItemImageUrl(itemId: string): string {
  return `${WIKI_IMAGES}/${getItemWikiName(itemId)}.png`;
}

export function searchItems(query: string, limit = 50): ItemInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_ITEMS.slice(0, limit);

  const results: ItemInfo[] = [];
  for (const item of ALL_ITEMS) {
    if (item.name.toLowerCase().includes(q) || item.id.includes(q)) {
      results.push(item);
      if (results.length >= limit) break;
    }
  }
  return results;
}
