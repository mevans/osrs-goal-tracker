/**
 * Complete OSRS quest database sourced from the OSRS Wiki API.
 * Covers all free-to-play and members quests as of February 2026.
 * Excludes miniquests, subquests, category pages, and unreleased content.
 *
 * Recipe for Disaster is a "Special quest" on the wiki (no standard difficulty tier);
 * it is assigned 'grandmaster' here as the closest match to its actual challenge level.
 */

export interface QuestEntry {
  id: string;
  name: string;
  difficulty: 'novice' | 'intermediate' | 'experienced' | 'master' | 'grandmaster';
}

export const QUEST_DATABASE: Record<string, QuestEntry> = {
  // ── Novice ────────────────────────────────────────────────────────────────
  'below-ice-mountain': {
    id: 'below-ice-mountain',
    name: 'Below Ice Mountain',
    difficulty: 'novice',
  },
  biohazard: { id: 'biohazard', name: 'Biohazard', difficulty: 'novice' },
  'children-of-the-sun': {
    id: 'children-of-the-sun',
    name: 'Children of the Sun',
    difficulty: 'novice',
  },
  'client-of-kourend': { id: 'client-of-kourend', name: 'Client of Kourend', difficulty: 'novice' },
  'clock-tower': { id: 'clock-tower', name: 'Clock Tower', difficulty: 'novice' },
  'cooks-assistant': { id: 'cooks-assistant', name: "Cook's Assistant", difficulty: 'novice' },
  'current-affairs': { id: 'current-affairs', name: 'Current Affairs', difficulty: 'novice' },
  'death-plateau': { id: 'death-plateau', name: 'Death Plateau', difficulty: 'novice' },
  'demon-slayer': { id: 'demon-slayer', name: 'Demon Slayer', difficulty: 'novice' },
  'dorics-quest': { id: 'dorics-quest', name: "Doric's Quest", difficulty: 'novice' },
  'druidic-ritual': { id: 'druidic-ritual', name: 'Druidic Ritual', difficulty: 'novice' },
  'dwarf-cannon': { id: 'dwarf-cannon', name: 'Dwarf Cannon', difficulty: 'novice' },
  'eagles-peak': { id: 'eagles-peak', name: "Eagles' Peak", difficulty: 'novice' },
  'elemental-workshop-i': {
    id: 'elemental-workshop-i',
    name: 'Elemental Workshop I',
    difficulty: 'novice',
  },
  'ernest-the-chicken': {
    id: 'ernest-the-chicken',
    name: 'Ernest the Chicken',
    difficulty: 'novice',
  },
  'ethically-acquired-antiquities': {
    id: 'ethically-acquired-antiquities',
    name: 'Ethically Acquired Antiquities',
    difficulty: 'novice',
  },
  'fishing-contest': { id: 'fishing-contest', name: 'Fishing Contest', difficulty: 'novice' },
  'gertrudes-cat': { id: 'gertrudes-cat', name: "Gertrude's Cat", difficulty: 'novice' },
  'goblin-diplomacy': { id: 'goblin-diplomacy', name: 'Goblin Diplomacy', difficulty: 'novice' },
  'hazeel-cult': { id: 'hazeel-cult', name: 'Hazeel Cult', difficulty: 'novice' },
  'imp-catcher': { id: 'imp-catcher', name: 'Imp Catcher', difficulty: 'novice' },
  'jungle-potion': { id: 'jungle-potion', name: 'Jungle Potion', difficulty: 'novice' },
  'misthalin-mystery': { id: 'misthalin-mystery', name: 'Misthalin Mystery', difficulty: 'novice' },
  'monks-friend': { id: 'monks-friend', name: "Monk's Friend", difficulty: 'novice' },
  'murder-mystery': { id: 'murder-mystery', name: 'Murder Mystery', difficulty: 'novice' },
  pandemonium: { id: 'pandemonium', name: 'Pandemonium', difficulty: 'novice' },
  'pirates-treasure': { id: 'pirates-treasure', name: "Pirate's Treasure", difficulty: 'novice' },
  'plague-city': { id: 'plague-city', name: 'Plague City', difficulty: 'novice' },
  'a-porcine-of-interest': {
    id: 'a-porcine-of-interest',
    name: 'A Porcine of Interest',
    difficulty: 'novice',
  },
  'priest-in-peril': { id: 'priest-in-peril', name: 'Priest in Peril', difficulty: 'novice' },
  'prince-ali-rescue': { id: 'prince-ali-rescue', name: 'Prince Ali Rescue', difficulty: 'novice' },
  'rag-and-bone-man-i': {
    id: 'rag-and-bone-man-i',
    name: 'Rag and Bone Man I',
    difficulty: 'novice',
  },
  'recruitment-drive': { id: 'recruitment-drive', name: 'Recruitment Drive', difficulty: 'novice' },
  'the-restless-ghost': {
    id: 'the-restless-ghost',
    name: 'The Restless Ghost',
    difficulty: 'novice',
  },
  'the-ribbiting-tale-of-a-lily-pad-labour-dispute': {
    id: 'the-ribbiting-tale-of-a-lily-pad-labour-dispute',
    name: 'The Ribbiting Tale of a Lily Pad Labour Dispute',
    difficulty: 'novice',
  },
  'romeo-and-juliet': { id: 'romeo-and-juliet', name: 'Romeo & Juliet', difficulty: 'novice' },
  'rune-mysteries': { id: 'rune-mysteries', name: 'Rune Mysteries', difficulty: 'novice' },
  'sheep-herder': { id: 'sheep-herder', name: 'Sheep Herder', difficulty: 'novice' },
  'sheep-shearer': { id: 'sheep-shearer', name: 'Sheep Shearer', difficulty: 'novice' },
  'shield-of-arrav': { id: 'shield-of-arrav', name: 'Shield of Arrav', difficulty: 'novice' },
  'tower-of-life': { id: 'tower-of-life', name: 'Tower of Life', difficulty: 'novice' },
  'witchs-potion': { id: 'witchs-potion', name: "Witch's Potion", difficulty: 'novice' },
  'x-marks-the-spot': { id: 'x-marks-the-spot', name: 'X Marks the Spot', difficulty: 'novice' },

  // ── Intermediate ──────────────────────────────────────────────────────────
  'animal-magnetism': {
    id: 'animal-magnetism',
    name: 'Animal Magnetism',
    difficulty: 'intermediate',
  },
  'another-slice-of-ham': {
    id: 'another-slice-of-ham',
    name: 'Another Slice of H.A.M.',
    difficulty: 'intermediate',
  },
  'the-ascent-of-arceuus': {
    id: 'the-ascent-of-arceuus',
    name: 'The Ascent of Arceuus',
    difficulty: 'intermediate',
  },
  'at-first-light': { id: 'at-first-light', name: 'At First Light', difficulty: 'intermediate' },
  'big-chompy-bird-hunting': {
    id: 'big-chompy-bird-hunting',
    name: 'Big Chompy Bird Hunting',
    difficulty: 'intermediate',
  },
  'black-knights-fortress': {
    id: 'black-knights-fortress',
    name: "Black Knights' Fortress",
    difficulty: 'intermediate',
  },
  'bone-voyage': { id: 'bone-voyage', name: 'Bone Voyage', difficulty: 'intermediate' },
  'cold-war': { id: 'cold-war', name: 'Cold War', difficulty: 'intermediate' },
  'the-corsair-curse': {
    id: 'the-corsair-curse',
    name: 'The Corsair Curse',
    difficulty: 'intermediate',
  },
  'creature-of-fenkenstrain': {
    id: 'creature-of-fenkenstrain',
    name: 'Creature of Fenkenstrain',
    difficulty: 'intermediate',
  },
  'death-on-the-isle': {
    id: 'death-on-the-isle',
    name: 'Death on the Isle',
    difficulty: 'intermediate',
  },
  'death-to-the-dorgeshuun': {
    id: 'death-to-the-dorgeshuun',
    name: 'Death to the Dorgeshuun',
    difficulty: 'intermediate',
  },
  'the-depths-of-despair': {
    id: 'the-depths-of-despair',
    name: 'The Depths of Despair',
    difficulty: 'intermediate',
  },
  'the-dig-site': { id: 'the-dig-site', name: 'The Dig Site', difficulty: 'intermediate' },
  'eadgars-ruse': { id: 'eadgars-ruse', name: "Eadgar's Ruse", difficulty: 'intermediate' },
  'elemental-workshop-ii': {
    id: 'elemental-workshop-ii',
    name: 'Elemental Workshop II',
    difficulty: 'intermediate',
  },
  'enlightened-journey': {
    id: 'enlightened-journey',
    name: 'Enlightened Journey',
    difficulty: 'intermediate',
  },
  'the-eyes-of-glouphrie': {
    id: 'the-eyes-of-glouphrie',
    name: 'The Eyes of Glouphrie',
    difficulty: 'intermediate',
  },
  'fairytale-i-growing-pains': {
    id: 'fairytale-i-growing-pains',
    name: 'Fairytale I - Growing Pains',
    difficulty: 'intermediate',
  },
  'the-feud': { id: 'the-feud', name: 'The Feud', difficulty: 'intermediate' },
  'fight-arena': { id: 'fight-arena', name: 'Fight Arena', difficulty: 'intermediate' },
  'forgettable-tale': {
    id: 'forgettable-tale',
    name: 'Forgettable Tale...',
    difficulty: 'intermediate',
  },
  'the-forsaken-tower': {
    id: 'the-forsaken-tower',
    name: 'The Forsaken Tower',
    difficulty: 'intermediate',
  },
  'the-fremennik-trials': {
    id: 'the-fremennik-trials',
    name: 'The Fremennik Trials',
    difficulty: 'intermediate',
  },
  'the-garden-of-death': {
    id: 'the-garden-of-death',
    name: 'The Garden of Death',
    difficulty: 'intermediate',
  },
  'garden-of-tranquillity': {
    id: 'garden-of-tranquillity',
    name: 'Garden of Tranquillity',
    difficulty: 'intermediate',
  },
  'getting-ahead': { id: 'getting-ahead', name: 'Getting Ahead', difficulty: 'intermediate' },
  'ghosts-ahoy': { id: 'ghosts-ahoy', name: 'Ghosts Ahoy', difficulty: 'intermediate' },
  'the-giant-dwarf': { id: 'the-giant-dwarf', name: 'The Giant Dwarf', difficulty: 'intermediate' },
  'the-golem': { id: 'the-golem', name: 'The Golem', difficulty: 'intermediate' },
  'the-grand-tree': { id: 'the-grand-tree', name: 'The Grand Tree', difficulty: 'intermediate' },
  'the-hand-in-the-sand': {
    id: 'the-hand-in-the-sand',
    name: 'The Hand in the Sand',
    difficulty: 'intermediate',
  },
  'holy-grail': { id: 'holy-grail', name: 'Holy Grail', difficulty: 'intermediate' },
  'horror-from-the-deep': {
    id: 'horror-from-the-deep',
    name: 'Horror from the Deep',
    difficulty: 'intermediate',
  },
  'icthlarin-s-little-helper': {
    id: 'icthlarin-s-little-helper',
    name: "Icthlarin's Little Helper",
    difficulty: 'intermediate',
  },
  'in-aid-of-the-myreque': {
    id: 'in-aid-of-the-myreque',
    name: 'In Aid of the Myreque',
    difficulty: 'intermediate',
  },
  'in-search-of-the-myreque': {
    id: 'in-search-of-the-myreque',
    name: 'In Search of the Myreque',
    difficulty: 'intermediate',
  },
  'the-knights-sword': {
    id: 'the-knights-sword',
    name: "The Knight's Sword",
    difficulty: 'intermediate',
  },
  'lost-city': { id: 'lost-city', name: 'Lost City', difficulty: 'intermediate' },
  'the-lost-tribe': { id: 'the-lost-tribe', name: 'The Lost Tribe', difficulty: 'intermediate' },
  'making-history': { id: 'making-history', name: 'Making History', difficulty: 'intermediate' },
  'merlins-crystal': {
    id: 'merlins-crystal',
    name: "Merlin's Crystal",
    difficulty: 'intermediate',
  },
  'mountain-daughter': {
    id: 'mountain-daughter',
    name: 'Mountain Daughter',
    difficulty: 'intermediate',
  },
  'nature-spirit': { id: 'nature-spirit', name: 'Nature Spirit', difficulty: 'intermediate' },
  'observatory-quest': {
    id: 'observatory-quest',
    name: 'Observatory Quest',
    difficulty: 'intermediate',
  },
  'olafs-quest': { id: 'olafs-quest', name: "Olaf's Quest", difficulty: 'intermediate' },
  'prying-times': { id: 'prying-times', name: 'Prying Times', difficulty: 'intermediate' },
  'the-queen-of-thieves': {
    id: 'the-queen-of-thieves',
    name: 'The Queen of Thieves',
    difficulty: 'intermediate',
  },
  ratcatchers: { id: 'ratcatchers', name: 'Ratcatchers', difficulty: 'intermediate' },
  'scorpion-catcher': {
    id: 'scorpion-catcher',
    name: 'Scorpion Catcher',
    difficulty: 'intermediate',
  },
  scrambled: { id: 'scrambled', name: 'Scrambled!', difficulty: 'intermediate' },
  'sea-slug': { id: 'sea-slug', name: 'Sea Slug', difficulty: 'intermediate' },
  'shades-of-morton': {
    id: 'shades-of-morton',
    name: "Shades of Mort'ton",
    difficulty: 'intermediate',
  },
  'shadow-of-the-storm': {
    id: 'shadow-of-the-storm',
    name: 'Shadow of the Storm',
    difficulty: 'intermediate',
  },
  'shilo-village': { id: 'shilo-village', name: 'Shilo Village', difficulty: 'intermediate' },
  'sleeping-giants': { id: 'sleeping-giants', name: 'Sleeping Giants', difficulty: 'intermediate' },
  'the-slug-menace': { id: 'the-slug-menace', name: 'The Slug Menace', difficulty: 'intermediate' },
  'a-souls-bane': { id: 'a-souls-bane', name: "A Soul's Bane", difficulty: 'intermediate' },
  'spirits-of-the-elid': {
    id: 'spirits-of-the-elid',
    name: 'Spirits of the Elid',
    difficulty: 'intermediate',
  },
  'tai-bwo-wannai-trio': {
    id: 'tai-bwo-wannai-trio',
    name: 'Tai Bwo Wannai Trio',
    difficulty: 'intermediate',
  },
  'a-tail-of-two-cats': {
    id: 'a-tail-of-two-cats',
    name: 'A Tail of Two Cats',
    difficulty: 'intermediate',
  },
  'tale-of-the-righteous': {
    id: 'tale-of-the-righteous',
    name: 'Tale of the Righteous',
    difficulty: 'intermediate',
  },
  'tears-of-guthix': { id: 'tears-of-guthix', name: 'Tears of Guthix', difficulty: 'intermediate' },
  'temple-of-ikov': { id: 'temple-of-ikov', name: 'Temple of Ikov', difficulty: 'intermediate' },
  'temple-of-the-eye': {
    id: 'temple-of-the-eye',
    name: 'Temple of the Eye',
    difficulty: 'intermediate',
  },
  'the-tourist-trap': {
    id: 'the-tourist-trap',
    name: 'The Tourist Trap',
    difficulty: 'intermediate',
  },
  'tree-gnome-village': {
    id: 'tree-gnome-village',
    name: 'Tree Gnome Village',
    difficulty: 'intermediate',
  },
  'tribal-totem': { id: 'tribal-totem', name: 'Tribal Totem', difficulty: 'intermediate' },
  'troll-romance': { id: 'troll-romance', name: 'Troll Romance', difficulty: 'intermediate' },
  'troll-stronghold': {
    id: 'troll-stronghold',
    name: 'Troll Stronghold',
    difficulty: 'intermediate',
  },
  'twilights-promise': {
    id: 'twilights-promise',
    name: "Twilight's Promise",
    difficulty: 'intermediate',
  },
  'vampyre-slayer': { id: 'vampyre-slayer', name: 'Vampyre Slayer', difficulty: 'intermediate' },
  wanted: { id: 'wanted', name: 'Wanted!', difficulty: 'intermediate' },
  watchtower: { id: 'watchtower', name: 'Watchtower', difficulty: 'intermediate' },
  'waterfall-quest': { id: 'waterfall-quest', name: 'Waterfall Quest', difficulty: 'intermediate' },
  'what-lies-below': { id: 'what-lies-below', name: 'What Lies Below', difficulty: 'intermediate' },
  'witchs-house': { id: 'witchs-house', name: "Witch's House", difficulty: 'intermediate' },
  'zogre-flesh-eaters': {
    id: 'zogre-flesh-eaters',
    name: 'Zogre Flesh Eaters',
    difficulty: 'intermediate',
  },

  // ── Experienced ───────────────────────────────────────────────────────────
  'between-a-rock': { id: 'between-a-rock', name: 'Between a Rock...', difficulty: 'experienced' },
  'cabin-fever': { id: 'cabin-fever', name: 'Cabin Fever', difficulty: 'experienced' },
  contact: { id: 'contact', name: 'Contact!', difficulty: 'experienced' },
  'darkness-of-hallowvale': {
    id: 'darkness-of-hallowvale',
    name: 'Darkness of Hallowvale',
    difficulty: 'experienced',
  },
  'defender-of-varrock': {
    id: 'defender-of-varrock',
    name: 'Defender of Varrock',
    difficulty: 'experienced',
  },
  'devious-minds': { id: 'devious-minds', name: 'Devious Minds', difficulty: 'experienced' },
  'dragon-slayer-i': { id: 'dragon-slayer-i', name: 'Dragon Slayer I', difficulty: 'experienced' },
  'enakhras-lament': { id: 'enakhras-lament', name: "Enakhra's Lament", difficulty: 'experienced' },
  'fairytale-ii-cure-a-queen': {
    id: 'fairytale-ii-cure-a-queen',
    name: 'Fairytale II - Cure a Queen',
    difficulty: 'experienced',
  },
  'family-crest': { id: 'family-crest', name: 'Family Crest', difficulty: 'experienced' },
  'the-fremennik-isles': {
    id: 'the-fremennik-isles',
    name: 'The Fremennik Isles',
    difficulty: 'experienced',
  },
  'the-great-brain-robbery': {
    id: 'the-great-brain-robbery',
    name: 'The Great Brain Robbery',
    difficulty: 'experienced',
  },
  'haunted-mine': { id: 'haunted-mine', name: 'Haunted Mine', difficulty: 'experienced' },
  'the-heart-of-darkness': {
    id: 'the-heart-of-darkness',
    name: 'The Heart of Darkness',
    difficulty: 'experienced',
  },
  'heroes-quest': { id: 'heroes-quest', name: "Heroes' Quest", difficulty: 'experienced' },
  'kings-ransom': { id: 'kings-ransom', name: "King's Ransom", difficulty: 'experienced' },
  'a-kingdom-divided': {
    id: 'a-kingdom-divided',
    name: 'A Kingdom Divided',
    difficulty: 'experienced',
  },
  'land-of-the-goblins': {
    id: 'land-of-the-goblins',
    name: 'Land of the Goblins',
    difficulty: 'experienced',
  },
  'lunar-diplomacy': { id: 'lunar-diplomacy', name: 'Lunar Diplomacy', difficulty: 'experienced' },
  'meat-and-greet': { id: 'meat-and-greet', name: 'Meat and Greet', difficulty: 'experienced' },
  'my-arms-big-adventure': {
    id: 'my-arms-big-adventure',
    name: "My Arm's Big Adventure",
    difficulty: 'experienced',
  },
  'one-small-favour': {
    id: 'one-small-favour',
    name: 'One Small Favour',
    difficulty: 'experienced',
  },
  'the-path-of-glouphrie': {
    id: 'the-path-of-glouphrie',
    name: 'The Path of Glouphrie',
    difficulty: 'experienced',
  },
  'rag-and-bone-man-ii': {
    id: 'rag-and-bone-man-ii',
    name: 'Rag and Bone Man II',
    difficulty: 'experienced',
  },
  regicide: { id: 'regicide', name: 'Regicide', difficulty: 'experienced' },
  'roving-elves': { id: 'roving-elves', name: 'Roving Elves', difficulty: 'experienced' },
  'royal-trouble': { id: 'royal-trouble', name: 'Royal Trouble', difficulty: 'experienced' },
  'rum-deal': { id: 'rum-deal', name: 'Rum Deal', difficulty: 'experienced' },
  'shadows-of-custodia': {
    id: 'shadows-of-custodia',
    name: 'Shadows of Custodia',
    difficulty: 'experienced',
  },
  'a-taste-of-hope': { id: 'a-taste-of-hope', name: 'A Taste of Hope', difficulty: 'experienced' },
  'the-red-reef': { id: 'the-red-reef', name: 'The Red Reef', difficulty: 'experienced' },
  'throne-of-miscellania': {
    id: 'throne-of-miscellania',
    name: 'Throne of Miscellania',
    difficulty: 'experienced',
  },
  'troubled-tortugans': {
    id: 'troubled-tortugans',
    name: 'Troubled Tortugans',
    difficulty: 'experienced',
  },
  'underground-pass': {
    id: 'underground-pass',
    name: 'Underground Pass',
    difficulty: 'experienced',
  },

  // ── Master ────────────────────────────────────────────────────────────────
  'beneath-cursed-sands': {
    id: 'beneath-cursed-sands',
    name: 'Beneath Cursed Sands',
    difficulty: 'master',
  },
  'desert-treasure-i': { id: 'desert-treasure-i', name: 'Desert Treasure I', difficulty: 'master' },
  'dream-mentor': { id: 'dream-mentor', name: 'Dream Mentor', difficulty: 'master' },
  'the-fremennik-exiles': {
    id: 'the-fremennik-exiles',
    name: 'The Fremennik Exiles',
    difficulty: 'master',
  },
  'grim-tales': { id: 'grim-tales', name: 'Grim Tales', difficulty: 'master' },
  'legends-quest': { id: 'legends-quest', name: "Legends' Quest", difficulty: 'master' },
  'making-friends-with-my-arm': {
    id: 'making-friends-with-my-arm',
    name: 'Making Friends with My Arm',
    difficulty: 'master',
  },
  'monkey-madness-i': { id: 'monkey-madness-i', name: 'Monkey Madness I', difficulty: 'master' },
  'mournings-end-part-i': {
    id: 'mournings-end-part-i',
    name: "Mourning's End Part I",
    difficulty: 'master',
  },
  'mournings-end-part-ii': {
    id: 'mournings-end-part-ii',
    name: "Mourning's End Part II",
    difficulty: 'master',
  },
  'a-night-at-the-theatre': {
    id: 'a-night-at-the-theatre',
    name: 'A Night at the Theatre',
    difficulty: 'master',
  },
  'perilous-moons': { id: 'perilous-moons', name: 'Perilous Moons', difficulty: 'master' },
  'secrets-of-the-north': {
    id: 'secrets-of-the-north',
    name: 'Secrets of the North',
    difficulty: 'master',
  },
  'sins-of-the-father': {
    id: 'sins-of-the-father',
    name: 'Sins of the Father',
    difficulty: 'master',
  },
  'swan-song': { id: 'swan-song', name: 'Swan Song', difficulty: 'master' },
  'the-curse-of-arrav': {
    id: 'the-curse-of-arrav',
    name: 'The Curse of Arrav',
    difficulty: 'master',
  },
  'the-final-dawn': { id: 'the-final-dawn', name: 'The Final Dawn', difficulty: 'master' },

  // ── Grandmaster ───────────────────────────────────────────────────────────
  'desert-treasure-ii-the-fallen-empire': {
    id: 'desert-treasure-ii-the-fallen-empire',
    name: 'Desert Treasure II - The Fallen Empire',
    difficulty: 'grandmaster',
  },
  'dragon-slayer-ii': {
    id: 'dragon-slayer-ii',
    name: 'Dragon Slayer II',
    difficulty: 'grandmaster',
  },
  'monkey-madness-ii': {
    id: 'monkey-madness-ii',
    name: 'Monkey Madness II',
    difficulty: 'grandmaster',
  },
  'recipe-for-disaster': {
    id: 'recipe-for-disaster',
    name: 'Recipe for Disaster',
    difficulty: 'grandmaster',
  },
  'song-of-the-elves': {
    id: 'song-of-the-elves',
    name: 'Song of the Elves',
    difficulty: 'grandmaster',
  },
  'the-blood-moon-rises': {
    id: 'the-blood-moon-rises',
    name: 'The Blood Moon Rises',
    difficulty: 'grandmaster',
  },
  'while-guthix-sleeps': {
    id: 'while-guthix-sleeps',
    name: 'While Guthix Sleeps',
    difficulty: 'grandmaster',
  },

  // RFD subquests (not on wiki as separate quests, but tracked separately here for completion purposes)

  //mountain dwarf
  // goblin generals
  // pirate pete
  // lumbridge guide
  // evil dave
  // skrach uglogwee
  // sir amik varze
  // king awowogei
  // culinaromancer

  'rfd-mountain-dwarf': {
    id: 'rfd-mountain-dwarf',
    name: 'Recipe for Disaster - Mountain Dwarf',
    difficulty: 'intermediate',
  },
  'rfd-goblin-generals': {
    id: 'rfd-goblin-generals',
    name: 'Recipe for Disaster - Goblin Generals',
    difficulty: 'intermediate',
  },
  'rfd-pirate-pete': {
    id: 'rfd-pirate-pete',
    name: 'Recipe for Disaster - Pirate Pete',
    difficulty: 'intermediate',
  },
  'rfd-lumbridge-guide': {
    id: 'rfd-lumbridge-guide',
    name: 'Recipe for Disaster - Lumbridge Guide',
    difficulty: 'intermediate',
  },
  'rfd-evil-dave': {
    id: 'rfd-evil-dave',
    name: 'Recipe for Disaster - Evil Dave',
    difficulty: 'intermediate',
  },
  'rfd-skrach-uglogwee': {
    id: 'rfd-skrach-uglogwee',
    name: 'Recipe for Disaster - Skrach Uglogwee',
    difficulty: 'intermediate',
  },
  'rfd-sir-amik-varze': {
    id: 'rfd-sir-amik-varze',
    name: 'Recipe for Disaster - Sir Amik Varze',
    difficulty: 'intermediate',
  },
  'rfd-king-awowogei': {
    id: 'rfd-king-awowogei',
    name: 'Recipe for Disaster - King Awowogei',
    difficulty: 'intermediate',
  },
  'rfd-culinaromancer': {
    id: 'rfd-culinaromancer',
    name: 'Recipe for Disaster - Culinaromancer',
    difficulty: 'intermediate',
  },
};

export function getQuestName(questId: string): string {
  return QUEST_DATABASE[questId]?.name ?? questId;
}

export const ALL_QUESTS = Object.values(QUEST_DATABASE).sort((a, b) =>
  a.name.localeCompare(b.name),
);
