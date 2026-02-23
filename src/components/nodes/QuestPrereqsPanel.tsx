import { useMemo } from 'react';
import { toast } from 'sonner';
import { QUEST_DATABASE } from '../../engine/quest-db';
import { useGraphStore } from '../../store/graph-store';
import { usePlayerStore } from '../../store/player-store';
import { SkillIcon } from '../SkillIcon';
import type { SkillName } from '../../engine/types';

interface Props {
  questId: string;
  nodeId: string;
}

export function QuestPrereqsPanel({ questId, nodeId }: Props) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const { addNodeWithEdge, addEdge } = useGraphStore.getState();

  const playerSkills = usePlayerStore((s) => s.skills);

  const entry = QUEST_DATABASE[questId];
  const thisNode = nodes.find((n) => n.id === nodeId);

  // ── Derived state ──────────────────────────────────────────────────────────

  const questPrereqs = useMemo(
    () =>
      (entry?.questReqs ?? []).map((prereqId) => {
        const existingNode = nodes.find(
          (n) => n.type === 'quest' && n.questData?.questId === prereqId,
        );
        const alreadyEdge = existingNode
          ? edges.some((e) => e.from === existingNode.id && e.to === nodeId)
          : false;
        return { prereqId, existingNode: existingNode ?? null, alreadyEdge };
      }),
    [entry?.questReqs, nodes, edges, nodeId],
  );

  const skillPrereqs = useMemo(
    () =>
      (entry?.skillReqs ?? []).map((req) => {
        const existingNode = nodes.find(
          (n) =>
            n.type === 'skill' &&
            n.skillData?.skillName === req.skill &&
            n.skillData.targetLevel >= req.level,
        );
        const alreadyEdge = existingNode
          ? edges.some((e) => e.from === existingNode.id && e.to === nodeId)
          : false;
        const playerLevel = playerSkills[req.skill as SkillName];
        const checkedOff = playerLevel !== undefined && playerLevel >= req.level;
        return { ...req, existingNode: existingNode ?? null, alreadyEdge, checkedOff };
      }),
    [entry?.skillReqs, nodes, edges, nodeId, playerSkills],
  );

  const missingQuests = questPrereqs.filter((p) => !p.existingNode);
  const missingSkills = skillPrereqs.filter((p) => !p.existingNode && !p.checkedOff);
  const totalMissing = missingQuests.length + missingSkills.length;

  if (!entry || (entry.questReqs.length === 0 && entry.skillReqs.length === 0)) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const thisPos = thisNode?.position ?? { x: 0, y: 0 };

  /** Find a free position at the target y, nudging right to avoid existing nodes. */
  function findFreePos(x: number, y: number): { x: number; y: number } {
    let pos = { x, y };
    while (
      nodes.some((n) => Math.abs(n.position.x - pos.x) < 150 && Math.abs(n.position.y - pos.y) < 80)
    ) {
      pos = { x: pos.x + 210, y: pos.y };
    }
    return pos;
  }

  function addQuestNode(prereqId: string, index: number, total: number) {
    const spread = Math.max(total - 1, 0) * 210;
    const baseX = thisPos.x - spread / 2 + index * 210;
    const baseY = thisPos.y - 180;
    const pos = total === 1 ? findFreePos(baseX, baseY) : { x: baseX, y: baseY };
    addNodeWithEdge(
      {
        type: 'quest',
        title: '',
        notes: undefined,
        skillData: undefined,
        questData: { questId: prereqId },
        quantity: undefined,
        tags: undefined,
        position: pos,
      },
      { to: nodeId, type: 'requires' },
    );
  }

  function addSkillNode(skill: string, level: number, index: number, total: number) {
    const spread = Math.max(total - 1, 0) * 210;
    const baseX = thisPos.x - spread / 2 + index * 210;
    const baseY = thisPos.y - 180;
    const pos = total === 1 ? findFreePos(baseX, baseY) : { x: baseX, y: baseY };
    addNodeWithEdge(
      {
        type: 'skill',
        title: '',
        notes: undefined,
        skillData: { skillName: skill as SkillName, targetLevel: level, boost: undefined },
        questData: undefined,
        quantity: undefined,
        tags: undefined,
        position: pos,
      },
      { to: nodeId, type: 'requires' },
    );
  }

  function connectExisting(existingId: string) {
    addEdge(existingId, nodeId, 'requires');
  }

  function addAllMissing() {
    const total = missingQuests.length + missingSkills.length;
    let idx = 0;
    for (const p of missingQuests) {
      addQuestNode(p.prereqId, idx++, total);
    }
    for (const p of missingSkills) {
      addSkillNode(p.skill, p.level, idx++, total);
    }
    toast.success(`Added ${total} prerequisite${total !== 1 ? 's' : ''}`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="bg-surface-800 border border-surface-border rounded-lg shadow-xl p-2.5 w-[220px] max-h-[420px] flex flex-col gap-2"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <a
          href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(questId.replace(/ /g, '_'))}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-brand-text hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Wiki ↗
        </a>
      </div>
      <div
        className="flex flex-col gap-2 overflow-y-auto min-h-0"
        onWheel={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {questPrereqs.length > 0 && (
          <section>
            <div className="text-[9px] uppercase tracking-wider text-stone-500 font-medium mb-1.5">
              Quest Prerequisites
            </div>
            <ul className="space-y-0.5">
              {questPrereqs.map((p) => (
                <PrereqRow
                  key={p.prereqId}
                  label={p.prereqId}
                  inGraph={!!p.existingNode}
                  alreadyEdge={p.alreadyEdge}
                  checkedOff={false}
                  onAdd={() => addQuestNode(p.prereqId, 0, 1)}
                  onConnect={p.existingNode ? () => connectExisting(p.existingNode!.id) : undefined}
                />
              ))}
            </ul>
          </section>
        )}

        {skillPrereqs.length > 0 && (
          <section>
            <div className="text-[9px] uppercase tracking-wider text-stone-500 font-medium mb-1.5">
              Skill Requirements
            </div>
            <ul className="space-y-0.5">
              {skillPrereqs.map((p) => (
                <PrereqRow
                  key={`${p.skill}:${p.level}`}
                  label={`${p.skill} ${p.level}`}
                  boostable={p.boostable}
                  icon={<SkillIcon skill={p.skill as SkillName} size={12} />}
                  inGraph={!!p.existingNode}
                  alreadyEdge={p.alreadyEdge}
                  checkedOff={p.checkedOff}
                  onAdd={() => addSkillNode(p.skill, p.level, 0, 1)}
                  onConnect={p.existingNode ? () => connectExisting(p.existingNode!.id) : undefined}
                />
              ))}
            </ul>
          </section>
        )}
      </div>

      {totalMissing > 1 && (
        <button
          onClick={addAllMissing}
          className="shrink-0 w-full text-xs py-1.5 px-2 rounded bg-brand/20 text-brand-text hover:bg-brand/30 border border-brand/30 font-medium"
        >
          Add all missing ({totalMissing})
        </button>
      )}
    </div>
  );
}

// ── PrereqRow ──────────────────────────────────────────────────────────────

interface RowProps {
  label: string;
  icon?: React.ReactNode;
  boostable?: boolean;
  inGraph: boolean;
  alreadyEdge: boolean;
  checkedOff: boolean;
  onAdd: () => void;
  onConnect: (() => void) | undefined;
}

function PrereqRow({
  label,
  icon,
  boostable,
  inGraph,
  alreadyEdge,
  checkedOff,
  onAdd,
  onConnect,
}: RowProps) {
  return (
    <li className="flex items-center gap-1.5 min-w-0">
      {/* Status dot */}
      <span
        className={`shrink-0 w-2 h-2 rounded-full ${
          inGraph || checkedOff ? 'bg-green-500' : 'bg-surface-600'
        }`}
      />

      {icon && <span className="shrink-0">{icon}</span>}

      <span
        className={`text-xs flex-1 truncate ${
          inGraph || checkedOff ? 'text-stone-400 line-through' : 'text-stone-200'
        }`}
        title={label}
      >
        {label}
      </span>

      {boostable && (
        <span className="shrink-0 text-[9px] text-amber-400" title="Can be boosted">
          (b)
        </span>
      )}

      {/* Actions */}
      {!inGraph && !checkedOff && (
        <button
          onClick={onAdd}
          title="Add as node"
          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-brand/20 text-brand-text hover:bg-brand/30 border border-brand/30"
        >
          +
        </button>
      )}

      {inGraph && !alreadyEdge && (
        <button
          onClick={onConnect}
          title="Connect existing node"
          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-stone-400 hover:bg-surface-600 hover:text-white"
        >
          link
        </button>
      )}
    </li>
  );
}
