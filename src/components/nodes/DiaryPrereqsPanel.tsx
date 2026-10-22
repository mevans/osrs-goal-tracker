import { useMemo } from 'react';
import { toast } from 'sonner';
import { getDiary, getDiaryName, previousDiaryId } from '../../engine/diary-db';
import { SkillIcon } from '../SkillIcon';
import type { EdgeType, GraphEdge, GraphNode, SkillName } from '../../engine/types';
import type { AddNodeParams } from '../../store/graph-store';

interface Props {
  diaryId: string;
  nodeId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  playerSkills: Partial<Record<SkillName, number>>;
  onAddNodeWithEdge: (
    params: AddNodeParams,
    edge: { to: string; type: EdgeType } | { from: string; type: EdgeType },
  ) => string;
  onAddEdge: (from: string, to: string, type: EdgeType) => string;
}

export function DiaryPrereqsPanel({
  diaryId,
  nodeId,
  nodes,
  edges,
  playerSkills,
  onAddNodeWithEdge,
  onAddEdge,
}: Props) {
  const entry = getDiary(diaryId);
  const thisNode = nodes.find((n) => n.id === nodeId);
  const priorId = previousDiaryId(diaryId);

  const prior = useMemo(() => {
    if (!priorId) return null;
    const existingNode = nodes.find((n) => n.type === 'diary' && n.diaryData?.diaryId === priorId);
    const alreadyEdge = existingNode
      ? edges.some((e) => e.from === existingNode.id && e.to === nodeId)
      : false;
    return { priorId, existingNode: existingNode ?? null, alreadyEdge };
  }, [priorId, nodes, edges, nodeId]);

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

  if (!entry) return null;
  if (!prior && questPrereqs.length === 0 && skillPrereqs.length === 0) return null;

  const missingPrior = prior && !prior.existingNode ? 1 : 0;
  const missingQuests = questPrereqs.filter((p) => !p.existingNode);
  const missingSkills = skillPrereqs.filter((p) => !p.existingNode && !p.checkedOff);
  const totalMissing = missingPrior + missingQuests.length + missingSkills.length;

  const thisPos = thisNode?.position ?? { x: 0, y: 0 };

  function findFreePos(x: number, y: number): { x: number; y: number } {
    let pos = { x, y };
    while (
      nodes.some((n) => Math.abs(n.position.x - pos.x) < 150 && Math.abs(n.position.y - pos.y) < 80)
    ) {
      pos = { x: pos.x + 210, y: pos.y };
    }
    return pos;
  }

  function place(index: number, total: number) {
    const spread = Math.max(total - 1, 0) * 210;
    const baseX = thisPos.x - spread / 2 + index * 210;
    const baseY = thisPos.y - 180;
    return total === 1 ? findFreePos(baseX, baseY) : { x: baseX, y: baseY };
  }

  function addDiaryNode(id: string, index: number, total: number) {
    onAddNodeWithEdge(
      {
        type: 'diary',
        title: getDiaryName(id),
        notes: undefined,
        skillData: undefined,
        questData: undefined,
        bossData: undefined,
        itemData: undefined,
        diaryData: { diaryId: id, completed: [] },
        quantity: undefined,
        tags: undefined,
        position: place(index, total),
      },
      { to: nodeId, type: 'requires' },
    );
  }

  function addQuestNode(prereqId: string, index: number, total: number) {
    onAddNodeWithEdge(
      {
        type: 'quest',
        title: '',
        notes: undefined,
        skillData: undefined,
        questData: { questId: prereqId },
        bossData: undefined,
        itemData: undefined,
        diaryData: undefined,
        quantity: undefined,
        tags: undefined,
        position: place(index, total),
      },
      { to: nodeId, type: 'requires' },
    );
  }

  function addSkillNode(skill: string, level: number, index: number, total: number) {
    onAddNodeWithEdge(
      {
        type: 'skill',
        title: '',
        notes: undefined,
        skillData: { skillName: skill as SkillName, targetLevel: level, boost: undefined },
        questData: undefined,
        bossData: undefined,
        itemData: undefined,
        diaryData: undefined,
        quantity: undefined,
        tags: undefined,
        position: place(index, total),
      },
      { to: nodeId, type: 'requires' },
    );
  }

  function connectExisting(existingId: string) {
    onAddEdge(existingId, nodeId, 'requires');
  }

  function addAllMissing() {
    const total = totalMissing;
    let idx = 0;
    if (prior && !prior.existingNode) addDiaryNode(prior.priorId, idx++, total);
    for (const p of missingQuests) addQuestNode(p.prereqId, idx++, total);
    for (const p of missingSkills) addSkillNode(p.skill, p.level, idx++, total);
    toast.success(`Added ${total} prerequisite${total !== 1 ? 's' : ''}`);
  }

  return (
    <div
      className="nowheel w-full flex flex-col gap-2"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <a
        href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(entry.area.replace(/ /g, '_'))}_Diary#${entry.tier.charAt(0).toUpperCase()}${entry.tier.slice(1)}`}
        target="_blank"
        rel="noreferrer"
        className="text-[10px] text-brand-text hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        Wiki ↗
      </a>
      <div
        className="flex flex-col gap-2 overflow-y-auto min-h-0"
        onWheel={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {prior && (
          <section>
            <div className="text-[9px] uppercase tracking-wider text-stone-500 font-medium mb-1.5">
              Previous tier
            </div>
            <PrereqRow
              label={getDiaryName(prior.priorId)}
              inGraph={!!prior.existingNode}
              alreadyEdge={prior.alreadyEdge}
              checkedOff={false}
              onAdd={() => addDiaryNode(prior.priorId, 0, 1)}
              onConnect={
                prior.existingNode ? () => connectExisting(prior.existingNode!.id) : undefined
              }
            />
          </section>
        )}
        {questPrereqs.length > 0 && (
          <section>
            <div className="text-[9px] uppercase tracking-wider text-stone-500 font-medium mb-1.5">
              Quest prerequisites
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
              Skill requirements
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

function PrereqRow({
  label,
  icon,
  boostable,
  inGraph,
  alreadyEdge,
  checkedOff,
  onAdd,
  onConnect,
}: {
  label: string;
  icon?: React.ReactNode;
  boostable?: boolean;
  inGraph: boolean;
  alreadyEdge: boolean;
  checkedOff: boolean;
  onAdd: () => void;
  onConnect: (() => void) | undefined;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
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
    </div>
  );
}
