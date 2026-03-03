import { OSRS_SKILLS, type SkillName } from './types';

const WOM_BASE = 'https://api.wiseoldman.net/v2';

export interface PlayerData {
  skills: Partial<Record<SkillName, number>>;
  bossKcs: Record<string, number>; // bossId → kill count
}

// Maps WOM snake_case boss keys → our boss IDs
const WOM_BOSS_ID_MAP: Record<string, string> = {
  abyssal_sire: 'Abyssal Sire',
  alchemical_hydra: 'Alchemical Hydra',
  amoxliatl: 'Amoxliatl',
  araxxor: 'Araxxor',
  artio: 'Artio',
  barrows_chests: 'Barrows',
  bryophyta: 'Bryophyta',
  callisto: 'Callisto',
  calvarion: "Calvar'ion",
  cerberus: 'Cerberus',
  chambers_of_xeric: 'Great Olm',
  chaos_elemental: 'Chaos Elemental',
  chaos_fanatic: 'Chaos Fanatic',
  commander_zilyana: 'Commander Zilyana',
  corporeal_beast: 'Corporeal Beast',
  crazy_archaeologist: 'Crazy Archaeologist',
  dagannoth_prime: 'Dagannoth Prime',
  dagannoth_rex: 'Dagannoth Rex',
  dagannoth_supreme: 'Dagannoth Supreme',
  deranged_archaeologist: 'Deranged Archaeologist',
  doom_of_mokhaiotl: 'Doom of Mokhaiotl',
  duke_sucellus: 'Duke Sucellus',
  gauntlet: 'Crystalline Hunllef',
  general_graardor: 'General Graardor',
  giant_mole: 'Giant Mole',
  grotesque_guardians: 'Grotesque Guardians',
  hespori: 'Hespori',
  kalphite_queen: 'Kalphite Queen',
  king_black_dragon: 'King Black Dragon',
  kraken: 'Kraken',
  kreearra: "Kree'arra",
  kril_tsutsaroth: "K'ril Tsutsaroth",
  mimic: 'The Mimic',
  nex: 'Nex',
  nightmare: 'The Nightmare',
  obor: 'Obor',
  phantom_muspah: 'Phantom Muspah',
  phosanis_nightmare: "Phosani's Nightmare",
  royal_titans: 'Royal Titans',
  sarachnis: 'Sarachnis',
  scorpia: 'Scorpia',
  scurrius: 'Scurrius',
  skotizo: 'Skotizo',
  spindel: 'Spindel',
  tempoross: 'Tempoross',
  theatre_of_blood: 'Verzik Vitur',
  thermonuclear_smoke_devil: 'Thermonuclear Smoke Devil',
  tombs_of_amascut: "Tumeken's Warden",
  tzkal_zuk: 'TzKal-Zuk',
  tztok_jad: 'TzTok-Jad',
  vardorvis: 'Vardorvis',
  venenatis: 'Venenatis',
  vetion: "Vet'ion",
  vorkath: 'Vorkath',
  wintertodt: 'Wintertodt',
  yama: 'Yama',
  zalcano: 'Zalcano',
  zulrah: 'Zulrah',
};

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
      bossKcs[bossId] = bossData.kills;
    }
  }

  return { skills, bossKcs };
}
