import { describe, expect, it } from 'vitest';
import { buildBossList, parseWomBossNames, titleCaseWomKey } from '../../scripts/fetch-boss-db';
import { buildWomBossIdMap, getBossIconUrl } from './boss-db';

describe('titleCaseWomKey', () => {
  it('title-cases snake_case and keeps of/the small', () => {
    expect(titleCaseWomKey('maggot_king')).toBe('Maggot King');
    expect(titleCaseWomKey('doom_of_mokhaiotl')).toBe('Doom of Mokhaiotl');
    expect(titleCaseWomKey('the_hueycoatl')).toBe('The Hueycoatl');
  });
});

describe('parseWomBossNames', () => {
  it('pairs Boss enum keys with BossProps names', () => {
    const source = `
const Boss = {
    MAGGOT_KING: 'maggot_king',
    KREEARRA: 'kreearra',
};
const BossProps = mapValues({
    [Boss.MAGGOT_KING]: { name: 'Maggot King' },
    [Boss.KREEARRA]: { name: "Kree'Arra" },
}, props => props);
const ActivityProps = mapValues({
`;
    expect(parseWomBossNames(source)).toEqual({
      maggot_king: 'Maggot King',
      kreearra: "Kree'Arra",
    });
  });
});

describe('buildBossList', () => {
  it('is one row per WOM metric, using WOM names when given', () => {
    const bosses = buildBossList(['chambers_of_xeric', 'maggot_king'], {
      chambers_of_xeric: 'Chambers Of Xeric',
    });
    expect(bosses).toHaveLength(2);
    expect(bosses.find((b) => b.womKey === 'chambers_of_xeric')).toEqual({
      id: 'Chambers Of Xeric',
      name: 'Chambers Of Xeric',
      womKey: 'chambers_of_xeric',
    });
    expect(bosses.find((b) => b.womKey === 'maggot_king')?.name).toBe('Maggot King');
    expect(bosses.some((b) => b.id === 'Blood Moon')).toBe(false);
  });
});

describe('buildWomBossIdMap', () => {
  it('indexes the wom key', () => {
    const map = buildWomBossIdMap([
      { id: 'Maggot King', name: 'Maggot King', womKey: 'maggot_king' },
    ]);
    expect(map['maggot_king']).toBe('Maggot King');
  });
});

describe('getBossIconUrl', () => {
  it('points at the WOM metric png', () => {
    expect(getBossIconUrl('Zulrah')).toBe(
      'https://cdn.jsdelivr.net/gh/wise-old-man/wise-old-man@master/app/public/img/metrics/zulrah.png',
    );
    expect(getBossIconUrl('not-a-boss')).toBeUndefined();
  });
});
