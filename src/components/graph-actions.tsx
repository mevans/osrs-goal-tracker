import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useGraphStore } from '../store/graph-store';
import { useUIStore } from '../store/ui-store';
import type { EdgeType, GraphNode } from '../engine/types';

/** Editor operations the canvas can call. Absent on the read-only shared view. */
export interface GraphActions {
  toggleNodeComplete: (id: string) => void;
  toggleDiaryTask: (id: string, index: number) => void;
  updateNode: (id: string, updates: Partial<Omit<GraphNode, 'id'>>) => void;
  removeNode: (id: string) => void;
  beginEdit: (id: string) => void;
  unfoldGroup: (id: string) => void;
  reverseEdge: (id: string) => void;
  setEdgeType: (id: string, type: EdgeType) => void;
  removeEdge: (id: string) => void;
}

const GraphActionsContext = createContext<GraphActions | null>(null);

export function useGraphActions(): GraphActions | null {
  return useContext(GraphActionsContext);
}

export function EditorGraphActions({ children }: { children: ReactNode }) {
  const toggleNodeComplete = useGraphStore((s) => s.toggleNodeComplete);
  const toggleDiaryTask = useGraphStore((s) => s.toggleDiaryTask);
  const updateNode = useGraphStore((s) => s.updateNode);
  const removeNode = useGraphStore((s) => s.removeNode);
  const unfoldGroup = useGraphStore((s) => s.unfoldGroup);
  const reverseEdge = useGraphStore((s) => s.reverseEdge);
  const setEdgeType = useGraphStore((s) => s.setEdgeType);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const setEditingNodeId = useUIStore((s) => s.setEditingNodeId);

  const actions = useMemo<GraphActions>(
    () => ({
      toggleNodeComplete,
      toggleDiaryTask,
      updateNode,
      removeNode,
      beginEdit: (id) => setEditingNodeId(id),
      unfoldGroup,
      reverseEdge,
      setEdgeType,
      removeEdge,
    }),
    [
      toggleNodeComplete,
      toggleDiaryTask,
      updateNode,
      removeNode,
      setEditingNodeId,
      unfoldGroup,
      reverseEdge,
      setEdgeType,
      removeEdge,
    ],
  );

  return <GraphActionsContext.Provider value={actions}>{children}</GraphActionsContext.Provider>;
}
