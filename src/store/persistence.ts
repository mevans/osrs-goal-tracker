import { useGraphStore } from './graph-store';
import { saveToLocalStorage, loadFromLocalStorage } from '../engine/serialization';

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

export function initPersistence(): void {
  // Load saved graph on startup
  const saved = loadFromLocalStorage();
  if (saved) {
    useGraphStore.getState().loadGraph(saved);
  }

  // Auto-save on every state change, debounced
  useGraphStore.subscribe((state) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      saveToLocalStorage({ nodes: state.nodes, edges: state.edges });
    }, 300);
  });
}
