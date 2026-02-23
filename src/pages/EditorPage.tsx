import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphEditor } from '../components/GraphEditor';
import { Toolbar } from '../components/toolbar/Toolbar';
import { PlanningDrawer } from '../components/panels/PlanningDrawer';
import { KeyboardHelp } from '../components/KeyboardHelp';
import { useAutoSyncPlayer } from '../hooks/useAutoSyncPlayer';
import type { EdgeType } from '../engine/types';

export function EditorPage() {
  const [edgeMode] = useState<EdgeType>('requires');
  useAutoSyncPlayer();

  return (
    <ReactFlowProvider>
      <KeyboardHelp />
      <div className="h-screen flex flex-col bg-surface-900 text-white">
        <Toolbar />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1">
            <GraphEditor edgeMode={edgeMode} />
          </div>

          {/* Only show side panel for multi-select, otherwise show planning drawer */}
          <PlanningDrawer />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
