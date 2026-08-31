import { OSRS_SKILLS, type SkillName } from './types';
import { WOM_BOSS_ID_MAP } from './boss-db';

const WOM_BASE = 'https://api.wiseoldman.net/v2';

export interface PlayerData {
  skills: Partial<Record<SkillName, number>>;
  bossKcs: Record<string, number>; // bossId → kill count
}

export async function fetchPlayerDataFromWom(rsn: string): Promise<PlayerData> {
  const res = await fetch(`${WOM_BASE}/players/${encodeURIComponent(rsn)}`);

  if (res.status === 404) {
    throw new Error(
      'Player not found on Wise Old Man. Visit wiseoldman.net to start tracking your account.',
    );
  }
  if (!res.ok) {
    throw new Error(`Lookup failed (${res.status})`);
  }

  const data = (await res.json()) as {
    latestSnapshot: {
      data: {
        skills: Record<string, { level: number }>;
        bosses: Record<string, { kills: number }>;
      };
    } | null;
  };

  if (!data.latestSnapshot) {
    throw new Error('No snapshot data found for this player.');
  }

  // WOM uses different names for a few skills
  const WOM_SKILL_NAME_MAP: Record<string, string> = {
    runecrafting: 'Runecraft',
  };

  const skills: Partial<Record<SkillName, number>> = {};
  for (const [womKey, skillData] of Object.entries(data.latestSnapshot.data.skills)) {
    if (womKey === 'overall') continue;
    const name = (WOM_SKILL_NAME_MAP[womKey] ??
      womKey.charAt(0).toUpperCase() + womKey.slice(1)) as SkillName;
    if ((OSRS_SKILLS as readonly string[]).includes(name) && skillData.level > 0) {
      skills[name] = skillData.level;
    }
  }

  const bossKcs: Record<string, number> = {};
  for (const [womKey, bossData] of Object.entries(data.latestSnapshot.data.bosses)) {
    const bossId = WOM_BOSS_ID_MAP[womKey];
    if (bossId && bossData.kills > 0) {
      bossKcs[bossId] = Math.max(bossKcs[bossId] ?? 0, bossData.kills);
    }
  }

  return { skills, bossKcs };
}
