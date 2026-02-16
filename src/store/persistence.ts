import { useGraphStore } from './graph-store';
import { saveToLocalStorage, loadFromLocalStorage } from '../engine/serialization';

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

export function initPersistence(): void {
  // Load saved graph on startup
  const saved = loadFromLocalStorage();
  if (saved) {
    // Migrate legacy data: add tags field if missing
    const migratedNodes = saved.nodes.map((n) => ({
      ...n,
      tags: n.tags ?? [],
    }));
    useGraphStore.getState().loadGraph({ nodes: migratedNodes, edges: saved.edges });
    // Clear undo/redo history after loading — initial state shouldn't be undoable
    useGraphStore.temporal.getState().clear();
  }

  // Auto-save on every state change, debounced
  useGraphStore.subscribe((state) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      saveToLocalStorage({ nodes: state.nodes, edges: state.edges });
    }, 300);
  });
}
