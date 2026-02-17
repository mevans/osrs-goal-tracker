import { useRef, useState } from 'react';
import { useStore } from 'zustand';
import { useReactFlow } from '@xyflow/react';
import { useGraphStore } from '../../store/graph-store';
import { useUIStore } from '../../store/ui-store';
import { useViewportCenter } from '../GraphEditor';
import { NodeDialog, type NodeFormResult } from '../NodeDialog';
import { ShareDialog } from './ShareDialog';
import { TemplateDialog } from './TemplateDialog';
import { ShortcutHint } from '../Kbd';
import { expandTemplate } from '../../templates/expand';
import { applyLayout } from '../../engine/layout';
import { exportToJson, importFromJson } from '../../engine/serialization';
import type { SoftDecision, TemplateDefinition } from '../../templates/types';

const UndoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </svg>
);

export function Toolbar() {
  const [showAddNode, setShowAddNode] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addNode = useGraphStore.getState().addNode;
  const getCenter = useViewportCenter();
  const { fitView } = useReactFlow();

  // Undo/redo state
  const { undo, redo } = useGraphStore.temporal.getState();
  const canUndo = useStore(useGraphStore.temporal, (state) => state.pastStates.length > 0);
  const canRedo = useStore(useGraphStore.temporal, (state) => state.futureStates.length > 0);
  const setShowHelp = useUIStore.getState().setShowHelp;

  const handleAddNode = (result: NodeFormResult) => {
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

    // Fit view after template expansion with a small delay to ensure rendering
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  };

  const handleTidyLayout = () => {
    const { nodes, edges } = useGraphStore.getState();
    if (nodes.length === 0) return;
    const laidOut = applyLayout(nodes, edges);
    useGraphStore.setState({ nodes: laidOut });

    // Fit view after layout with a small delay to ensure rendering
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  };

  const handleExport = () => {
    const { nodes, edges } = useGraphStore.getState();
    exportToJson({ nodes, edges });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = await importFromJson(file);
    if (data) {
      if (
        window.confirm(
          'Import will replace your current graph. Continue?\n\n(Export first if you want to save your current work)',
        )
      ) {
        useGraphStore.getState().loadGraph(data);
        // Clear undo/redo history after import
        useGraphStore.temporal.getState().clear();

        // Fit view after import with a small delay
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 400 });
        }, 50);
      }
    } else {
      alert('Failed to import file. Please check the file format.');
    }

    // Reset file input so the same file can be re-imported
    event.target.value = '';
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

        <div className="h-6 w-px bg-gray-600" />

        <button
          onClick={() => undo()}
          disabled={!canUndo}
          className="flex items-center gap-1.5 px-2 py-1.5 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
        >
          <UndoIcon />
          <ShortcutHint id="undo" />
        </button>

        <button
          onClick={() => redo()}
          disabled={!canRedo}
          className="flex items-center gap-1.5 px-2 py-1.5 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
        >
          <RedoIcon />
          <ShortcutHint id="redo" />
        </button>

        <button
          onClick={() => setShowHelp(true)}
          title="Keyboard shortcuts (?)"
          className="flex items-center gap-1.5 px-2 py-1.5 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          <span className="text-sm">Keyboard Shortcuts</span>
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
          onClick={handleImport}
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
        >
          Import JSON
        </button>

        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
        >
          Export JSON
        </button>

        <button
          onClick={() => setShowShare(true)}
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
        >
          Share
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        className="hidden"
      />

      {showAddNode && <NodeDialog onSubmit={handleAddNode} onClose={() => setShowAddNode(false)} />}
      {showShare && <ShareDialog onClose={() => setShowShare(false)} />}
      {showTemplate && (
        <TemplateDialog onApply={handleApplyTemplate} onClose={() => setShowTemplate(false)} />
      )}
    </>
  );
}
