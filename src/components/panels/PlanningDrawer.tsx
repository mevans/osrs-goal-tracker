import { useMemo, useState } from 'react';
import { useGraphStore } from '../../store/graph-store';
import {
  getAvailableNodes,
  getBlockedNodes,
  computeBottlenecks,
  computeAllStatuses,
  getRequiredPrerequisites,
} from '../../engine/graph-engine';
import { SkillIcon } from '../SkillIcon';

type StatusFilter = 'available' | 'blocked' | 'bottlenecks';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'available', label: 'Available' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'bottlenecks', label: 'Bottlenecks' },
];

export function PlanningDrawer() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('available');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectNodes = useGraphStore.getState().selectNodes;

  const available = useMemo(() => getAvailableNodes(nodes, edges), [nodes, edges]);
  const blocked = useMemo(() => getBlockedNodes(nodes, edges), [nodes, edges]);
  const bottlenecks = useMemo(() => computeBottlenecks(nodes, edges, 10), [nodes, edges]);
  const statuses = useMemo(() => computeAllStatuses(nodes, edges), [nodes, edges]);

  const bottleneckMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const { nodeId, blockedCount } of bottlenecks) map.set(nodeId, blockedCount);
    return map;
  }, [bottlenecks]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) map.set(n.id, n.title);
    return map;
  }, [nodes]);

  // Base list for the current status filter
  const baseNodes = useMemo(() => {
    if (statusFilter === 'available') return available;
    if (statusFilter === 'blocked') return blocked;
    const ids = new Set(bottlenecks.map((b) => b.nodeId));
    return nodes.filter((n) => ids.has(n.id));
  }, [statusFilter, available, blocked, bottlenecks, nodes]);

  // Tags always collected from all non-complete nodes
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const n of nodes) {
      if (!n.complete) for (const t of n.tags) tags.add(t);
    }
    return [...tags].sort();
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (!selectedTag) return baseNodes;
    return baseNodes.filter((n) => n.tags.includes(selectedTag));
  }, [baseNodes, selectedTag]);

  const counts = {
    available: available.length,
    blocked: blocked.length,
    bottlenecks: bottlenecks.length,
  };

  const toggleStatus = (key: StatusFilter) => setStatusFilter(key);

  return (
    <div className="w-72 bg-surface-800 border-l border-surface-border flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="p-3 border-b border-surface-border space-y-2">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleStatus(key)}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                statusFilter === key
                  ? 'bg-brand text-white'
                  : 'bg-surface-700 text-stone-300 hover:bg-surface-600'
              }`}
            >
              {label}
              <span
                className={`ml-1 ${statusFilter === key ? 'text-brand-text' : 'text-stone-500'}`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                  selectedTag === tag
                    ? 'bg-brand text-white'
                    : 'bg-surface-700 text-stone-400 hover:bg-surface-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredNodes.length === 0 ? (
          <div className="text-sm text-stone-500 text-center mt-6">Nothing to show</div>
        ) : (
          <ul className="space-y-1">
            {filteredNodes.map((node) => {
              const status = statuses.get(node.id) ?? 'available';
              const blockedCount = bottleneckMap.get(node.id);
              const blockers =
                status === 'blocked'
                  ? getRequiredPrerequisites(node.id, edges)
                      .map((id) => nodeMap.get(id))
                      .filter((t): t is string => t !== undefined)
                  : [];

              return (
                <li key={node.id}>
                  <button
                    onClick={() => selectNodes([node.id])}
                    className="w-full text-left rounded px-2 py-1.5 hover:bg-surface-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          status === 'complete'
                            ? 'bg-green-400'
                            : status === 'available'
                              ? 'bg-blue-400'
                              : 'bg-stone-500'
                        }`}
                      />
                      <span className="text-[10px] uppercase text-stone-500 w-9 shrink-0">
                        {node.type}
                      </span>
                      {node.skillData && <SkillIcon skill={node.skillData.skillName} size={13} />}
                      <span className="text-sm text-stone-200 truncate flex-1">{node.title}</span>
                      {blockedCount !== undefined && (
                        <span className="text-[10px] text-amber-400 shrink-0">
                          blocks {blockedCount}
                        </span>
                      )}
                    </div>
                    {blockers.length > 0 && (
                      <div className="text-xs text-stone-500 mt-0.5 ml-[calc(0.375rem+0.75rem+2.25rem)] truncate">
                        Needs: {blockers.join(', ')}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
