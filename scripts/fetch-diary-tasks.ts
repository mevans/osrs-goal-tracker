/**
 * Generates src/engine/diary-data.json from Achievement Diary wiki pages.
 *
 *   npx tsx scripts/fetch-diary-tasks.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const API_URL = 'https://oldschool.runescape.wiki/api.php';
const USER_AGENT = 'Planscape/1.0 (OSRS goal tracker; https://planscape.studio)';

const TIERS = ['easy', 'medium', 'hard', 'elite'] as const;

const SKILLS = new Set([
  'Attack',
  'Strength',
  'Defence',
  'Ranged',
  'Prayer',
  'Magic',
  'Runecraft',
  'Hitpoints',
  'Crafting',
  'Mining',
  'Smithing',
  'Fishing',
  'Cooking',
  'Firemaking',
  'Woodcutting',
  'Agility',
  'Herblore',
  'Thieving',
  'Fletching',
  'Slayer',
  'Farming',
  'Construction',
  'Hunter',
  'Sailing',
]);

const SKILL_ALIASES: Record<string, string> = {
  Runecrafting: 'Runecraft',
  Defense: 'Defence',
  Ranged: 'Ranged',
  HP: 'Hitpoints',
  Constitution: 'Hitpoints',
};

const WIKI_REDIRECTS: Record<string, string> = {
  "Another Cook's Quest": "Recipe for Disaster/Another Cook's Quest",
};

interface SkillReq {
  skill: string;
  level: number;
  boostable: boolean;
}

interface DiaryTask {
  text: string;
  skillReqs: SkillReq[];
  questReqs: string[];
}

interface DiaryEntry {
  id: string;
  area: string;
  tier: (typeof TIERS)[number];
  name: string;
  tasks: DiaryTask[];
  skillReqs: SkillReq[];
  questReqs: string[];
}

const questNames = new Set(
  Object.keys(JSON.parse(readFileSync(join(ROOT, 'src/engine/quest-data.json'), 'utf8')) as object),
);

async function wiki(params: Record<string, string>): Promise<unknown> {
  const url = new URL(API_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wiki ${res.status} ${url}`);
  return res.json();
}

async function diaryPages(): Promise<string[]> {
  const titles: string[] = [];
  let cont: string | undefined;
  do {
    const params: Record<string, string> = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: 'Category:Achievement diaries',
      cmlimit: '500',
      format: 'json',
    };
    if (cont) params['cmcontinue'] = cont;
    const data = (await wiki(params)) as {
      continue?: { cmcontinue: string };
      query: { categorymembers: { title: string }[] };
    };
    for (const member of data.query.categorymembers) {
      if (member.title.endsWith(' Diary') && member.title !== 'Achievement Diary') {
        titles.push(member.title);
      }
    }
    cont = data.continue?.cmcontinue;
  } while (cont);
  return titles.sort();
}

async function wikitext(page: string): Promise<string> {
  const data = (await wiki({
    action: 'parse',
    page,
    prop: 'wikitext',
    format: 'json',
  })) as { parse: { wikitext: { '*': string } } };
  return data.parse.wikitext['*'];
}

function resolveQuest(name: string): string | undefined {
  const redirected = WIKI_REDIRECTS[name] ?? name;
  if (questNames.has(redirected)) return redirected;
  return undefined;
}

function plainText(raw: string): string {
  const withoutNotes = raw.replace(/''Note:[\s\S]*?''/g, ' ');
  return withoutNotes
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^/]*\/>/gi, '')
    .replace(/\{\{sic\|[^}]*\}\}/gi, '')
    .replace(/\{\{sic\}\}/gi, '')
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''([^']+)'''/g, '$1')
    .replace(/''([\s\S]*?)''/g, '$1')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*Note:.*$/, '')
    .trim();
}

function parseReqs(raw: string): { skillReqs: SkillReq[]; questReqs: string[] } {
  const boostable = !/cannot be boosted|can't be boosted|unboostable/i.test(raw);
  const skillReqs: SkillReq[] = [];
  for (const match of raw.matchAll(/\{\{SCP\|([A-Za-z ]+)\|(\d+)/g)) {
    const skill = SKILL_ALIASES[match[1]!] ?? match[1]!;
    if (!SKILLS.has(skill)) continue;
    const level = Number(match[2]);
    const existing = skillReqs.find((req) => req.skill === skill);
    if (!existing || level > existing.level) {
      if (existing) skillReqs.splice(skillReqs.indexOf(existing), 1);
      skillReqs.push({ skill, level, boostable });
    } else if (!boostable) {
      existing.boostable = false;
    }
  }

  const questReqs: string[] = [];
  for (const match of raw.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)) {
    const quest = resolveQuest(match[1]!.trim());
    if (quest && !questReqs.includes(quest)) questReqs.push(quest);
  }
  return { skillReqs, questReqs };
}

function parseTier(section: string): DiaryTask[] {
  const tasks: DiaryTask[] = [];
  let textLines: string[] = [];
  let reqLines: string[] = [];
  let phase: 'idle' | 'text' | 'reqs' = 'idle';

  const flush = () => {
    if (textLines.length === 0) return;
    let text = plainText(textLines.join(' ')).replace(/^\d+\.\s*/, '');
    const noteAt = text.search(/ Note:/);
    if (noteAt !== -1) text = text.slice(0, noteAt).trim();
    const reqRaw = reqLines.join('\n');
    if (text) tasks.push({ text, ...parseReqs(reqRaw) });
    textLines = [];
    reqLines = [];
    phase = 'idle';
  };

  for (const line of section.split('\n')) {
    if (line.startsWith('===') || line.startsWith('==')) {
      flush();
      break;
    }
    if (line.startsWith('|-')) {
      flush();
      continue;
    }
    if (line.trim() === '|') {
      phase = 'reqs';
      continue;
    }
    const taskStart = line.match(/^\|\s*(\d+)\.\s*(.*)$/);
    if (taskStart) {
      flush();
      phase = 'text';
      textLines = [`${taskStart[1]}. ${taskStart[2]}`];
      continue;
    }
    if (phase === 'idle') continue;
    if (line === '|') {
      phase = 'reqs';
      continue;
    }
    if (
      phase === 'text' &&
      (line.startsWith('|*') || line.startsWith('|{{') || line.startsWith('|[['))
    ) {
      phase = 'reqs';
      reqLines.push(line.slice(1));
      continue;
    }
    if (phase === 'text') textLines.push(line.replace(/^\|/, ''));
    else reqLines.push(line.replace(/^\|/, ''));
  }
  flush();
  return tasks;
}

function parsePage(area: string, text: string): DiaryEntry[] {
  const entries: DiaryEntry[] = [];
  for (const tier of TIERS) {
    const header = tier[0]!.toUpperCase() + tier.slice(1);
    const marker = `==${header}==`;
    const start = text.indexOf(marker);
    if (start === -1) continue;
    const section = text.slice(start + marker.length);
    const tasks = parseTier(section);
    if (tasks.length === 0) continue;

    const skillReqs: SkillReq[] = [];
    const questReqs: string[] = [];
    for (const task of tasks) {
      for (const req of task.skillReqs) {
        const existing = skillReqs.find((item) => item.skill === req.skill);
        if (!existing || req.level > existing.level) {
          if (existing) skillReqs.splice(skillReqs.indexOf(existing), 1);
          skillReqs.push({ ...req });
        } else if (!req.boostable) {
          existing.boostable = false;
        }
      }
      for (const quest of task.questReqs) {
        if (!questReqs.includes(quest)) questReqs.push(quest);
      }
    }
    skillReqs.sort((a, b) => a.skill.localeCompare(b.skill));
    questReqs.sort((a, b) => a.localeCompare(b));

    const id = `${area}|${tier}`;
    entries.push({
      id,
      area,
      tier,
      name: `${area} ${header}`,
      tasks,
      skillReqs,
      questReqs,
    });
  }
  return entries;
}

const pages = await diaryPages();
const database: Record<string, DiaryEntry> = {};
for (const page of pages) {
  const area = page.replace(/ Diary$/, '');
  const entries = parsePage(area, await wikitext(page));
  console.log(`${page}: ${entries.map((e) => `${e.tier} ${e.tasks.length}`).join(', ')}`);
  for (const entry of entries) database[entry.id] = entry;
}

writeFileSync(join(ROOT, 'src/engine/diary-data.json'), JSON.stringify(database, null, 2) + '\n');
console.log(`wrote ${Object.keys(database).length} diaries`);
