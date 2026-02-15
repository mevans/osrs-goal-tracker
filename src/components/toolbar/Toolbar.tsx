import { useState } from 'react';
import { useGraphStore } from '../../store/graph-store';
import { useViewportCenter } from '../GraphEditor';
import { AddNodeDialog, type AddNodeResult } from './AddNodeDialog';
import { ShareDialog } from './ShareDialog';
import { TemplateDialog } from './TemplateDialog';
import { expandTemplate } from '../../templates/expand';
import { applyLayout } from '../../engine/layout';
import type { TemplateDefinition, SoftDecision } from '../../templates/types';

export function Toolbar() {
  const [showAddNode, setShowAddNode] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const addNode = useGraphStore.getState().addNode;
  const getCenter = useViewportCenter();

  const handleAddNode = (result: AddNodeResult) => {
    const position = getCenter();
    addNode({ ...result, position });
    setShowAddNode(false);
  };

  const handleApplyTemplate = (
    template: TemplateDefinition,
    decisions: Map<string, SoftDecision>,
  ) => {
    const { nodes, edges } = useGraphStore.getState();
    const result = expandTemplate(template, decisions, nodes, edges);

    const store = useGraphStore.getState();

    // Add new nodes
    for (const node of result.nodesToAdd) {
      store.mergeGraph({ nodes: [node], edges: [] });
    }

    // Update existing nodes (e.g. skill level bumps)
    for (const update of result.nodesToUpdate) {
      store.updateNode(update.id, update.updates);
    }

    // Add new edges
    if (result.edgesToAdd.length > 0) {
      store.mergeGraph({ nodes: [], edges: result.edgesToAdd });
    }

    setShowTemplate(false);
  };

  const handleTidyLayout = () => {
    const { nodes, edges } = useGraphStore.getState();
    if (nodes.length === 0) return;
    const laidOut = applyLayout(nodes, edges);
    useGraphStore.setState({ nodes: laidOut });
  };

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-semibold text-white mr-2">OSRS Planner</span>

        <button
          onClick={() => setShowAddNode(true)}
          className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded font-medium"
        >
          + Add Node
        </button>

        <button
          onClick={() => setShowTemplate(true)}
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
        >
          Templates
        </button>

        <button
          onClick={handleTidyLayout}
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
        >
          Tidy Layout
        </button>

        <div className="flex-1" />

        <button
          onClick={() => {
            if (window.confirm('Clear the entire canvas?')) useGraphStore.getState().clearGraph();
          }}
          className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 bg-gray-700 hover:bg-gray-600 rounded"
        >
          Clear All
        </button>

        <button
          onClick={() => setShowShare(true)}
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
        >
          Share
        </button>
      </div>

      {showAddNode && (
        <AddNodeDialog onSubmit={handleAddNode} onClose={() => setShowAddNode(false)} />
      )}
      {showShare && <ShareDialog onClose={() => setShowShare(false)} />}
      {showTemplate && (
        <TemplateDialog onApply={handleApplyTemplate} onClose={() => setShowTemplate(false)} />
      )}
    </>
  );
}
