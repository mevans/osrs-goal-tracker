import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { toast } from 'sonner';
import { useGraphStore } from '../../store/graph-store';
import { useUIStore } from '../../store/ui-store';
import { useViewportCenter } from '../../hooks/useViewportCenter';
import { NodeDialog, type NodeFormResult } from '../NodeDialog';
import { CompassIcon } from '../CompassIcon';
import { ShareDialog } from './ShareDialog';
import { PreferencesDialog } from './PreferencesDialog';
import { exportToJson, importFromJson } from '../../engine/serialization';
import { analytics } from '../../analytics';

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c.975.005 1.956.132 2.874.374 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

export function Toolbar() {
  const showAddNode = useUIStore((s) => s.showAddNode);
  const setShowAddNode = useUIStore.getState().setShowAddNode;
  const [showShare, setShowShare] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const backupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showBackup) return;
    const handler = (e: MouseEvent) => {
      if (backupRef.current && !backupRef.current.contains(e.target as Node)) {
        setShowBackup(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showBackup]);
  const addNode = useGraphStore.getState().addNode;
  const getCenter = useViewportCenter();
  const { fitView } = useReactFlow();
  const setShowHelp = useUIStore.getState().setShowHelp;

  const handleAddNode = (result: NodeFormResult) => {
    const position = getCenter();
    addNode({ ...result, position });
    analytics.nodeCreated(result.type);
    setShowAddNode(false);
  };

  const handleExport = () => {
    const { nodes, edges } = useGraphStore.getState();
    exportToJson({ nodes, edges });
    analytics.exportJson();
    toast.success('Graph exported');
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
        analytics.importJson();

        // Fit view after import with a small delay
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 400 });
        }, 50);

        toast.success(`Graph imported — ${data.nodes.length} nodes, ${data.edges.length} edges`);
      }
    } else {
      toast.error('Failed to import file. Please check the file format.');
    }

    // Reset file input so the same file can be re-imported
    event.target.value = '';
  };

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-800 border-b border-surface-border">
        <div className="flex items-center gap-2 mr-2">
          <CompassIcon size={44} />
          <span className="text-sm font-semibold text-amber-100 tracking-wide">Planscape</span>
        </div>

        <button
          onClick={() => setShowAddNode(true)}
          className="px-3 py-1.5 text-sm text-white bg-brand hover:bg-brand-bright rounded font-medium"
        >
          + Add
        </button>

        <button
          onClick={() => setShowHelp(true)}
          title="Keyboard shortcuts (?)"
          className="flex items-center gap-1.5 px-2 py-1.5 text-stone-400 hover:text-white bg-surface-700 hover:bg-surface-600 rounded text-sm"
        >
          <span className="text-sm">Keyboard Shortcuts</span>
        </button>

        <div className="flex-1" />

        <a
          href="https://github.com/mevans/osrs-goal-tracker/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm text-stone-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded"
        >
          Feedback
        </a>

        <a
          href="https://github.com/mevans/osrs-goal-tracker"
          target="_blank"
          rel="noopener noreferrer"
          title="View on GitHub"
          className="flex items-center px-2 py-1.5 text-stone-400 hover:text-white bg-surface-700 hover:bg-surface-600 rounded"
        >
          <GitHubIcon />
        </a>

        <div className="h-6 w-px bg-surface-border" />

        <div ref={backupRef} className="relative">
          <button
            onClick={() => setShowBackup((v) => !v)}
            className="px-3 py-1.5 text-sm text-stone-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded"
          >
            Backup
          </button>
          {showBackup && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-surface-800 border border-surface-border rounded shadow-lg z-50 overflow-hidden">
              <button
                onClick={() => {
                  handleExport();
                  setShowBackup(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:text-white hover:bg-surface-700"
              >
                Export JSON
              </button>
              <button
                onClick={() => {
                  handleImport();
                  setShowBackup(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:text-white hover:bg-surface-700"
              >
                Import JSON
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowPreferences(true)}
          className="px-3 py-1.5 text-sm text-stone-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded"
        >
          Preferences
        </button>

        <button
          onClick={() => setShowShare(true)}
          className="px-3 py-1.5 text-sm text-stone-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded"
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
      {showPreferences && <PreferencesDialog onClose={() => setShowPreferences(false)} />}
    </>
  );
}
