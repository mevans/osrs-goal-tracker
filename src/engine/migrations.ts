import type { GraphData } from './types';

/**
 * Current schema version. Increment when making breaking changes to GraphData.
 */
export const CURRENT_VERSION = 2;

/**
 * Raw data shape from unknown (possibly old) saves. Typed as a loose record
 * rather than `any` so property access still requires explicit handling.
 */
type RawData = Record<string, unknown>;
type Migration = (data: RawData) => RawData;

/**
 * Migration registry. Each key is the version BEFORE the migration.
 * Example: migrations[0] upgrades v0 data to v1.
 */
// v1→v2: Quest IDs changed from kebab-case to wiki page names
// e.g. 'animal-magnetism' → 'Animal Magnetism'
const KEBAB_TO_WIKI: Record<string, string> = {
  'animal-magnetism': 'Animal Magnetism',
  'another-slice-of-ham': 'Another Slice of H.A.M.',
  'the-ascent-of-arceuus': 'The Ascent of Arceuus',
  'at-first-light': 'At First Light',
  'below-ice-mountain': 'Below Ice Mountain',
  'beneath-cursed-sands': 'Beneath Cursed Sands',
  'between-a-rock': 'Between a Rock...',
  biohazard: 'Biohazard',
  'big-chompy-bird-hunting': 'Big Chompy Bird Hunting',
  'black-knights-fortress': "Black Knights' Fortress",
  'bone-voyage': 'Bone Voyage',
  'cabin-fever': 'Cabin Fever',
  'children-of-the-sun': 'Children of the Sun',
  'client-of-kourend': 'Client of Kourend',
  'clock-tower': 'Clock Tower',
  'cold-war': 'Cold War',
  contact: 'Contact!',
  'the-corsair-curse': 'The Corsair Curse',
  'cooks-assistant': "Cook's Assistant",
  'creature-of-fenkenstrain': 'Creature of Fenkenstrain',
  'current-affairs': 'Current Affairs',
  'the-curse-of-arrav': 'The Curse of Arrav',
  'darkness-of-hallowvale': 'Darkness of Hallowvale',
  'death-on-the-isle': 'Death on the Isle',
  'death-plateau': 'Death Plateau',
  'death-to-the-dorgeshuun': 'Death to the Dorgeshuun',
  'defender-of-varrock': 'Defender of Varrock',
  'demon-slayer': 'Demon Slayer',
  'the-depths-of-despair': 'The Depths of Despair',
  'desert-treasure-i': 'Desert Treasure I',
  'desert-treasure-ii-the-fallen-empire': 'Desert Treasure II - The Fallen Empire',
  'devious-minds': 'Devious Minds',
  'the-dig-site': 'The Dig Site',
  'dorics-quest': "Doric's Quest",
  'dragon-slayer-i': 'Dragon Slayer I',
  'dragon-slayer-ii': 'Dragon Slayer II',
  'dream-mentor': 'Dream Mentor',
  'druidic-ritual': 'Druidic Ritual',
  'dwarf-cannon': 'Dwarf Cannon',
  'eadgars-ruse': "Eadgar's Ruse",
  'eagles-peak': "Eagles' Peak",
  'elemental-workshop-i': 'Elemental Workshop I',
  'elemental-workshop-ii': 'Elemental Workshop II',
  'enakhras-lament': "Enakhra's Lament",
  'enlightened-journey': 'Enlightened Journey',
  'ernest-the-chicken': 'Ernest the Chicken',
  'ethically-acquired-antiquities': 'Ethically Acquired Antiquities',
  'the-eyes-of-glouphrie': 'The Eyes of Glouphrie',
  'fairytale-i-growing-pains': 'Fairytale I - Growing Pains',
  'fairytale-ii-cure-a-queen': 'Fairytale II - Cure a Queen',
  'family-crest': 'Family Crest',
  'the-feud': 'The Feud',
  'fight-arena': 'Fight Arena',
  'the-final-dawn': 'The Final Dawn',
  'fishing-contest': 'Fishing Contest',
  'forgettable-tale': 'Forgettable Tale...',
  'the-forsaken-tower': 'The Forsaken Tower',
  'the-fremennik-exiles': 'The Fremennik Exiles',
  'the-fremennik-isles': 'The Fremennik Isles',
  'the-fremennik-trials': 'The Fremennik Trials',
  'the-garden-of-death': 'The Garden of Death',
  'garden-of-tranquillity': 'Garden of Tranquillity',
  'gertrudes-cat': "Gertrude's Cat",
  'getting-ahead': 'Getting Ahead',
  'ghosts-ahoy': 'Ghosts Ahoy',
  'the-giant-dwarf': 'The Giant Dwarf',
  'goblin-diplomacy': 'Goblin Diplomacy',
  'the-golem': 'The Golem',
  'the-grand-tree': 'The Grand Tree',
  'the-great-brain-robbery': 'The Great Brain Robbery',
  'grim-tales': 'Grim Tales',
  'the-hand-in-the-sand': 'The Hand in the Sand',
  'haunted-mine': 'Haunted Mine',
  'hazeel-cult': 'Hazeel Cult',
  'the-heart-of-darkness': 'The Heart of Darkness',
  'heroes-quest': "Heroes' Quest",
  'holy-grail': 'Holy Grail',
  'horror-from-the-deep': 'Horror from the Deep',
  'icthlarin-s-little-helper': "Icthlarin's Little Helper",
  'imp-catcher': 'Imp Catcher',
  'in-aid-of-the-myreque': 'In Aid of the Myreque',
  'in-search-of-the-myreque': 'In Search of the Myreque',
  'jungle-potion': 'Jungle Potion',
  'a-kingdom-divided': 'A Kingdom Divided',
  'kings-ransom': "King's Ransom",
  'the-knights-sword': "The Knight's Sword",
  'land-of-the-goblins': 'Land of the Goblins',
  'legends-quest': "Legends' Quest",
  'lost-city': 'Lost City',
  'the-lost-tribe': 'The Lost Tribe',
  'lunar-diplomacy': 'Lunar Diplomacy',
  'making-friends-with-my-arm': 'Making Friends with My Arm',
  'making-history': 'Making History',
  'meat-and-greet': 'Meat and Greet',
  'merlins-crystal': "Merlin's Crystal",
  'misthalin-mystery': 'Misthalin Mystery',
  'monks-friend': "Monk's Friend",
  'monkey-madness-i': 'Monkey Madness I',
  'monkey-madness-ii': 'Monkey Madness II',
  'mountain-daughter': 'Mountain Daughter',
  'mournings-end-part-i': "Mourning's End Part I",
  'mournings-end-part-ii': "Mourning's End Part II",
  'murder-mystery': 'Murder Mystery',
  'my-arms-big-adventure': "My Arm's Big Adventure",
  'nature-spirit': 'Nature Spirit',
  'a-night-at-the-theatre': 'A Night at the Theatre',
  'observatory-quest': 'Observatory Quest',
  'olafs-quest': "Olaf's Quest",
  'one-small-favour': 'One Small Favour',
  pandemonium: 'Pandemonium',
  'the-path-of-glouphrie': 'The Path of Glouphrie',
  'perilous-moons': 'Perilous Moons',
  'pirates-treasure': "Pirate's Treasure",
  'plague-city': 'Plague City',
  'a-porcine-of-interest': 'A Porcine of Interest',
  'priest-in-peril': 'Priest in Peril',
  'prince-ali-rescue': 'Prince Ali Rescue',
  'prying-times': 'Prying Times',
  'the-queen-of-thieves': 'The Queen of Thieves',
  'rag-and-bone-man-i': 'Rag and Bone Man I',
  'rag-and-bone-man-ii': 'Rag and Bone Man II',
  ratcatchers: 'Ratcatchers',
  'recipe-for-disaster': 'Recipe for Disaster',
  'recruitment-drive': 'Recruitment Drive',
  regicide: 'Regicide',
  'the-restless-ghost': 'The Restless Ghost',
  'the-ribbiting-tale-of-a-lily-pad-labour-dispute':
    'The Ribbiting Tale of a Lily Pad Labour Dispute',
  'romeo-and-juliet': 'Romeo & Juliet',
  'roving-elves': 'Roving Elves',
  'royal-trouble': 'Royal Trouble',
  'rum-deal': 'Rum Deal',
  'rune-mysteries': 'Rune Mysteries',
  'scorpion-catcher': 'Scorpion Catcher',
  scrambled: 'Scrambled!',
  'sea-slug': 'Sea Slug',
  'secrets-of-the-north': 'Secrets of the North',
  'shades-of-morton': "Shades of Mort'ton",
  'shadow-of-the-storm': 'Shadow of the Storm',
  'shadows-of-custodia': 'Shadows of Custodia',
  'sheep-herder': 'Sheep Herder',
  'sheep-shearer': 'Sheep Shearer',
  'shield-of-arrav': 'Shield of Arrav',
  'shilo-village': 'Shilo Village',
  'sins-of-the-father': 'Sins of the Father',
  'sleeping-giants': 'Sleeping Giants',
  'the-slug-menace': 'The Slug Menace',
  'song-of-the-elves': 'Song of the Elves',
  'spirits-of-the-elid': 'Spirits of the Elid',
  'a-souls-bane': "A Soul's Bane",
  'swan-song': 'Swan Song',
  'tai-bwo-wannai-trio': 'Tai Bwo Wannai Trio',
  'a-tail-of-two-cats': 'A Tail of Two Cats',
  'tale-of-the-righteous': 'Tale of the Righteous',
  'a-taste-of-hope': 'A Taste of Hope',
  'tears-of-guthix': 'Tears of Guthix',
  'temple-of-ikov': 'Temple of Ikov',
  'temple-of-the-eye': 'Temple of the Eye',
  'the-red-reef': 'The Red Reef',
  'the-tourist-trap': 'The Tourist Trap',
  'throne-of-miscellania': 'Throne of Miscellania',
  'tower-of-life': 'Tower of Life',
  'tree-gnome-village': 'Tree Gnome Village',
  'tribal-totem': 'Tribal Totem',
  'troll-romance': 'Troll Romance',
  'troll-stronghold': 'Troll Stronghold',
  'troubled-tortugans': 'Troubled Tortugans',
  'twilights-promise': "Twilight's Promise",
  'underground-pass': 'Underground Pass',
  'vampyre-slayer': 'Vampyre Slayer',
  wanted: 'Wanted!',
  watchtower: 'Watchtower',
  'waterfall-quest': 'Waterfall Quest',
  'what-lies-below': 'What Lies Below',
  'while-guthix-sleeps': 'While Guthix Sleeps',
  'witchs-house': "Witch's House",
  'witchs-potion': "Witch's Potion",
  'x-marks-the-spot': 'X Marks the Spot',
  'zogre-flesh-eaters': 'Zogre Flesh Eaters',
  // RFD subquests
  'rfd-mountain-dwarf': 'Recipe for Disaster/Freeing the Mountain Dwarf',
  'rfd-goblin-generals': 'Recipe for Disaster/Freeing the Goblin generals',
  'rfd-pirate-pete': 'Recipe for Disaster/Freeing Pirate Pete',
  'rfd-lumbridge-guide': 'Recipe for Disaster/Freeing the Lumbridge Guide',
  'rfd-evil-dave': 'Recipe for Disaster/Freeing Evil Dave',
  'rfd-skrach-uglogwee': 'Recipe for Disaster/Freeing Skrach Uglogwee',
  'rfd-sir-amik-varze': 'Recipe for Disaster/Freeing Sir Amik Varze',
  'rfd-king-awowogei': 'Recipe for Disaster/Freeing King Awowogei',
  'rfd-culinaromancer': 'Recipe for Disaster/Defeating the Culinaromancer',
};

const migrations: Record<number, Migration> = {
  // v0 → v1: Add tags field to nodes (legacy data from before versioning)
  0: (data) => ({
    ...data,
    nodes: (data['nodes'] as RawData[]).map((n) => ({
      ...n,
      tags: Array.isArray(n['tags']) ? n['tags'] : [],
    })),
  }),

  // v1 → v2: Quest IDs changed from kebab-case to wiki page names
  1: (data) => ({
    ...data,
    nodes: (data['nodes'] as RawData[]).map((n) => {
      const questData = n['questData'] as { questId: string } | undefined;
      if (!questData) return n;
      const newId = KEBAB_TO_WIKI[questData.questId] ?? questData.questId;
      return { ...n, questData: { questId: newId } };
    }),
  }),
};

/**
 * Run all migrations from `fromVersion` to `CURRENT_VERSION`.
 * Returns migrated data or undefined if migration fails.
 */
export function runMigrations(data: unknown, fromVersion: number): GraphData | undefined {
  if (fromVersion > CURRENT_VERSION) {
    // Future version — can't migrate backwards
    console.warn(
      `Data is from version ${fromVersion}, but current version is ${CURRENT_VERSION}. Cannot migrate.`,
    );
    return undefined;
  }

  if (fromVersion === CURRENT_VERSION) {
    // Already current
    return data as GraphData;
  }

  // Run migrations sequentially: v0→v1→v2→...→current
  let migrated: RawData = data as RawData;
  for (let v = fromVersion; v < CURRENT_VERSION; v++) {
    const migration = migrations[v];
    if (!migration) {
      console.warn(`Missing migration from v${v} to v${v + 1}`);
      return undefined;
    }
    try {
      migrated = migration(migrated);
    } catch (error) {
      console.error(`Migration v${v}→v${v + 1} failed:`, error);
      return undefined;
    }
  }

  return migrated as unknown as GraphData;
}
