type EventProperties = Record<string, string | number | boolean>;

function track(event: string, props?: EventProperties): void {
  if (typeof window.plausible === 'undefined') return;
  window.plausible(event, props ? { props } : undefined);
}

export const analytics = {
  nodeCreated: (type: string) => track('Node Created', { type }),
  nodeCompleted: (type: string) => track('Node Completed', { type }),
  edgeCreated: () => track('Edge Created'),
  shareGenerated: () => track('Share Generated'),
  exportJson: () => track('Export JSON'),
  importJson: () => track('Import JSON'),
  tidyLayout: () => track('Tidy Layout'),
  undoUsed: () => track('Undo Used'),
  redoUsed: () => track('Redo Used'),
  openInEditor: () => track('Open in Editor'),
};

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProperties }) => void;
  }
}
