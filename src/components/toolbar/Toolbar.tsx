import { useRef, useState } from 'react';
import { useStore } from 'zustand';
import { useReactFlow } from '@xyflow/react';
import { useGraphStore } from '../../store/graph-store';
import { useUIStore } from '../../store/ui-store';
import { useViewportCenter } from '../../hooks/useViewportCenter';
import { NodeDialog, type NodeFormResult } from '../NodeDialog';
import { ShareDialog } from './ShareDialog';
import { ShortcutHint } from '../Kbd';
import { applyLayout } from '../../engine/layout';
import { exportToJson, importFromJson } from '../../engine/serialization';

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c.975.005 1.956.132 2.874.374 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

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
  const showAddNode = useUIStore((s) => s.showAddNode);
  const setShowAddNode = useUIStore.getState().setShowAddNode;
  const [showShare, setShowShare] = useState(false);
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
          + Add
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

        <a
          href="https://github.com/mevans/osrs-goal-tracker/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
        >
          Feedback
        </a>

        <a
          href="https://github.com/mevans/osrs-goal-tracker"
          target="_blank"
          rel="noopener noreferrer"
          title="View on GitHub"
          className="flex items-center px-2 py-1.5 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
        >
          <GitHubIcon />
        </a>

        <div className="h-6 w-px bg-gray-600" />

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
    </>
  );
}
