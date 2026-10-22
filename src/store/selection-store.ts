import { create } from 'zustand';

interface SelectionState {
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  selectNodes: (ids: string[]) => void;
  selectEdges: (ids: string[]) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedNodeIds: [],
  selectedEdgeIds: [],
  selectNodes: (ids) => set({ selectedNodeIds: ids, selectedEdgeIds: [] }),
  selectEdges: (ids) => set({ selectedEdgeIds: ids, selectedNodeIds: [] }),
  setSelection: (nodeIds, edgeIds) => set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds }),
}));
