export interface BossInfo {
  id: string;
  name: string;
  wikiName: string; // wiki image filename (underscores for spaces)
}

export const BOSS_DATABASE: BossInfo[] = [
  // Barrows
  { id: 'Barrows', name: 'Barrows', wikiName: 'Barrows_minigame' },

  // World Bosses
  { id: 'Corporeal Beast', name: 'Corporeal Beast', wikiName: 'Corporeal_Beast' },
  { id: 'Dagannoth Prime', name: 'Dagannoth Prime', wikiName: 'Dagannoth_Prime' },
  { id: 'Dagannoth Rex', name: 'Dagannoth Rex', wikiName: 'Dagannoth_Rex' },
  { id: 'Dagannoth Supreme', name: 'Dagannoth Supreme', wikiName: 'Dagannoth_Supreme' },
  {
    id: 'Deranged Archaeologist',
    name: 'Deranged Archaeologist',
    wikiName: 'Deranged_archaeologist',
  },
  { id: 'Blood Moon', name: 'Blood Moon', wikiName: 'Blood_Moon' },
  { id: 'Blue Moon', name: 'Blue Moon', wikiName: 'Blue_Moon' },
  { id: 'Eclipse Moon', name: 'Eclipse Moon', wikiName: 'Eclipse_Moon' },
  { id: 'Gemstone Crab', name: 'Gemstone Crab', wikiName: 'Gemstone_Crab' },
  { id: 'Giant Mole', name: 'Giant Mole', wikiName: 'Giant_Mole' },
  { id: 'The Hueycoatl', name: 'The Hueycoatl', wikiName: 'The_Hueycoatl' },
  { id: 'Kalphite Queen', name: 'Kalphite Queen', wikiName: 'Kalphite_Queen' },
  { id: 'Nex', name: 'Nex', wikiName: 'Nex' },
  { id: 'Sarachnis', name: 'Sarachnis', wikiName: 'Sarachnis' },
  { id: 'Scurrius', name: 'Scurrius', wikiName: 'Scurrius' },

  // God Wars Dungeon
  { id: 'Commander Zilyana', name: 'Commander Zilyana', wikiName: 'Commander_Zilyana' },
  { id: 'General Graardor', name: 'General Graardor', wikiName: 'General_Graardor' },
  { id: "K'ril Tsutsaroth", name: "K'ril Tsutsaroth", wikiName: 'K%27ril_Tsutsaroth' },
  { id: "Kree'arra", name: "Kree'arra", wikiName: 'Kree%27arra' },

  // Wilderness Bosses
  { id: 'Artio', name: 'Artio', wikiName: 'Artio' },
  { id: "Calvar'ion", name: "Calvar'ion", wikiName: 'Calvar%27ion' },
  { id: 'Callisto', name: 'Callisto', wikiName: 'Callisto' },
  { id: 'Chaos Elemental', name: 'Chaos Elemental', wikiName: 'Chaos_Elemental' },
  { id: 'Chaos Fanatic', name: 'Chaos Fanatic', wikiName: 'Chaos_Fanatic' },
  { id: 'Crazy Archaeologist', name: 'Crazy Archaeologist', wikiName: 'Crazy_archaeologist' },
  { id: 'King Black Dragon', name: 'King Black Dragon', wikiName: 'King_Black_Dragon' },
  { id: 'Revenant Maledictus', name: 'Revenant Maledictus', wikiName: 'Revenant_maledictus' },
  { id: 'Scorpia', name: 'Scorpia', wikiName: 'Scorpia' },
  { id: 'Spindel', name: 'Spindel', wikiName: 'Spindel' },
  { id: 'Venenatis', name: 'Venenatis', wikiName: 'Venenatis' },
  { id: "Vet'ion", name: "Vet'ion", wikiName: 'Vet%27ion' },

  // Instanced Bosses — Early Game
  { id: 'Brutus', name: 'Brutus', wikiName: 'Brutus' },
  { id: 'Demonic Brutus', name: 'Demonic Brutus', wikiName: 'Demonic_Brutus' },
  { id: 'Obor', name: 'Obor', wikiName: 'Obor' },
  { id: 'Bryophyta', name: 'Bryophyta', wikiName: 'Bryophyta' },

  // Instanced Bosses — Mid Game
  { id: 'Amoxliatl', name: 'Amoxliatl', wikiName: 'Amoxliatl' },
  { id: 'Doom of Mokhaiotl', name: 'Doom of Mokhaiotl', wikiName: 'Doom_of_Mokhaiotl' },
  { id: 'Phantom Muspah', name: 'Phantom Muspah', wikiName: 'Phantom_Muspah_%28ranged%29' },
  { id: 'Royal Titans', name: 'Royal Titans', wikiName: 'Branda_the_Fire_Queen' },
  { id: 'Vorkath', name: 'Vorkath', wikiName: 'Vorkath' },
  { id: 'Zulrah', name: 'Zulrah', wikiName: 'Zulrah_%28serpentine%29' },

  // Instanced Bosses — High Level
  { id: 'The Nightmare', name: 'The Nightmare', wikiName: 'The_Nightmare' },
  { id: "Phosani's Nightmare", name: "Phosani's Nightmare", wikiName: 'Phosani%27s_Nightmare' },
  { id: 'Yama', name: 'Yama', wikiName: 'Yama' },

  // Desert Treasure II — The Forgotten Four
  { id: 'Duke Sucellus', name: 'Duke Sucellus', wikiName: 'Duke_Sucellus' },
  { id: 'The Leviathan', name: 'The Leviathan', wikiName: 'The_Leviathan' },
  { id: 'The Whisperer', name: 'The Whisperer', wikiName: 'The_Whisperer' },
  { id: 'Vardorvis', name: 'Vardorvis', wikiName: 'Vardorvis' },

  // Sporadic Bosses
  { id: 'Hespori', name: 'Hespori', wikiName: 'Hespori' },
  { id: 'The Mimic', name: 'The Mimic', wikiName: 'The_Mimic' },
  { id: 'Skotizo', name: 'Skotizo', wikiName: 'Skotizo' },

  // Slayer Bosses
  { id: 'Abyssal Sire', name: 'Abyssal Sire', wikiName: 'Abyssal_Sire' },
  {
    id: 'Alchemical Hydra',
    name: 'Alchemical Hydra',
    wikiName: 'Alchemical_Hydra_%28serpentine%29',
  },
  { id: 'Araxxor', name: 'Araxxor', wikiName: 'Araxxor' },
  { id: 'Cerberus', name: 'Cerberus', wikiName: 'Cerberus' },
  { id: 'Grotesque Guardians', name: 'Grotesque Guardians', wikiName: 'Dusk' },
  { id: 'Kraken', name: 'Kraken', wikiName: 'Cave_kraken' },
  { id: 'Shellbane Gryphon', name: 'Shellbane Gryphon', wikiName: 'Shellbane_gryphon' },
  {
    id: 'Thermonuclear Smoke Devil',
    name: 'Thermonuclear Smoke Devil',
    wikiName: 'Thermonuclear_smoke_devil',
  },

  // Minigame Bosses
  { id: 'Crystalline Hunllef', name: 'Crystalline Hunllef', wikiName: 'Crystalline_Hunllef' },
  { id: 'TzTok-Jad', name: 'TzTok-Jad', wikiName: 'TzTok-Jad' },
  { id: 'TzKal-Zuk', name: 'TzKal-Zuk', wikiName: 'TzKal-Zuk' },

  // Raids
  { id: 'Great Olm', name: 'Great Olm', wikiName: 'Great_Olm' },
  { id: "Tumeken's Warden", name: "Tumeken's Warden", wikiName: 'Tumeken%27s_Warden' },
  { id: 'Verzik Vitur', name: 'Verzik Vitur', wikiName: 'Verzik_Vitur' },

  // Skilling Bosses
  { id: 'Tempoross', name: 'Tempoross', wikiName: 'Tempoross' },
  { id: 'Wintertodt', name: 'Wintertodt', wikiName: 'Wintertodt' },
  { id: 'Zalcano', name: 'Zalcano', wikiName: 'Zalcano' },
];

export const ALL_BOSSES = [...BOSS_DATABASE].sort((a, b) => a.name.localeCompare(b.name));

export function getBossName(bossId: string): string {
  return BOSS_DATABASE.find((b) => b.id === bossId)?.name ?? bossId;
}

export function getBossWikiName(bossId: string): string {
  return BOSS_DATABASE.find((b) => b.id === bossId)?.wikiName ?? bossId.replace(/ /g, '_');
}
