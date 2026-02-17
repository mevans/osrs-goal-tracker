import { create } from 'zustand';

interface UIState {
  editingNodeId: string | undefined;
  setEditingNodeId: (id: string | undefined) => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  showShortcutHints: boolean;
  setShowShortcutHints: (show: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  editingNodeId: undefined,
  setEditingNodeId: (id) => set({ editingNodeId: id }),
  showHelp: false,
  setShowHelp: (show) => set({ showHelp: show }),
  showShortcutHints: false,
  setShowShortcutHints: (show) => set({ showShortcutHints: show }),
}));
