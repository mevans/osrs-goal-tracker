const changelogModules = import.meta.glob('./changelog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  content: string;
}

function parseMeta(metaSection: string): Record<string, string> {
  const meta: Record<string, string> = {};

  for (const line of metaSection.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    meta[key] = value;
  }

  return meta;
}

export function parseChangelogEntry(raw: string): ChangelogEntry | undefined {
  const match = raw.trim().match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return undefined;

  const meta = parseMeta(match[1]!);
  const { id, date, title } = meta;
  if (!id || !date || !title) return undefined;

  return {
    id,
    date,
    title,
    content: match[2]!.trim(),
  };
}

/** Newest first. Add a markdown file to `src/changelog/`. */
export const CHANGELOG = Object.values(changelogModules)
  .map(parseChangelogEntry)
  .filter((entry): entry is ChangelogEntry => entry !== undefined)
  .sort((a, b) => Number(b.id) - Number(a.id) || b.id.localeCompare(a.id));

export const LATEST_CHANGELOG_ID = CHANGELOG[0]?.id;

export const CHANGELOG_MIN_NODES = 2;

export function getEngagedNodeCount(nodes: { type: string }[]): number {
  return nodes.filter((node) => node.type !== 'group').length;
}

function isEngagedUser(nodeCount: number): boolean {
  return nodeCount >= CHANGELOG_MIN_NODES;
}

export function getUnseenChangelog(
  lastSeenId: string | undefined,
  nodeCount: number,
): ChangelogEntry[] {
  if (CHANGELOG.length === 0 || !isEngagedUser(nodeCount)) return [];

  if (!lastSeenId) {
    return [CHANGELOG[0]!];
  }

  const lastSeenIndex = CHANGELOG.findIndex((entry) => entry.id === lastSeenId);
  if (lastSeenIndex <= 0) return [];

  return CHANGELOG.slice(0, lastSeenIndex);
}

export function hasUnseenChangelog(lastSeenId: string | undefined, nodeCount: number): boolean {
  return getUnseenChangelog(lastSeenId, nodeCount).length > 0;
}

export function shouldBaselineChangelog(
  lastSeenId: string | undefined,
  nodeCount: number,
): boolean {
  return !lastSeenId && !isEngagedUser(nodeCount) && LATEST_CHANGELOG_ID !== undefined;
}
