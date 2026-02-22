/**
 * Generates src/engine/quest-data.json from the OSRS Wiki Bucket API.
 *
 * Fetches all quest entries including skill/quest prerequisites directly from
 * the rendered `requirements` HTML field, which uses data-skill/data-level
 * attributes for structured skill data.
 *
 * Quest IDs are the wiki page names exactly (e.g. "Animal Magnetism").
 * Re-run whenever quest data needs updating:
 *
 *   npx tsx scripts/fetch-quest-reqs.ts
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const API_URL = 'https://oldschool.runescape.wiki/api.php';
const USER_AGENT = 'Planscape/1.0 (OSRS goal tracker; https://github.com/mevans/osrs-goal-tracker)';

const VALID_SKILLS = new Set([
  'Attack',
  'Defence',
  'Strength',
  'Hitpoints',
  'Ranged',
  'Prayer',
  'Magic',
  'Cooking',
  'Woodcutting',
  'Fletching',
  'Fishing',
  'Firemaking',
  'Crafting',
  'Smithing',
  'Mining',
  'Herblore',
  'Agility',
  'Thieving',
  'Slayer',
  'Farming',
  'Runecraft',
  'Hunter',
  'Construction',
  'Sailing',
]);

// Maps wiki difficulty strings to our internal type values.
const DIFFICULTY_MAP: Record<string, string> = {
  Novice: 'novice',
  Intermediate: 'intermediate',
  Experienced: 'experienced',
  Master: 'master',
  Grandmaster: 'grandmaster',
  Special: 'grandmaster',
};

// ── Bucket API ────────────────────────────────────────────────────────────────

interface BucketQuest {
  page_name: string;
  official_difficulty: string | null;
  requirements: string | null;
}

async function fetchQuestList(): Promise<BucketQuest[]> {
  const query = `bucket('quest').select('page_name','official_difficulty','requirements').run()`;
  const url = new URL(API_URL);
  url.searchParams.set('action', 'bucket');
  url.searchParams.set('query', query);
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Bucket API HTTP ${res.status}`);

  const data = (await res.json()) as { bucket?: BucketQuest[]; error?: string };
  if (data.error) throw new Error(`Bucket API error: ${data.error}`);
  return data.bucket ?? [];
}

// ── Requirements parser ───────────────────────────────────────────────────────

interface ReqData {
  skillReqs: { skill: string; level: number; boostable: boolean }[];
  questReqs: string[];
  questPoints: number;
}

/**
 * Parse skill requirements from the rendered HTML requirements field.
 * Skill spans look like:
 *   <span class="scp" data-skill="Mining" data-level="40" ...>...</span>
 *   <sup ...>[<span title="This requirement is not boostable">not boostable</span>]</sup>
 */
function parseSkillReqs(html: string): ReqData['skillReqs'] {
  const skillReqs: ReqData['skillReqs'] = [];

  // Match each scp span and the boostable sup that follows it
  const scpRe =
    /<span[^>]*class="scp"[^>]*data-skill="([^"]+)"[^>]*data-level="(\d+)"[^>]*>.*?<\/span>\s*(<sup[^>]*>.*?<\/sup>)?/gs;
  let m: RegExpExecArray | null;

  while ((m = scpRe.exec(html)) !== null) {
    const skill = m[1]!;
    const level = parseInt(m[2]!, 10);
    const supText = m[3] ?? '';

    if (!VALID_SKILLS.has(skill)) continue;
    if (skill === 'Quest point' || skill === 'Quest points') continue;

    // Boostable if the sup does NOT say "not boostable" (and isn't "unknown")
    const notBoostable = supText.includes('not boostable') || supText.includes('unknown');
    skillReqs.push({ skill, level, boostable: !notBoostable });
  }

  return skillReqs;
}

/**
 * Parse quest point requirement from the requirements HTML.
 * Quest point spans use data-skill="Quest point".
 */
function parseQuestPointReq(html: string): number {
  const m = /data-skill="Quest point[s]?"[^>]*data-level="(\d+)"/.exec(html);
  return m ? parseInt(m[1]!, 10) : 0;
}

/**
 * Extract quest prereq names from the requirements HTML.
 * Wiki links look like [[Page Name]] or [[Page Name|Display text]].
 * We extract the page name portion and check it against known quest names.
 */
function parseQuestReqs(html: string, validNames: Set<string>): string[] {
  const questReqs: string[] = [];
  const linkRe = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
  let m: RegExpExecArray | null;

  while ((m = linkRe.exec(html)) !== null) {
    const name = m[1]!.trim();
    if (validNames.has(name)) questReqs.push(name);
  }

  // Deduplicate while preserving order
  return [...new Set(questReqs)];
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuestDataEntry {
  name: string;
  difficulty: 'novice' | 'intermediate' | 'experienced' | 'master' | 'grandmaster';
  members: boolean;
  skillReqs: { skill: string; level: number; boostable: boolean }[];
  questReqs: string[];
  questPoints: number;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching quest list from bucket API...');
  const questList = await fetchQuestList();
  console.log(`  ${questList.length} total entries from bucket`);

  // Deduplicate (the RFD "Full guide" meta-page appears multiple times) and
  // exclude it — include everything else regardless of difficulty.
  const seen = new Set<string>();
  const quests = questList.filter((q) => {
    if (seen.has(q.page_name)) return false;
    seen.add(q.page_name);
    return !q.page_name.endsWith('/Full guide');
  });
  console.log(`  ${quests.length} quests/subquests after filtering`);

  // Build set of valid quest names for cross-referencing prereqs
  const validNames = new Set(quests.map((q) => q.page_name));

  const output: Record<string, QuestDataEntry> = {};

  for (const q of quests) {
    const difficulty = (DIFFICULTY_MAP[q.official_difficulty ?? ''] ??
      'novice') as QuestDataEntry['difficulty'];
    const html = q.requirements ?? '';

    output[q.page_name] = {
      name: q.page_name,
      difficulty,
      members: true,
      skillReqs: parseSkillReqs(html),
      questReqs: parseQuestReqs(html, validNames),
      questPoints: parseQuestPointReq(html),
    };
  }

  const outputPath = join(ROOT, 'src/engine/quest-data.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  const all = Object.values(output);
  const withSkills = all.filter((q) => q.skillReqs.length > 0).length;
  const withQuests = all.filter((q) => q.questReqs.length > 0).length;
  const withQP = all.filter((q) => q.questPoints > 0).length;
  const withBoostable = all.filter((q) => q.skillReqs.some((s) => s.boostable)).length;

  console.log(`\nWrote src/engine/quest-data.json`);
  console.log(`  ${all.length} quests`);
  console.log(
    `  ${withSkills} with skill reqs · ${withQuests} with quest prereqs · ${withQP} with QP reqs · ${withBoostable} with boostable reqs`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
