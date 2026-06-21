import { describe, expect, it } from 'vitest';
import {
  CHANGELOG,
  getEngagedNodeCount,
  getUnseenChangelog,
  hasUnseenChangelog,
  parseChangelogEntry,
  shouldBaselineChangelog,
} from './changelog';

describe('changelog', () => {
  it('parses frontmatter and markdown body', () => {
    const raw = `---
id: 2
date: July 2025
title: Test release
---

- First **bold** item
- [A link](https://example.com)

Plain paragraph.`;

    expect(parseChangelogEntry(raw)).toEqual({
      id: '2',
      date: 'July 2025',
      title: 'Test release',
      content: '- First **bold** item\n- [A link](https://example.com)\n\nPlain paragraph.',
    });
  });

  it('loads markdown files from src/changelog/', () => {
    expect(CHANGELOG.length).toBeGreaterThanOrEqual(2);
    expect(CHANGELOG[0]).toMatchObject({
      id: '2',
      title: 'Notes panel',
    });
  });

  it('ignores fold group nodes when counting engagement', () => {
    expect(
      getEngagedNodeCount([
        { type: 'group' },
        { type: 'quest' },
        { type: 'group' },
        { type: 'skill' },
      ]),
    ).toBe(2);
  });

  it('does not auto-prompt users with a small graph', () => {
    expect(getUnseenChangelog(undefined, 0)).toEqual([]);
    expect(getUnseenChangelog(undefined, 1)).toEqual([]);
    expect(getUnseenChangelog('1', 1)).toEqual([]);
    expect(hasUnseenChangelog(undefined, 0)).toBe(false);
    expect(shouldBaselineChangelog(undefined, 0)).toBe(true);
    expect(shouldBaselineChangelog(undefined, 2)).toBe(false);
  });

  it('shows latest entry for engaged users without changelog history', () => {
    expect(getUnseenChangelog(undefined, 2)).toEqual([CHANGELOG[0]]);
    expect(hasUnseenChangelog(undefined, 2)).toBe(true);
  });

  it('shows unseen entries for returning engaged users', () => {
    expect(getUnseenChangelog('1', 2)).toEqual([CHANGELOG[0]]);
    expect(hasUnseenChangelog('1', 2)).toBe(true);
  });

  it('shows nothing when already up to date', () => {
    expect(getUnseenChangelog(CHANGELOG[0]!.id, 2)).toEqual([]);
    expect(hasUnseenChangelog(CHANGELOG[0]!.id, 2)).toBe(false);
  });
});
