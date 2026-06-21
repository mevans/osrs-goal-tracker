import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphEditor } from '../components/GraphEditor';
import { Toolbar } from '../components/toolbar/Toolbar';
import { PlanningDrawer } from '../components/panels/PlanningDrawer';
import { KeyboardHelp } from '../components/KeyboardHelp';
import { ChangelogDialog } from '../components/ChangelogDialog';
import { useAutoSyncPlayer } from '../hooks/useAutoSyncPlayer';
import {
  CHANGELOG,
  getUnseenChangelog,
  getEngagedNodeCount,
  hasUnseenChangelog,
} from '../changelog';
import { useChangelogHydrated, useChangelogStore } from '../store/changelog-store';
import { useGraphStore } from '../store/graph-store';
import type { EdgeType } from '../engine/types';

export function EditorPage() {
  const [edgeMode] = useState<EdgeType>('requires');
  const [manualOpen, setManualOpen] = useState(false);
  const [autoDismissed, setAutoDismissed] = useState(false);
  const hydrated = useChangelogHydrated();
  const lastSeenId = useChangelogStore((s) => s.lastSeenId);
  const nodes = useGraphStore((s) => s.nodes);
  const engagedNodeCount = getEngagedNodeCount(nodes);
  useAutoSyncPlayer();

  const unseenEntries = hydrated ? getUnseenChangelog(lastSeenId, engagedNodeCount) : [];
  const showAutoPrompt = unseenEntries.length > 0 && !autoDismissed;
  const showChangelog = manualOpen || showAutoPrompt;

  const openChangelog = () => setManualOpen(true);

  const closeChangelog = () => {
    if (manualOpen) {
      setManualOpen(false);
      return;
    }
    setAutoDismissed(true);
  };

  return (
    <ReactFlowProvider>
      <KeyboardHelp />
      <div className="h-screen flex flex-col bg-surface-900 text-white">
        <Toolbar
          onOpenChangelog={openChangelog}
          hasUnseenChangelog={
            hydrated && hasUnseenChangelog(lastSeenId, engagedNodeCount) && !autoDismissed
          }
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1">
            <GraphEditor edgeMode={edgeMode} />
          </div>

          {/* Only show side panel for multi-select, otherwise show planning drawer */}
          <PlanningDrawer />
        </div>
      </div>

      {showChangelog && (
        <ChangelogDialog
          entries={manualOpen ? CHANGELOG : unseenEntries}
          markSeenOnClose={!manualOpen}
          onClose={closeChangelog}
        />
      )}
    </ReactFlowProvider>
  );
}
