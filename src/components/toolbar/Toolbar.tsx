import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReactFlow } from '@xyflow/react';
import { toast } from 'sonner';
import { useGraphStore } from '../../store/graph-store';
import { useUIStore } from '../../store/ui-store';
import { useViewportCenter } from '../../hooks/useViewportCenter';
import { NodeDialog, type NodeFormResult } from '../NodeDialog';
import logoUrl from '../../assets/logo.png';
import { ShareDialog } from './ShareDialog';
import { PlayerProfileDialog } from './PlayerProfileDialog';
import { exportToJson, importFromJson } from '../../engine/serialization';
import { usePlayerStore } from '../../store/player-store';
import { useSyncStore } from '../../store/sync-store';
import { analytics } from '../../analytics';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

const PlayerIcon = () => (
  <Icon>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

const SyncIcon = () => (
  <Icon>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </Icon>
);

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c.975.005 1.956.132 2.874.374 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const menuItemClass =
  'w-full text-left px-3 py-2 text-sm text-stone-300 hover:text-white hover:bg-surface-700';

interface ToolbarProps {
  onOpenChangelog: () => void;
  hasUnseenChangelog: boolean;
}

export function Toolbar({ onOpenChangelog, hasUnseenChangelog }: ToolbarProps) {
  const showAddNode = useUIStore((s) => s.showAddNode);
  const setShowAddNode = useUIStore.getState().setShowAddNode;
  const [showShare, setShowShare] = useState(false);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const playerRsn = usePlayerStore((s) => s.rsn);
  const syncId = useSyncStore((s) => s.syncId);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

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
    const { nodes, edges, notes } = useGraphStore.getState();
    exportToJson({ nodes, edges, notes });
    analytics.exportJson();
    toast.success('Graph exported');
    setShowMenu(false);
  };

  const handleImport = () => {
    setShowMenu(false);
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
        useGraphStore.temporal.getState().clear();
        analytics.importJson();
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 400 });
        }, 50);
        toast.success(`Graph imported — ${data.nodes.length} nodes, ${data.edges.length} edges`);
      }
    } else {
      toast.error('Failed to import file. Please check the file format.');
    }

    event.target.value = '';
  };

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-800 border-b border-surface-border">
        <div className="flex items-center mr-1">
          <img src={logoUrl} alt="Planscape" className="h-9 w-auto max-w-none flex-shrink-0" />
        </div>

        <button
          onClick={() => setShowAddNode(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-brand hover:bg-brand-bright rounded font-medium"
        >
          <PlusIcon />
          Add goal
        </button>

        <button
          onClick={() => setShowPlayerProfile(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-50 bg-emerald-800/90 hover:bg-emerald-700 rounded font-medium"
        >
          <PlayerIcon />
          <span>Link player</span>
          {playerRsn && (
            <span className="text-xs font-normal text-emerald-200/80 truncate max-w-[7rem]">
              {playerRsn}
            </span>
          )}
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-sky-50 bg-sky-800/90 hover:bg-sky-700 rounded font-medium"
        >
          <SyncIcon />
          Sync devices
          {syncId && (
            <span className="h-1.5 w-1.5 rounded-full bg-sky-200" title="This device is linked" />
          )}
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            title="More"
            aria-label="More"
            aria-expanded={showMenu}
            className="relative px-2.5 py-1.5 text-stone-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded"
          >
            <span className="text-lg leading-none">⋯</span>
            {hasUnseenChangelog && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-brand" />
            )}
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-surface-800 border border-surface-border rounded shadow-lg z-50 overflow-hidden py-1">
              <button onClick={handleExport} className={menuItemClass}>
                Export JSON
              </button>
              <button onClick={handleImport} className={menuItemClass}>
                Import JSON
              </button>
              <div className="my-1 h-px bg-surface-border" />
              <button
                onClick={() => {
                  setShowHelp(true);
                  setShowMenu(false);
                }}
                className={menuItemClass}
              >
                Keyboard shortcuts
              </button>
              <button
                onClick={() => {
                  onOpenChangelog();
                  setShowMenu(false);
                }}
                className={`${menuItemClass} relative`}
              >
                Changelog
                {hasUnseenChangelog && (
                  <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-brand align-middle" />
                )}
              </button>
              <a
                href="https://github.com/mevans/osrs-goal-tracker/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className={`${menuItemClass} block`}
                onClick={() => setShowMenu(false)}
              >
                Feedback
              </a>
              <a
                href="https://github.com/mevans/osrs-goal-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className={`${menuItemClass} flex items-center gap-2`}
                onClick={() => setShowMenu(false)}
              >
                <GitHubIcon />
                GitHub
              </a>
            </div>
          )}
        </div>
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
      {showPlayerProfile && <PlayerProfileDialog onClose={() => setShowPlayerProfile(false)} />}
    </>
  );
}
