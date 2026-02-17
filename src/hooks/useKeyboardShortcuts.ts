import { useEffect, useRef } from 'react';
import type { GraphNode } from '../engine/types';
import { useUIStore } from '../store/ui-store';

interface ShortcutOptions {
  selectedNodeIds: string[];
  nodes: GraphNode[];
  editingNodeId: string | undefined;
  setEditingNodeId: (id: string | undefined) => void;
  setShowHelp: (show: boolean) => void;
  selectNodes: (ids: string[]) => void;
  selectEdges: (ids: string[]) => void;
  toggleNodesComplete: (ids: string[]) => void;
  duplicateNodes: (ids: string[]) => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  fitView: (opts: { padding: number; duration: number }) => void;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts(options: ShortcutOptions) {
  // Keep a ref to the latest options so the stable listener always uses current values
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  // Alt key hold — reveal shortcut hints throughout the UI
  useEffect(() => {
    const { setShowShortcutHints } = useUIStore.getState();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setShowShortcutHints(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setShowShortcutHints(false);
    };
    const onBlur = () => setShowShortcutHints(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Main shortcut listener — attached once, reads latest values via ref
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const {
        selectedNodeIds,
        nodes,
        editingNodeId,
        setEditingNodeId,
        setShowHelp,
        selectNodes,
        selectEdges,
        toggleNodesComplete,
        duplicateNodes,
        copySelection,
        pasteClipboard,
        fitView,
        undo,
        redo,
      } = optionsRef.current;

      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key;

      // Escape — close edit dialog or deselect
      if (key === 'Escape') {
        if (editingNodeId) {
          setEditingNodeId(undefined);
        } else {
          selectNodes([]);
          selectEdges([]);
          setShowHelp(false);
        }
        return;
      }

      if (isTyping) return;

      // ? — toggle keyboard help
      if (key === '?') {
        setShowHelp(true);
        return;
      }

      // Space — toggle complete
      if (key === ' ') {
        e.preventDefault();
        if (selectedNodeIds.length > 0) toggleNodesComplete(selectedNodeIds);
        return;
      }

      // E — edit selected goal/task node
      if (key === 'e' || key === 'E') {
        const node =
          selectedNodeIds.length === 1 ? nodes.find((n) => n.id === selectedNodeIds[0]) : undefined;
        if (node && (node.type === 'goal' || node.type === 'task')) {
          setEditingNodeId(node.id);
        }
        return;
      }

      // F — fit view
      if (key === 'f' || key === 'F') {
        e.preventDefault();
        fitView({ padding: 0.2, duration: 300 });
        return;
      }

      if (mod) {
        // Ctrl/Cmd+A — select all
        if (key === 'a') {
          e.preventDefault();
          selectNodes(nodes.map((n) => n.id));
          return;
        }
        // Ctrl/Cmd+D — duplicate
        if (key === 'd') {
          e.preventDefault();
          if (selectedNodeIds.length > 0) duplicateNodes(selectedNodeIds);
          return;
        }
        // Ctrl/Cmd+C — copy
        if (key === 'c') {
          e.preventDefault();
          if (selectedNodeIds.length > 0) copySelection();
          return;
        }
        // Ctrl/Cmd+V — paste
        if (key === 'v') {
          e.preventDefault();
          pasteClipboard();
          return;
        }
        // Ctrl/Cmd+Z — undo / redo
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        // Ctrl+Y — redo
        if (key === 'y' && e.ctrlKey) {
          e.preventDefault();
          redo();
          return;
        }
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []); // Empty dep array — listener attaches once, stays stable
}
