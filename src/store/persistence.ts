import { useGraphStore } from './graph-store';
import { saveToLocalStorage, loadFromLocalStorage } from '../engine/serialization';

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

export function initPersistence(): void {
  // Load saved graph on startup (migrations handled in loadFromLocalStorage)
  const saved = loadFromLocalStorage();
  if (saved) {
    useGraphStore.getState().loadGraph(saved);
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
