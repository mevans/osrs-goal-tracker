import { useEffect, useState } from 'react';
import { useGraphStore } from '../../store/graph-store';
import { useSelectionStore } from '../../store/selection-store';
import { PlanningDrawer } from './PlanningDrawer';
import { NodeInspector } from './NodeInspector';

export function SidePanel() {
  const selectedIds = useSelectionStore((s) => s.selectedNodeIds);
  const nodes = useGraphStore((s) => s.nodes);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : undefined;
  const node = selectedId ? nodes.find((candidate) => candidate.id === selectedId) : undefined;
  const [preferPlanning, setPreferPlanning] = useState(false);

  useEffect(() => {
    setPreferPlanning(false);
  }, [selectedId]);

  if (node && !preferPlanning) {
    return <NodeInspector node={node} onShowPlanning={() => setPreferPlanning(true)} />;
  }

  return <PlanningDrawer onBackToSelection={node ? () => setPreferPlanning(false) : undefined} />;
}
