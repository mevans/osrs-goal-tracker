import type { TemplateDefinition } from './types';

export const barrowsGlovesTemplate: TemplateDefinition = {
  id: 'barrows-gloves',
  name: 'Barrows Gloves',
  description:
    'Complete all Recipe for Disaster subquests to unlock the best-in-slot melee gloves. Full quest tree including Legend\'s Quest chain.',

  nodes: [
    // ─── Hard: The Goal + Gates ───
    {
      key: 'barrows-gloves', type: 'goal', title: 'Barrows Gloves',
      requirement: 'hard', rationale: 'The goal itself.',
      notes: 'Reward from completing all RFD subquests and defeating the Culinaromancer.',
      skillData: undefined, questData: undefined,
    },
    {
      key: '175-qp', type: 'unlock', title: '175 Quest Points',
      requirement: 'hard', rationale: 'Hard gate — cannot fight the Culinaromancer without 175 QP.',
      notes: undefined, skillData: undefined, questData: undefined,
    },
    {
      key: 'cooking-70', type: 'skill', title: '70 Cooking',
      requirement: 'hard', rationale: 'Required for the King Awowogei subquest.',
      notes: 'Fast to train via wines or cooking fish at Rogues\' Den.',
      skillData: { skillName: 'Cooking', targetLevel: 70 , boost: undefined }, questData: undefined,
    },

    // ─── Hard: RFD Subquests ───
    {
      key: 'rfd-cook', type: 'quest', title: 'RFD: Another Cook\'s Quest',
      requirement: 'hard', rationale: 'Starting subquest — unlocks the rest of RFD.',
      notes: undefined, skillData: undefined, questData: { questId: 'rfd_another_cooks_quest' },
    },
    {
      key: 'rfd-dwarf', type: 'quest', title: 'RFD: Mountain Dwarf',
      requirement: 'hard', rationale: 'One of 8 subquests required before Sir Amik Varze.',
      notes: undefined, skillData: undefined, questData: { questId: 'rfd_mountain_dwarf' },
    },
    {
      key: 'rfd-goblins', type: 'quest', title: 'RFD: Goblin Generals',
      requirement: 'hard', rationale: 'One of 8 subquests required before Sir Amik Varze.',
      notes: undefined, skillData: undefined, questData: { questId: 'rfd_goblin_generals' },
    },
    {
      key: 'rfd-pirate', type: 'quest', title: 'RFD: Pirate Pete',
      requirement: 'hard', rationale: 'One of 8 subquests required before Sir Amik Varze.',
      notes: 'Requires 31 Cooking and 42 Crafting.',
      skillData: undefined, questData: { questId: 'rfd_pirate_pete' },
    },
    {
      key: 'rfd-dave', type: 'quest', title: 'RFD: Evil Dave',
      requirement: 'hard', rationale: 'One of 8 subquests required before Sir Amik Varze.',
      notes: 'Requires 25 Cooking and a grown cat.',
      skillData: undefined, questData: { questId: 'rfd_evil_dave' },
    },
    {
      key: 'rfd-skrach', type: 'quest', title: 'RFD: Skrach Uglogwee',
      requirement: 'hard', rationale: 'One of 8 subquests required before Sir Amik Varze.',
      notes: 'Requires 41 Cooking and 20 Firemaking.',
      skillData: undefined, questData: { questId: 'rfd_skrach_uglogwee' },
    },
    {
      key: 'rfd-guide', type: 'quest', title: 'RFD: Lumbridge Guide',
      requirement: 'hard', rationale: 'The most prereq-heavy subquest — requires many completed quests.',
      notes: undefined, skillData: undefined, questData: { questId: 'rfd_lumbridge_guide' },
    },
    {
      key: 'rfd-awowogei', type: 'quest', title: 'RFD: King Awowogei',
      requirement: 'hard', rationale: 'Requires Monkey Madness I and 70 Cooking.',
      notes: undefined, skillData: undefined, questData: { questId: 'rfd_king_awowogei' },
    },
    {
      key: 'rfd-amik', type: 'quest', title: 'RFD: Sir Amik Varze',
      requirement: 'hard', rationale: 'Final subquest — requires all other 8 subquests completed.',
      notes: 'Involves a challenging boss fight. Protection prayers recommended.',
      skillData: undefined, questData: { questId: 'rfd_sir_amik_varze' },
    },

    // ─── Soft: Direct Subquest Prerequisites ───
    {
      key: 'cooks-assistant', type: 'quest', title: 'Cook\'s Assistant',
      requirement: 'soft', rationale: 'Prerequisite for Another Cook\'s Quest.',
      notes: undefined, skillData: undefined, questData: { questId: 'cooks_assistant' },
    },
    {
      key: 'fishing-contest', type: 'quest', title: 'Fishing Contest',
      requirement: 'soft', rationale: 'Prerequisite for the Mountain Dwarf subquest.',
      notes: undefined, skillData: undefined, questData: { questId: 'fishing_contest' },
    },
    {
      key: 'goblin-diplomacy', type: 'quest', title: 'Goblin Diplomacy',
      requirement: 'soft', rationale: 'Prerequisite for Goblin Generals and Lumbridge Guide subquests.',
      notes: undefined, skillData: undefined, questData: { questId: 'goblin_diplomacy' },
    },
    {
      key: 'shadow-of-the-storm', type: 'quest', title: 'Shadow of the Storm',
      requirement: 'soft', rationale: 'Prerequisite for the Evil Dave subquest.',
      notes: undefined, skillData: undefined, questData: { questId: 'shadow_of_the_storm' },
    },
    {
      key: 'demon-slayer', type: 'quest', title: 'Demon Slayer',
      requirement: 'soft', rationale: 'Prerequisite for Shadow of the Storm and Lumbridge Guide.',
      notes: undefined, skillData: undefined, questData: { questId: 'demon_slayer' },
    },
    {
      key: 'the-golem', type: 'quest', title: 'The Golem',
      requirement: 'soft', rationale: 'Prerequisite for Shadow of the Storm.',
      notes: undefined, skillData: undefined, questData: { questId: 'the_golem' },
    },
    {
      key: 'gertudes-cat', type: 'quest', title: 'Gertrude\'s Cat',
      requirement: 'soft', rationale: 'Needed to obtain a kitten/cat for the Evil Dave subquest.',
      notes: undefined, skillData: undefined, questData: { questId: 'gertudes_cat' },
    },
    {
      key: 'big-chompy', type: 'quest', title: 'Big Chompy Bird Hunting',
      requirement: 'soft', rationale: 'Prerequisite for Skrach Uglogwee and Lumbridge Guide subquests.',
      notes: undefined, skillData: undefined, questData: { questId: 'big_chompy_bird_hunting' },
    },
    {
      key: 'nature-spirit', type: 'quest', title: 'Nature Spirit',
      requirement: 'soft', rationale: 'Prerequisite for the Lumbridge Guide subquest.',
      notes: undefined, skillData: undefined, questData: { questId: 'nature_spirit' },
    },
    {
      key: 'priest-in-peril', type: 'quest', title: 'Priest in Peril',
      requirement: 'soft', rationale: 'Prerequisite for Nature Spirit. Unlocks Morytania.',
      notes: undefined, skillData: undefined, questData: { questId: 'priest_in_peril' },
    },
    {
      key: 'lost-city', type: 'quest', title: 'Lost City',
      requirement: 'soft', rationale: 'Prerequisite for Lumbridge Guide and Heroes\' Quest.',
      notes: undefined, skillData: undefined, questData: { questId: 'lost_city' },
    },
    {
      key: 'murder-mystery', type: 'quest', title: 'Murder Mystery',
      requirement: 'soft', rationale: 'Prerequisite for the Lumbridge Guide subquest.',
      notes: undefined, skillData: undefined, questData: { questId: 'murder_mystery' },
    },
    {
      key: 'witchs-house', type: 'quest', title: 'Witch\'s House',
      requirement: 'soft', rationale: 'Prerequisite for the Lumbridge Guide subquest.',
      notes: undefined, skillData: undefined, questData: { questId: 'witchs_house' },
    },
    {
      key: 'ernest-the-chicken', type: 'quest', title: 'Ernest the Chicken',
      requirement: 'soft', rationale: 'Prerequisite for the Lumbridge Guide subquest.',
      notes: undefined, skillData: undefined, questData: { questId: 'ernest_the_chicken' },
    },
    {
      key: 'biohazard', type: 'quest', title: 'Biohazard',
      requirement: 'soft', rationale: 'Prerequisite for Lumbridge Guide and Underground Pass.',
      notes: undefined, skillData: undefined, questData: { questId: 'biohazard' },
    },
    {
      key: 'plague-city', type: 'quest', title: 'Plague City',
      requirement: 'soft', rationale: 'Prerequisite for Biohazard.',
      notes: undefined, skillData: undefined, questData: { questId: 'plague_city' },
    },
    {
      key: 'firemaking-20', type: 'skill', title: '20 Firemaking',
      requirement: 'soft', rationale: 'Required for the Skrach Uglogwee subquest.',
      notes: undefined, skillData: { skillName: 'Firemaking', targetLevel: 20 , boost: undefined }, questData: undefined,
    },

    // ─── Soft: Monkey Madness I Chain ───
    {
      key: 'monkey-madness', type: 'quest', title: 'Monkey Madness I',
      requirement: 'soft', rationale: 'Required for the King Awowogei subquest.',
      notes: 'Also unlocks Dragon Scimitar. Requires ~48 Agility.',
      skillData: undefined, questData: { questId: 'monkey_madness_i' },
    },
    {
      key: 'grand-tree', type: 'quest', title: 'The Grand Tree',
      requirement: 'soft', rationale: 'Prerequisite for Monkey Madness I.',
      notes: undefined, skillData: undefined, questData: { questId: 'the_grand_tree' },
    },
    {
      key: 'tree-gnome-village', type: 'quest', title: 'Tree Gnome Village',
      requirement: 'soft', rationale: 'Prerequisite for Monkey Madness I.',
      notes: undefined, skillData: undefined, questData: { questId: 'tree_gnome_village' },
    },

    // ─── Soft: Legend's Quest Chain ───
    {
      key: 'legends-quest', type: 'quest', title: 'Legend\'s Quest',
      requirement: 'soft', rationale: 'Major QP contributor with a deep prereq chain that covers many skills you need.',
      notes: 'Requires 107 Quest Points to start.',
      skillData: undefined, questData: { questId: 'legends_quest' },
    },
    {
      key: 'heroes-quest', type: 'quest', title: 'Heroes\' Quest',
      requirement: 'soft', rationale: 'Prerequisite for Legend\'s Quest. Requires 55 QP.',
      notes: 'Partner quest — need a friend or alt in the opposite gang.',
      skillData: undefined, questData: { questId: 'heroes_quest' },
    },
    {
      key: 'dragon-slayer', type: 'quest', title: 'Dragon Slayer I',
      requirement: 'soft', rationale: 'Prerequisite for Heroes\' Quest.',
      notes: '32 Quest Points required to start.',
      skillData: undefined, questData: { questId: 'dragon_slayer_i' },
    },
    {
      key: 'shield-of-arrav', type: 'quest', title: 'Shield of Arrav',
      requirement: 'soft', rationale: 'Prerequisite for Heroes\' Quest.',
      notes: 'Partner quest — need a friend or alt in the opposite gang.',
      skillData: undefined, questData: { questId: 'shield_of_arrav' },
    },
    {
      key: 'merlins-crystal', type: 'quest', title: 'Merlin\'s Crystal',
      requirement: 'soft', rationale: 'Prerequisite for Heroes\' Quest and Legend\'s Quest.',
      notes: undefined, skillData: undefined, questData: { questId: 'merlins_crystal' },
    },
    {
      key: 'underground-pass', type: 'quest', title: 'Underground Pass',
      requirement: 'soft', rationale: 'Prerequisite for Legend\'s Quest. Notoriously long.',
      notes: undefined, skillData: undefined, questData: { questId: 'underground_pass' },
    },
    {
      key: 'waterfall-quest', type: 'quest', title: 'Waterfall Quest',
      requirement: 'soft', rationale: 'Prerequisite for Legend\'s Quest. Great early XP.',
      notes: undefined, skillData: undefined, questData: { questId: 'waterfall_quest' },
    },
    {
      key: 'family-crest', type: 'quest', title: 'Family Crest',
      requirement: 'soft', rationale: 'Prerequisite for Legend\'s Quest.',
      notes: 'Requires 40 Crafting, 40 Mining, 40 Smithing, 59 Magic.',
      skillData: undefined, questData: { questId: 'family_crest' },
    },
    {
      key: 'shilo-village', type: 'quest', title: 'Shilo Village',
      requirement: 'soft', rationale: 'Prerequisite for Legend\'s Quest.',
      notes: undefined, skillData: undefined, questData: { questId: 'shilo_village' },
    },
    {
      key: 'jungle-potion', type: 'quest', title: 'Jungle Potion',
      requirement: 'soft', rationale: 'Prerequisite for Shilo Village.',
      notes: undefined, skillData: undefined, questData: { questId: 'jungle_potion' },
    },

    // ─── Soft: Legend's Quest Skills ───
    {
      key: 'agility-50', type: 'skill', title: '50 Agility',
      requirement: 'soft', rationale: 'Required for Legend\'s Quest. Also covers 48 Agility for Monkey Madness I.',
      notes: undefined, skillData: { skillName: 'Agility', targetLevel: 50 , boost: undefined }, questData: undefined,
    },
    {
      key: 'crafting-50', type: 'skill', title: '50 Crafting',
      requirement: 'soft', rationale: 'Required for Legend\'s Quest. Also covers 42 Crafting for Pirate Pete.',
      notes: undefined, skillData: { skillName: 'Crafting', targetLevel: 50 , boost: undefined }, questData: undefined,
    },
    {
      key: 'magic-56', type: 'skill', title: '56 Magic',
      requirement: 'soft', rationale: 'Required for Legend\'s Quest.',
      notes: undefined, skillData: { skillName: 'Magic', targetLevel: 56 , boost: undefined }, questData: undefined,
    },
    {
      key: 'prayer-43', type: 'skill', title: '43 Prayer',
      requirement: 'soft', rationale: 'Legend\'s Quest needs 42. 43 unlocks protection prayers — essential for boss fights.',
      notes: undefined, skillData: { skillName: 'Prayer', targetLevel: 43 , boost: undefined }, questData: undefined,
    },
    {
      key: 'smithing-50', type: 'skill', title: '50 Smithing',
      requirement: 'soft', rationale: 'Required for Legend\'s Quest.',
      notes: undefined, skillData: { skillName: 'Smithing', targetLevel: 50 , boost: undefined }, questData: undefined,
    },
    {
      key: 'strength-50', type: 'skill', title: '50 Strength',
      requirement: 'soft', rationale: 'Required for Legend\'s Quest.',
      notes: undefined, skillData: { skillName: 'Strength', targetLevel: 50 , boost: undefined }, questData: undefined,
    },
    {
      key: 'thieving-50', type: 'skill', title: '50 Thieving',
      requirement: 'soft', rationale: 'Required for Legend\'s Quest.',
      notes: undefined, skillData: { skillName: 'Thieving', targetLevel: 50 , boost: undefined }, questData: undefined,
    },
    {
      key: 'woodcutting-50', type: 'skill', title: '50 Woodcutting',
      requirement: 'soft', rationale: 'Required for Legend\'s Quest.',
      notes: undefined, skillData: { skillName: 'Woodcutting', targetLevel: 50 , boost: undefined }, questData: undefined,
    },

    // ─── Soft: Heroes' Quest Skills ───
    {
      key: 'fishing-53', type: 'skill', title: '53 Fishing',
      requirement: 'soft', rationale: 'Required for Heroes\' Quest.',
      notes: undefined, skillData: { skillName: 'Fishing', targetLevel: 53 , boost: undefined }, questData: undefined,
    },
    {
      key: 'mining-53', type: 'skill', title: '53 Mining',
      requirement: 'soft', rationale: 'Required for Heroes\' Quest (53) and Legend\'s Quest (52).',
      notes: undefined, skillData: { skillName: 'Mining', targetLevel: 53 , boost: undefined }, questData: undefined,
    },
    {
      key: 'herblore-25', type: 'skill', title: '25 Herblore',
      requirement: 'soft', rationale: 'Required for Heroes\' Quest.',
      notes: undefined, skillData: { skillName: 'Herblore', targetLevel: 25 , boost: undefined }, questData: undefined,
    },

    // ─── Soft: Underground Pass Skill ───
    {
      key: 'ranged-25', type: 'skill', title: '25 Ranged',
      requirement: 'soft', rationale: 'Required for Underground Pass.',
      notes: undefined, skillData: { skillName: 'Ranged', targetLevel: 25 , boost: undefined }, questData: undefined,
    },
  ],

  edges: [
    // ═══ Core RFD Structure ═══
    // Sir Amik Varze requires all 8 other subquests
    { fromKey: 'rfd-cook', toKey: 'rfd-amik', type: 'requires' },
    { fromKey: 'rfd-dwarf', toKey: 'rfd-amik', type: 'requires' },
    { fromKey: 'rfd-goblins', toKey: 'rfd-amik', type: 'requires' },
    { fromKey: 'rfd-pirate', toKey: 'rfd-amik', type: 'requires' },
    { fromKey: 'rfd-dave', toKey: 'rfd-amik', type: 'requires' },
    { fromKey: 'rfd-skrach', toKey: 'rfd-amik', type: 'requires' },
    { fromKey: 'rfd-guide', toKey: 'rfd-amik', type: 'requires' },
    { fromKey: 'rfd-awowogei', toKey: 'rfd-amik', type: 'requires' },
    // Final gates
    { fromKey: 'rfd-amik', toKey: 'barrows-gloves', type: 'requires' },
    { fromKey: '175-qp', toKey: 'barrows-gloves', type: 'requires' },

    // ═══ Subquest Prerequisites ═══
    { fromKey: 'cooks-assistant', toKey: 'rfd-cook', type: 'requires' },
    { fromKey: 'fishing-contest', toKey: 'rfd-dwarf', type: 'requires' },
    { fromKey: 'goblin-diplomacy', toKey: 'rfd-goblins', type: 'requires' },
    // Evil Dave
    { fromKey: 'shadow-of-the-storm', toKey: 'rfd-dave', type: 'requires' },
    { fromKey: 'gertudes-cat', toKey: 'rfd-dave', type: 'requires' },
    // Skrach Uglogwee
    { fromKey: 'big-chompy', toKey: 'rfd-skrach', type: 'requires' },
    { fromKey: 'firemaking-20', toKey: 'rfd-skrach', type: 'requires' },
    // King Awowogei
    { fromKey: 'monkey-madness', toKey: 'rfd-awowogei', type: 'requires' },
    { fromKey: 'cooking-70', toKey: 'rfd-awowogei', type: 'requires' },

    // ═══ Lumbridge Guide Prerequisites ═══
    { fromKey: 'nature-spirit', toKey: 'rfd-guide', type: 'requires' },
    { fromKey: 'demon-slayer', toKey: 'rfd-guide', type: 'requires' },
    { fromKey: 'lost-city', toKey: 'rfd-guide', type: 'requires' },
    { fromKey: 'murder-mystery', toKey: 'rfd-guide', type: 'requires' },
    { fromKey: 'witchs-house', toKey: 'rfd-guide', type: 'requires' },
    { fromKey: 'ernest-the-chicken', toKey: 'rfd-guide', type: 'requires' },
    { fromKey: 'biohazard', toKey: 'rfd-guide', type: 'requires' },
    { fromKey: 'goblin-diplomacy', toKey: 'rfd-guide', type: 'requires' },
    { fromKey: 'big-chompy', toKey: 'rfd-guide', type: 'requires' },

    // ═══ Quest Chain Dependencies ═══
    // Shadow of the Storm chain
    { fromKey: 'demon-slayer', toKey: 'shadow-of-the-storm', type: 'requires' },
    { fromKey: 'the-golem', toKey: 'shadow-of-the-storm', type: 'requires' },
    // Nature Spirit chain
    { fromKey: 'priest-in-peril', toKey: 'nature-spirit', type: 'requires' },
    // Biohazard chain
    { fromKey: 'plague-city', toKey: 'biohazard', type: 'requires' },
    // Monkey Madness I chain
    { fromKey: 'grand-tree', toKey: 'monkey-madness', type: 'requires' },
    { fromKey: 'tree-gnome-village', toKey: 'monkey-madness', type: 'requires' },

    // ═══ Legend's Quest Prerequisites ═══
    { fromKey: 'heroes-quest', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'underground-pass', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'shilo-village', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'waterfall-quest', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'family-crest', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'merlins-crystal', toKey: 'legends-quest', type: 'requires' },

    // ═══ Heroes' Quest Prerequisites ═══
    { fromKey: 'dragon-slayer', toKey: 'heroes-quest', type: 'requires' },
    { fromKey: 'shield-of-arrav', toKey: 'heroes-quest', type: 'requires' },
    { fromKey: 'lost-city', toKey: 'heroes-quest', type: 'requires' },
    { fromKey: 'merlins-crystal', toKey: 'heroes-quest', type: 'requires' },

    // Underground Pass + Shilo Village chains
    { fromKey: 'biohazard', toKey: 'underground-pass', type: 'requires' },
    { fromKey: 'jungle-potion', toKey: 'shilo-village', type: 'requires' },

    // ═══ Skill → Quest Requirements ═══
    // Legend's Quest skills
    { fromKey: 'agility-50', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'crafting-50', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'magic-56', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'prayer-43', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'smithing-50', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'strength-50', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'thieving-50', toKey: 'legends-quest', type: 'requires' },
    { fromKey: 'woodcutting-50', toKey: 'legends-quest', type: 'requires' },
    // Heroes' Quest skills
    { fromKey: 'fishing-53', toKey: 'heroes-quest', type: 'requires' },
    { fromKey: 'mining-53', toKey: 'heroes-quest', type: 'requires' },
    { fromKey: 'herblore-25', toKey: 'heroes-quest', type: 'requires' },
    // Underground Pass skills
    { fromKey: 'ranged-25', toKey: 'underground-pass', type: 'requires' },

    // ═══ QP Improvement Edges ═══
    { fromKey: 'legends-quest', toKey: '175-qp', type: 'improves' },
    { fromKey: 'heroes-quest', toKey: '175-qp', type: 'improves' },
    { fromKey: 'monkey-madness', toKey: '175-qp', type: 'improves' },

    // ═══ Combat Improvements ═══
    { fromKey: 'prayer-43', toKey: 'barrows-gloves', type: 'improves' },
  ],
};
