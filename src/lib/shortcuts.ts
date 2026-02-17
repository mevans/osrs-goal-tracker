const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

export const MOD = isMac ? '⌘' : 'Ctrl';
export const SHIFT = isMac ? '⇧' : 'Shift';

/** Display key sequences for each shortcut. */
export const SHORTCUT_KEYS = {
  undo: [MOD, 'Z'],
  redo: [MOD, SHIFT, 'Z'],
  selectAll: [MOD, 'A'],
  duplicate: [MOD, 'D'],
  copy: [MOD, 'C'],
  paste: [MOD, 'V'],
  fitView: ['F'],
  toggleComplete: ['Space'],
  editNode: ['E'],
  delete: ['Del'],
  deselect: ['Esc'],
  showHelp: ['?'],
} as const;

export type ShortcutId = keyof typeof SHORTCUT_KEYS;

/** Grouped shortcut definitions for the help overlay. */
export const SHORTCUT_GROUPS: { category: string; items: { id: ShortcutId; label: string }[] }[] = [
  {
    category: 'Canvas',
    items: [
      { id: 'fitView', label: 'Fit view' },
      { id: 'deselect', label: 'Deselect / close' },
      { id: 'showHelp', label: 'Keyboard shortcuts' },
    ],
  },
  {
    category: 'Nodes',
    items: [
      { id: 'toggleComplete', label: 'Toggle complete' },
      { id: 'editNode', label: 'Edit selected node' },
      { id: 'delete', label: 'Delete selected' },
    ],
  },
  {
    category: 'Selection',
    items: [
      { id: 'selectAll', label: 'Select all' },
      { id: 'duplicate', label: 'Duplicate' },
      { id: 'copy', label: 'Copy' },
      { id: 'paste', label: 'Paste' },
    ],
  },
  {
    category: 'History',
    items: [
      { id: 'undo', label: 'Undo' },
      { id: 'redo', label: 'Redo' },
    ],
  },
];
