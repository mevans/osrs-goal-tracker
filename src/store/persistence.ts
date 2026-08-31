import { useGraphStore } from './graph-store';
import { saveToLocalStorage, loadFromLocalStorage } from '../engine/serialization';
import { useSyncStore } from './sync-store';
import { isApplyingRemote, pullOnce, pushOnce } from '../sync/run-sync';

let localDebounce: ReturnType<typeof setTimeout> | undefined;
let cloudDebounce: ReturnType<typeof setTimeout> | undefined;

export function initPersistence(): void {
  const saved = loadFromLocalStorage();
  if (saved) {
    useGraphStore.getState().loadGraph(saved);
    useGraphStore.temporal.getState().clear();
  }

  useGraphStore.subscribe((state, prev) => {
    if (state.nodes === prev.nodes && state.edges === prev.edges && state.notes === prev.notes) {
      return;
    }

    clearTimeout(localDebounce);
    localDebounce = setTimeout(() => {
      saveToLocalStorage({ nodes: state.nodes, edges: state.edges, notes: state.notes });
    }, 300);

    if (isApplyingRemote()) return;
    if (!useSyncStore.getState().syncId) return;

    useSyncStore.getState().markDirty();
    clearTimeout(cloudDebounce);
    cloudDebounce = setTimeout(() => {
      void pushOnce(true);
    }, 2000);
  });

  const startCloud = () => {
    if (!useSyncStore.getState().syncId) return;
    void pullOnce(true);
  };

  if (useSyncStore.persist.hasHydrated()) {
    startCloud();
  } else {
    useSyncStore.persist.onFinishHydration(startCloud);
  }

  window.addEventListener('online', () => {
    const { syncId, dirty } = useSyncStore.getState();
    if (!syncId) return;
    if (dirty) {
      void pushOnce(true);
    } else {
      void pullOnce(true);
    }
  });
}
