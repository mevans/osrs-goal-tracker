import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphEditor } from '../components/GraphEditor';
import { Toolbar } from '../components/toolbar/Toolbar';
import { SidePanel } from '../components/panels/SidePanel';
import { PlanningDrawer } from '../components/panels/PlanningDrawer';
import { useGraphStore } from '../store/graph-store';
import type { EdgeType } from '../engine/types';

export function EditorPage() {
  const [edgeMode, setEdgeMode] = useState<EdgeType>('requires');
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        <Toolbar />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1">
            <GraphEditor edgeMode={edgeMode} />
          </div>

          {selectedNodeId !== undefined ? <SidePanel /> : <PlanningDrawer />}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
