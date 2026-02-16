import { useMemo, useState } from 'react';
import { useGraphStore } from '../../store/graph-store';
import {
  getAvailableNodes,
  getBlockedNodes,
  computeBottlenecks,
  getRequiredPrerequisites,
} from '../../engine/graph-engine';
import type { SkillData } from '../../engine/types';
import { SkillIcon } from '../SkillIcon';

type Tab = 'available' | 'blocked' | 'bottlenecks';

export function PlanningDrawer() {
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectNode = useGraphStore.getState().selectNode;

  const available = useMemo(() => getAvailableNodes(nodes, edges), [nodes, edges]);
  const blocked = useMemo(() => getBlockedNodes(nodes, edges), [nodes, edges]);
  const bottlenecks = useMemo(() => computeBottlenecks(nodes, edges, 10), [nodes, edges]);

  // Collect all unique tags from available nodes
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const node of available) {
      for (const tag of node.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }, [available]);

  // Filter available nodes by selected tag
  const filteredAvailable = useMemo(() => {
    if (!selectedTag) return available;
    return available.filter((n) => n.tags.includes(selectedTag));
  }, [available, selectedTag]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      map.set(n.id, n.title);
    }
    return map;
  }, [nodes]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'available', label: 'Available', count: available.length },
    { key: 'blocked', label: 'Blocked', count: blocked.length },
    { key: 'bottlenecks', label: 'Bottlenecks', count: bottlenecks.length },
  ];

  return (
    <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-gray-500">({tab.count})</span>
          </button>
        ))}
      </div>

      {activeTab === 'available' && availableTags.length > 0 && (
        <div className="border-b border-gray-700 p-2">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                selectedTag === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'available' && (
          <NodeItemList
            items={filteredAvailable.map((n) => ({
              id: n.id,
              title: n.title,
              type: n.type,
              skillData: n.skillData,
            }))}
            onSelect={selectNode}
          />
        )}

        {activeTab === 'blocked' && (
          <BlockedList nodes={blocked} edges={edges} nodeMap={nodeMap} onSelect={selectNode} />
        )}

        {activeTab === 'bottlenecks' && (
          <BottleneckList entries={bottlenecks} nodeMap={nodeMap} onSelect={selectNode} />
        )}
      </div>
    </div>
  );
}

function NodeItemList({
  items,
  onSelect,
}: {
  items: { id: string; title: string; type: string; skillData: SkillData | undefined }[];
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return <div className="text-sm text-gray-500 text-center mt-4">No nodes</div>;
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <button
            onClick={() => onSelect(item.id)}
            className="w-full text-left text-sm text-gray-200 hover:text-white hover:bg-gray-700 rounded px-2 py-1.5 flex items-center gap-2"
          >
            <span className="text-[10px] uppercase text-gray-500 w-10 shrink-0">{item.type}</span>
            {item.skillData && <SkillIcon skill={item.skillData.skillName} size={14} />}
            <span className="truncate">{item.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function BlockedList({
  nodes: blockedNodes,
  edges,
  nodeMap,
  onSelect,
}: {
  nodes: { id: string; title: string; type: string }[];
  edges: { id: string; from: string; to: string; type: 'requires' | 'improves' }[];
  nodeMap: Map<string, string>;
  onSelect: (id: string) => void;
}) {
  if (blockedNodes.length === 0) {
    return <div className="text-sm text-gray-500 text-center mt-4">Nothing blocked</div>;
  }

  return (
    <ul className="space-y-2">
      {blockedNodes.map((node) => {
        const blockers = getRequiredPrerequisites(node.id, edges).filter((id) => {
          // Show only incomplete blockers
          return !nodeMap.has(id) || true; // always show — status handled visually
        });
        return (
          <li key={node.id} className="bg-gray-750 rounded px-2 py-1.5">
            <button
              onClick={() => onSelect(node.id)}
              className="w-full text-left text-sm text-gray-200 hover:text-white truncate"
            >
              {node.title}
            </button>
            {blockers.length > 0 && (
              <div className="text-xs text-gray-500 mt-0.5">
                Needs: {blockers.map((id) => nodeMap.get(id) ?? id).join(', ')}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BottleneckList({
  entries,
  nodeMap,
  onSelect,
}: {
  entries: { nodeId: string; blockedCount: number }[];
  nodeMap: Map<string, string>;
  onSelect: (id: string | undefined) => void;
}) {
  if (entries.length === 0) {
    return <div className="text-sm text-gray-500 text-center mt-4">No bottlenecks</div>;
  }

  return (
    <ul className="space-y-1">
      {entries.map((entry) => (
        <li key={entry.nodeId}>
          <button
            onClick={() => onSelect(entry.nodeId)}
            className="w-full text-left text-sm text-gray-200 hover:text-white hover:bg-gray-700 rounded px-2 py-1.5 flex items-center justify-between"
          >
            <span className="truncate">{nodeMap.get(entry.nodeId) ?? entry.nodeId}</span>
            <span className="text-xs text-amber-400 shrink-0 ml-2">
              blocks {entry.blockedCount}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
