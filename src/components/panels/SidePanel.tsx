import { useMemo } from 'react';
import { useGraphStore } from '../../store/graph-store';
import {
  getRequiredPrerequisites,
  getDependents,
  getImprovements,
  computeAllStatuses,
} from '../../engine/graph-engine';
import type { DerivedStatus } from '../../engine/types';
import { SkillIcon } from '../SkillIcon';

const STATUS_DOT: Record<DerivedStatus, string> = {
  complete: 'bg-green-400',
  available: 'bg-blue-400',
  blocked: 'bg-gray-500',
};

const STATUS_LABEL: Record<DerivedStatus, string> = {
  complete: 'Complete',
  available: 'Available',
  blocked: 'Blocked',
};

export function SidePanel() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds);
  const selectNodes = useGraphStore.getState().selectNodes;

  const selectedNodes = useMemo(
    () => nodes.filter((n) => selectedNodeIds.includes(n.id)),
    [nodes, selectedNodeIds],
  );

  const node = selectedNodes.length === 1 ? selectedNodes[0] : undefined;

  const statuses = useMemo(() => computeAllStatuses(nodes, edges), [nodes, edges]);

  const prereqIds = useMemo(
    () => (node ? getRequiredPrerequisites(node.id, edges) : []),
    [node, edges],
  );
  const dependentIds = useMemo(() => (node ? getDependents(node.id, edges) : []), [node, edges]);
  const improvementIds = useMemo(
    () => (node ? getImprovements(node.id, edges) : []),
    [node, edges],
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) map.set(n.id, n.title);
    return map;
  }, [nodes]);

  // Multi-selection view
  if (selectedNodes.length > 1) {
    return (
      <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            {selectedNodes.length} selected
          </div>
          <ul className="space-y-1">
            {selectedNodes.map((n) => (
              <li
                key={n.id}
                className="text-sm text-gray-200 px-2 py-1 bg-gray-700/50 rounded flex items-center justify-between"
              >
                <span className="truncate">{n.title}</span>
                {n.complete && <span className="text-green-400 text-xs ml-2">✓</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (!node) return null;

  const status = statuses.get(node.id) ?? 'available';
  const q = node.quantity;
  const progressPct =
    q && q.target > 0 ? Math.min(100, Math.round((q.current / q.target) * 100)) : 0;

  return (
    <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{node.type}</div>
        <div className="text-white text-base font-semibold leading-snug">{node.title}</div>
        <div className="flex items-center gap-1.5 mt-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
          <span className="text-xs text-gray-400">{STATUS_LABEL[status]}</span>
        </div>
      </div>

      {/* Skill data */}
      {node.skillData && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Skill Target</div>
          <div className="flex items-center gap-2 text-sm text-gray-200">
            <SkillIcon skill={node.skillData.skillName} size={18} />
            <span>{node.skillData.skillName}</span>
            <span className="text-gray-500">—</span>
            <span>Level {node.skillData.targetLevel}</span>
          </div>
          {node.skillData.boost ? (
            <div className="text-xs text-blue-400 mt-1">
              Train to {node.skillData.targetLevel - node.skillData.boost} with +
              {node.skillData.boost} boost
            </div>
          ) : null}
        </div>
      )}

      {/* Quantity */}
      {q && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Progress</div>
          <div className="text-sm text-gray-200 mb-2">
            {q.current} / {q.target}
            <span className="text-gray-500 ml-2 text-xs">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${q.current >= q.target ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {node.notes && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Notes</div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{node.notes}</p>
        </div>
      )}

      {/* Tags */}
      {node.tags.length > 0 && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Relationships */}
      <NodeList
        title="Prerequisites"
        ids={prereqIds}
        nodeMap={nodeMap}
        statuses={statuses}
        onSelect={(id) => selectNodes([id])}
      />
      <NodeList
        title="Unlocks"
        ids={dependentIds}
        nodeMap={nodeMap}
        statuses={statuses}
        onSelect={(id) => selectNodes([id])}
      />
      <NodeList
        title="Improvements"
        ids={improvementIds}
        nodeMap={nodeMap}
        statuses={statuses}
        onSelect={(id) => selectNodes([id])}
      />
    </div>
  );
}

function NodeList({
  title,
  ids,
  nodeMap,
  statuses,
  onSelect,
}: {
  title: string;
  ids: string[];
  nodeMap: Map<string, string>;
  statuses: Map<string, DerivedStatus>;
  onSelect: (id: string) => void;
}) {
  if (ids.length === 0) return null;

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{title}</div>
      <ul className="space-y-1">
        {ids.map((id) => {
          const status = statuses.get(id) ?? 'available';
          return (
            <li key={id}>
              <button
                onClick={() => onSelect(id)}
                className="w-full text-left text-sm text-gray-300 hover:text-white flex items-center gap-2 py-0.5"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                <span className="truncate">{nodeMap.get(id) ?? id}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
