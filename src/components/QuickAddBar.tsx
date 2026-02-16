import { useMemo } from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import type { GraphNode } from '../engine/types';
import { getSuggestions } from '../engine/suggestions';
import { useGraphStore } from '../store/graph-store';
import { SkillIcon } from './SkillIcon';

interface QuickAddBarProps {
  selectedNode: GraphNode;
  existingTitles: Set<string>;
  onClose: () => void;
}

export function QuickAddBar({ selectedNode, existingTitles, onClose }: QuickAddBarProps) {
  const { flowToScreenPosition, getNode } = useReactFlow();
  const viewport = useViewport(); // Subscribe to viewport changes for reactivity
  const addNode = useGraphStore.getState().addNode;
  const addEdge = useGraphStore.getState().addEdge;

  const suggestions = useMemo(
    () => getSuggestions(selectedNode, existingTitles),
    [selectedNode, existingTitles],
  );

  // Force re-render on viewport changes (zoom/pan)
  void viewport;

  if (suggestions.length === 0) return null;

  // Get the actual rendered node to access its measured dimensions
  const rfNode = getNode(selectedNode.id);
  const nodeWidth = rfNode?.measured?.width ?? 170; // Fallback if not measured yet
  const nodeHeight = rfNode?.measured?.height ?? 40; // Fallback if not measured yet

  // Convert node position to screen coordinates (updates with pan/zoom)
  // Position centered horizontally and just above the node (prerequisites flow from above)
  const nodeScreenPos = flowToScreenPosition({
    x: selectedNode.position.x + nodeWidth / 2, // Center of node
    y: selectedNode.position.y - nodeHeight - 20,
  });

  const barX = nodeScreenPos.x;
  const barY = nodeScreenPos.y;

  const handleSuggestionClick = (index: number) => {
    const suggestion = suggestions[index];
    if (!suggestion) return;

    // Create new node positioned above and spread horizontally
    const newNodePosition = {
      x: selectedNode.position.x + (index - (suggestions.length - 1) / 2) * 220,
      y: selectedNode.position.y - 150,
    };

    const newNodeId = addNode({
      type: suggestion.type,
      title: suggestion.title,
      position: newNodePosition,
      notes: suggestion.notes ?? undefined,
      skillData: suggestion.skillData ?? undefined,
      questData: suggestion.type === 'quest' ? { questId: '' } : undefined,
      quantity: suggestion.quantity ?? undefined,
    });

    // Create edge pointing FROM suggestion TO selected node
    // Both "requires" and "improves" point TO the thing being helped/required
    addEdge(newNodeId, selectedNode.id, suggestion.edgeType);
  };

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{
        left: `${barX}px`,
        top: `${barY}px`,
        transform: 'translate(-50%, -100%)', // Center horizontally, shift up by own height
      }}
    >
      <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl px-3 py-2 min-w-[200px] max-w-[600px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide text-gray-400 font-medium">
            Quick Add
          </span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xs"
            title="Close suggestions"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(index)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600 hover:border-blue-500 transition-colors"
              title={suggestion.notes ?? undefined}
            >
              {suggestion.skillData && (
                <SkillIcon skill={suggestion.skillData.skillName} size={14} />
              )}
              <span className="truncate max-w-[140px]">{suggestion.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
