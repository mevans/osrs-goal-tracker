import { describe, expect, it } from 'vitest';
import { getItemImageUrl } from './item-db';
import { isCanonicalItem, isActivityVariant, parseWikiImage } from '../../scripts/fetch-item-db';

describe('isCanonicalItem', () => {
  it('keeps the primary toxic blowpipe', () => {
    expect(
      isCanonicalItem({
        item_id: ['12926'],
        item_name: 'Toxic blowpipe',
        image: ['File:Toxic blowpipe.png'],
        default_version: '',
        version_anchor: 'Charged',
      }),
    ).toBe(true);
  });

  it('excludes empty, beta, and removed variants', () => {
    expect(
      isCanonicalItem({
        item_id: ['12924'],
        item_name: 'Toxic blowpipe (empty)',
        image: ['File:Toxic blowpipe (empty).png'],
        version_anchor: 'Empty',
      }),
    ).toBe(false);

    expect(
      isCanonicalItem({
        item_id: ['beta25491'],
        item_name: 'Toxic blowpipe (beta - dragon)',
        image: ['File:Toxic blowpipe.png'],
        default_version: '',
        removal_date: ['3 February 2021'],
      }),
    ).toBe(false);

    expect(
      isCanonicalItem({
        item_id: ['20449'],
        item_name: 'Bronze defender (broken)',
        image: ['File:Bronze defender (broken).png'],
        version_anchor: 'Broken',
      }),
    ).toBe(false);
  });
});

describe('isActivityVariant', () => {
  it('excludes Last Man Standing copies', () => {
    expect(
      isActivityVariant({
        item_name: 'Noxious halberd',
        image: ['File:Noxious halberd (Last Man Standing).png'],
        page_name_sub: 'Noxious halberd (Last Man Standing)',
      }),
    ).toBe(true);

    expect(
      isActivityVariant({
        item_name: 'Noxious halberd',
        image: ['File:Noxious halberd.png'],
        page_name_sub: 'Noxious halberd',
      }),
    ).toBe(false);
  });
});

describe('parseWikiImage', () => {
  it('trims whitespace from wiki filenames', () => {
    expect(parseWikiImage('File: Lava scale shard 1.png')).toBe('Lava_scale_shard_1');
    expect(parseWikiImage("File:Zulrah's scales 1.png")).toBe('Zulrah%27s_scales_1');
  });
});

describe('getItemImageUrl', () => {
  it('uses direct wiki image path', () => {
    expect(getItemImageUrl('12934')).toBe(
      'https://oldschool.runescape.wiki/images/Zulrah%27s_scales_1.png',
    );
  });
});
