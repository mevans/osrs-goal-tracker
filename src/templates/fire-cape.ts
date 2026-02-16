import type { TemplateDefinition } from './types';

export const fireCapeTemplate: TemplateDefinition = {
  id: 'fire-cape',
  name: 'Fire Cape',
  description:
    'Prerequisites and recommendations for defeating TzTok-Jad in the Fight Caves to earn the Fire Cape.',

  nodes: [
    // --- Hard requirements ---
    {
      key: 'prayer-43',
      type: 'skill',
      title: '43 Prayer',
      requirement: 'hard',
      rationale: 'Protect from Magic is essential for surviving Jad.',
      notes: undefined,
      skillData: { skillName: 'Prayer', targetLevel: 43, boost: undefined },
      questData: undefined,
    },
    {
      key: 'fire-cape',
      type: 'goal',
      title: 'Fire Cape',
      requirement: 'hard',
      rationale: 'The goal itself.',
      notes: 'Defeat TzTok-Jad in the TzHaar Fight Cave.',
      skillData: undefined,
      questData: undefined,
    },

    // --- Soft requirements ---
    {
      key: 'ranged-61',
      type: 'skill',
      title: '61 Ranged',
      requirement: 'soft',
      rationale: 'Minimum to equip a Rune Crossbow — the budget approach.',
      notes: undefined,
      skillData: { skillName: 'Ranged', targetLevel: 61, boost: undefined },
      questData: undefined,
    },
    {
      key: 'ranged-75',
      type: 'skill',
      title: '75 Ranged',
      requirement: 'soft',
      rationale: 'Required to equip the Toxic Blowpipe, the standard Fight Caves weapon.',
      notes: undefined,
      skillData: { skillName: 'Ranged', targetLevel: 75, boost: undefined },
      questData: undefined,
    },
    {
      key: 'blowpipe',
      type: 'task',
      title: 'Toxic Blowpipe',
      requirement: 'soft',
      rationale: 'Dramatically speeds up the caves and simplifies healers on Jad.',
      notes:
        'Requires 75 Ranged to equip. Made from a Tanzanite fang (Zulrah drop) or bought on the GE.',
      skillData: undefined,
      questData: undefined,
    },
    {
      key: 'defence-70',
      type: 'skill',
      title: '70 Defence',
      requirement: 'soft',
      rationale: "Allows Barrows armour (Verac's, Karil's) for much better survivability.",
      notes: undefined,
      skillData: { skillName: 'Defence', targetLevel: 70, boost: undefined },
      questData: undefined,
    },
    {
      key: 'animal-magnetism',
      type: 'quest',
      title: 'Animal Magnetism',
      requirement: 'soft',
      rationale: "Unlocks Ava's Accumulator — automatically retrieves ranged ammo.",
      notes: undefined,
      skillData: undefined,
      questData: { questId: 'animal_magnetism' },
    },
    {
      key: 'avas',
      type: 'task',
      title: "Ava's Accumulator",
      requirement: 'soft',
      rationale: 'Saves significant ammo over a long Fight Caves run.',
      notes: 'Reward from Animal Magnetism quest.',
      skillData: undefined,
      questData: undefined,
    },
  ],

  edges: [
    // Hard: Prayer → Fire Cape
    { fromKey: 'prayer-43', toKey: 'fire-cape', type: 'requires' },

    // Ranged progression: 61 → 75 (you pass through 61 on the way to 75)
    { fromKey: 'ranged-61', toKey: 'ranged-75', type: 'requires' },

    // Blowpipe requires 75 Ranged
    { fromKey: 'ranged-75', toKey: 'blowpipe', type: 'requires' },

    // Soft improvements to Fire Cape
    { fromKey: 'ranged-61', toKey: 'fire-cape', type: 'improves' },
    { fromKey: 'blowpipe', toKey: 'fire-cape', type: 'improves' },
    { fromKey: 'defence-70', toKey: 'fire-cape', type: 'improves' },
    { fromKey: 'avas', toKey: 'fire-cape', type: 'improves' },

    // Quest → Unlock
    { fromKey: 'animal-magnetism', toKey: 'avas', type: 'requires' },
  ],
};
