import { create } from 'zustand';

interface UIState {
  editingNodeId: string | undefined;
  setEditingNodeId: (id: string | undefined) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  editingNodeId: undefined,
  setEditingNodeId: (id) => set({ editingNodeId: id }),
}));
