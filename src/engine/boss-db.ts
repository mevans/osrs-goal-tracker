import bossDataJson from './boss-data.json';

export interface BossInfo {
  id: string;
  name: string;
  womKey: string;
}

export const BOSS_DATABASE = bossDataJson as BossInfo[];

export const ALL_BOSSES = [...BOSS_DATABASE].sort((a, b) => a.name.localeCompare(b.name));

const WOM_ICON_BASE =
  'https://cdn.jsdelivr.net/gh/wise-old-man/wise-old-man@master/app/public/img/metrics';

export function getBossName(bossId: string): string {
  return BOSS_DATABASE.find((b) => b.id === bossId)?.name ?? bossId;
}

export function getBossWomKey(bossId: string): string | undefined {
  return BOSS_DATABASE.find((b) => b.id === bossId)?.womKey;
}

export function getBossIconUrl(bossId: string): string | undefined {
  const key = getBossWomKey(bossId);
  return key ? `${WOM_ICON_BASE}/${key}.png` : undefined;
}

export function buildWomBossIdMap(bosses: BossInfo[] = BOSS_DATABASE): Record<string, string> {
  const map: Record<string, string> = {};
  for (const boss of bosses) {
    map[boss.womKey] = boss.id;
  }
  return map;
}

export const WOM_BOSS_ID_MAP = buildWomBossIdMap();
