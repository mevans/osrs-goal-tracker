import { useMemo, useState } from 'react';
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

export function SidePanel() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds);
  const {
    toggleNodeComplete,
    removeNode,
    selectNodes,
    updateNode,
    addTagToNode,
    removeTagFromNode,
  } = useGraphStore.getState();

  const [newTag, setNewTag] = useState('');

  const selectedNodes = useMemo(
    () => nodes.filter((n) => selectedNodeIds.includes(n.id)),
    [nodes, selectedNodeIds],
  );
  // TODO: Single node detail view - could enhance to show common fields for multi-selection
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
    for (const n of nodes) {
      map.set(n.id, n.title);
    }
    return map;
  }, [nodes]);

  // Multi-selection view
  if (selectedNodes.length > 1) {
    return (
      <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            {selectedNodes.length} nodes selected
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

  // Single node view
  if (!node) return null;

  const status = statuses.get(node.id) ?? 'available';

  return (
    <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide text-gray-400">{node.type}</span>
          <button
            onClick={() => removeNode(node.id)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>

        <input
          className="w-full bg-gray-700 text-white text-lg font-semibold rounded px-2 py-1 border border-gray-600 focus:border-blue-400 focus:outline-none"
          value={node.title}
          onChange={(e) => updateNode(node.id, { title: e.target.value })}
        />

        <div className="flex items-center gap-2 mt-3">
          <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
          <span className="text-sm text-gray-300 capitalize">{status}</span>
        </div>

        <button
          onClick={() => toggleNodeComplete(node.id)}
          className={`mt-3 w-full text-sm py-1.5 rounded font-medium ${
            node.complete
              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              : 'bg-green-600 text-white hover:bg-green-500'
          }`}
        >
          {node.complete ? 'Mark Incomplete' : 'Mark Complete'}
        </button>
      </div>

      {node.skillData && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Skill Target</div>
          <div className="text-sm text-gray-200 flex items-center gap-1.5">
            <SkillIcon skill={node.skillData.skillName} size={18} />
            {node.skillData.skillName} — Level {node.skillData.targetLevel}
            {node.skillData.boost ? (
              <span className="text-blue-400 ml-1">
                (train to {node.skillData.targetLevel - node.skillData.boost} +{' '}
                {node.skillData.boost} boost)
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="text-xs text-gray-400">Boost</label>
            <input
              type="number"
              min={0}
              max={25}
              className="w-16 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:border-blue-400 focus:outline-none"
              value={node.skillData.boost ?? 0}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                updateNode(node.id, {
                  skillData: { ...node.skillData!, boost: val || undefined },
                });
              }}
            />
          </div>
        </div>
      )}

      {(node.type === 'goal' || node.type === 'task') && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Quantity</div>
          {node.quantity ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    const cur = node.quantity!.current;
                    if (cur > 0)
                      updateNode(node.id, { quantity: { ...node.quantity!, current: cur - 1 } });
                  }}
                  className="w-7 h-7 text-sm font-bold rounded bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  max={node.quantity.target}
                  className="w-16 bg-gray-700 text-white text-sm text-center rounded px-2 py-1 border border-gray-600 focus:border-blue-400 focus:outline-none"
                  value={node.quantity.current}
                  onChange={(e) => {
                    const val = Math.max(
                      0,
                      Math.min(node.quantity!.target, Number(e.target.value) || 0),
                    );
                    updateNode(node.id, { quantity: { ...node.quantity!, current: val } });
                  }}
                />
                <button
                  onClick={() => {
                    const cur = node.quantity!.current;
                    if (cur < node.quantity!.target)
                      updateNode(node.id, { quantity: { ...node.quantity!, current: cur + 1 } });
                  }}
                  className="w-7 h-7 text-sm font-bold rounded bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  +
                </button>
                <span className="text-sm text-gray-400">/ {node.quantity.target}</span>
              </div>
              <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    node.quantity.current >= node.quantity.target ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((node.quantity.current / node.quantity.target) * 100))}%`,
                  }}
                />
              </div>
              <button
                onClick={() => updateNode(node.id, { quantity: undefined })}
                className="text-xs text-gray-500 hover:text-gray-300 mt-1.5"
              >
                Remove quantity tracking
              </button>
            </>
          ) : (
            <button
              onClick={() => updateNode(node.id, { quantity: { target: 1, current: 0 } })}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add quantity tracking
            </button>
          )}
        </div>
      )}

      <div className="p-4 border-b border-gray-700">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Notes</div>
        <textarea
          className="w-full bg-gray-700 text-sm text-gray-200 rounded px-2 py-1 border border-gray-600 focus:border-blue-400 focus:outline-none resize-y min-h-[60px]"
          value={node.notes ?? ''}
          placeholder="Add notes..."
          onChange={(e) => updateNode(node.id, { notes: e.target.value || undefined })}
        />
      </div>

      <div className="p-4 border-b border-gray-700">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Tags</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {node.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-blue-600/30 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-500/30"
            >
              {tag}
              <button
                onClick={() => removeTagFromNode(node.id, tag)}
                className="hover:text-blue-100"
                title="Remove tag"
              >
                ×
              </button>
            </span>
          ))}
          {node.tags.length === 0 && <span className="text-xs text-gray-500">No tags</span>}
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            className="flex-1 bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:border-blue-400 focus:outline-none"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTag.trim()) {
                addTagToNode(node.id, newTag.trim());
                setNewTag('');
              }
            }}
            placeholder="Add tag..."
          />
          <button
            onClick={() => {
              if (newTag.trim()) {
                addTagToNode(node.id, newTag.trim());
                setNewTag('');
              }
            }}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newTag.trim()}
          >
            Add
          </button>
        </div>
      </div>

      <NodeList
        title="Prerequisites"
        ids={prereqIds}
        nodeMap={nodeMap}
        statuses={statuses}
        onSelect={(id) => selectNodes([id])}
      />
      <NodeList
        title="Dependents"
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
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">{title}</div>
      <ul className="space-y-1">
        {ids.map((id) => {
          const status = statuses.get(id) ?? 'available';
          return (
            <li key={id}>
              <button
                onClick={() => onSelect(id)}
                className="w-full text-left text-sm text-gray-200 hover:text-white flex items-center gap-2 py-0.5"
              >
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]} shrink-0`} />
                <span className="truncate">{nodeMap.get(id) ?? id}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
