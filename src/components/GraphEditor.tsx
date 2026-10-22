import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useViewportCenter } from '../hooks/useViewportCenter';
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  SelectionMode,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
  type Node,
  type Edge,
} from '@xyflow/react';
import { applyLayoutWithFolds } from '../engine/fold-view';
import { deriveGraphView } from '../engine/graph-view';
import { analytics } from '../analytics';
import { useGraphStore } from '../store/graph-store';
import { useSelectionStore } from '../store/selection-store';
import { confirm } from './ui/confirm';
import { CustomNode } from './nodes/CustomNode';
import { FoldGroupNode } from './nodes/FoldGroupNode';
import type { RfNodeData } from './rfHelpers';
import { RequiresEdge, RequiresArrowDef } from './edges/RequiresEdge';
import { ImprovesEdge, ImprovesArrowDef } from './edges/ImprovesEdge';
import { NodeDialog, type NodeFormResult } from './NodeDialog';
import { MultiSelectActions } from './MultiSelectActions';
import { useUIStore } from '../store/ui-store';
import { usePreferencesStore } from '../store/preferences-store';
import { usePlayerStore } from '../store/player-store';
import { buildRfNodes, buildRfEdges, preserveDraggingPositions } from './rfHelpers';
import logoUrl from '../assets/logo.png';
import { GraphLegend } from './GraphLegend';
import { GraphControls } from './GraphControls';

const nodeTypes = { custom: CustomNode, foldGroup: FoldGroupNode };
const edgeTypes = { requires: RequiresEdge, improves: ImprovesEdge };

export function GraphEditor() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectedNodeIds = useSelectionStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useSelectionStore((s) => s.selectedEdgeIds);
  const { selectNodes, selectEdges } = useSelectionStore.getState();
  const {
    moveNode,
    moveNodes,
    updateNode,
    addEdge,
    removeNodes,
    removeEdge,
    toggleNodesComplete,
    duplicateNodes,
    copySelection,
    pasteClipboard,
  } = useGraphStore.getState();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const getViewportCenter = useViewportCenter();
  const canUndo = useStore(useGraphStore.temporal, (state) => state.pastStates.length > 0);
  const canRedo = useStore(useGraphStore.temporal, (state) => state.futureStates.length > 0);

  const handleTidyLayout = useCallback(() => {
    const { nodes: storeNodes, edges: storeEdges } = useGraphStore.getState();
    if (storeNodes.length === 0) return;
    const laidOut = applyLayoutWithFolds(storeNodes, storeEdges);
    useGraphStore.setState({ nodes: laidOut });
    analytics.tidyLayout();
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [fitView]);

  const { editingNodeId, setEditingNodeId, setShowHelp } = useUIStore();
  const hideCompleted = usePreferencesStore((s) => s.hideCompleted);
  const toggleHideCompleted = usePreferencesStore((s) => s.toggleHideCompleted);

  // Auto-complete skill nodes when player data changes
  const playerSkills = usePlayerStore((s) => s.skills);
  useEffect(() => {
    useGraphStore.getState().syncPlayerData(playerSkills);
  }, [playerSkills]);

  // Auto-update kill node KC counters when boss KC data changes
  const playerBossKcs = usePlayerStore((s) => s.bossKcs);
  useEffect(() => {
    useGraphStore.getState().syncBossKcs(playerBossKcs);
  }, [playerBossKcs]);

  // Paste at viewport center rather than a fixed offset
  const pasteAtViewportCenter = useCallback(async () => {
    const count = await pasteClipboard(getViewportCenter());
    if (count > 0) toast.success(`Pasted ${count} node${count !== 1 ? 's' : ''}`);
    else if (count === 0) toast.info('Nothing to paste');
    else toast.error('Failed to paste — clipboard may be empty or invalid');
  }, [pasteClipboard, getViewportCenter]);

  const copySelectionWithToast = useCallback(async () => {
    const count = await copySelection();
    if (count > 0) toast.success(`Copied ${count} node${count !== 1 ? 's' : ''}`);
    else if (count === -1) toast.error('Failed to copy — clipboard access denied');
  }, [copySelection]);

  const duplicateNodesWithToast = useCallback(
    (ids: string[]) => {
      const newIds = duplicateNodes(ids);
      toast.success(`Duplicated ${newIds.length} node${newIds.length !== 1 ? 's' : ''}`);
    },
    [duplicateNodes],
  );

  // Get node being edited for edit dialog
  const editingNode = useMemo(
    () => (editingNodeId ? nodes.find((n) => n.id === editingNodeId) : undefined),
    [editingNodeId, nodes],
  );

  const view = useMemo(
    () =>
      deriveGraphView({
        nodes,
        edges,
        selectedNodeIds,
        selectedEdgeIds,
        hideCompleted,
      }),
    [nodes, edges, selectedNodeIds, selectedEdgeIds, hideCompleted],
  );

  // Close edit dialog when selection changes
  useEffect(() => {
    if (editingNodeId && !selectedNodeIds.includes(editingNodeId)) {
      setEditingNodeId(undefined);
    }
  }, [selectedNodeIds, editingNodeId, setEditingNodeId]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedNodeIds,
    nodes,
    editingNodeId,
    setEditingNodeId,
    setShowHelp,
    selectNodes,
    selectEdges,
    toggleNodesComplete,
    duplicateNodes: duplicateNodesWithToast,
    copySelection: copySelectionWithToast,
    pasteClipboard: pasteAtViewportCenter,
    fitView,
    undo: () => useGraphStore.temporal.getState().undo(),
    redo: () => useGraphStore.temporal.getState().redo(),
  });

  // Pending connection: when a drag ends on empty space
  const [pendingConnection, setPendingConnection] = useState<
    | {
        sourceId: string;
        position: { x: number; y: number };
        handleType: 'source' | 'target' | null;
      }
    | undefined
  >(undefined);

  // Local RF state tracks an in-progress drag. The derived view replaces everything else.
  const [rfNodes, setRfNodes] = useState<Node<RfNodeData>[]>(() =>
    buildRfNodes(view.visibleNodes, nodes, view.statuses, {
      highlightedIds: view.highlightedNodeIds,
      selectedNodeIds,
    }),
  );
  const [rfEdges, setRfEdges] = useState<Edge[]>(() =>
    buildRfEdges(view.visibleEdges, view.highlightedEdgeIds, selectedEdgeIds),
  );

  useEffect(() => {
    setRfNodes((previous) =>
      preserveDraggingPositions(
        previous,
        buildRfNodes(view.visibleNodes, nodes, view.statuses, {
          highlightedIds: view.highlightedNodeIds,
          selectedNodeIds,
        }),
      ),
    );
  }, [view, nodes, selectedNodeIds]);

  useEffect(() => {
    setRfEdges(buildRfEdges(view.visibleEdges, view.highlightedEdgeIds, selectedEdgeIds));
  }, [view, selectedEdgeIds]);

  const onNodesChange = useCallback(
    async (changes: NodeChange[]) => {
      const removeChanges = changes.filter((c) => c.type === 'remove');

      if (removeChanges.length > 0) {
        const totalEdges = removeChanges.reduce(
          (sum, c) => sum + edges.filter((e) => e.from === c.id || e.to === c.id).length,
          0,
        );
        const nodeWord = removeChanges.length === 1 ? 'node' : `${removeChanges.length} nodes`;
        const ok = await confirm({
          title: `Delete ${nodeWord}?`,
          ...(totalEdges > 0
            ? {
                description: `This also removes ${totalEdges} edge${totalEdges === 1 ? '' : 's'}.`,
              }
            : {}),
          confirmLabel: 'Delete',
          tone: 'danger',
        });
        if (!ok) return;
      }

      // Apply ALL changes locally (position, select, dimensions, remove)
      setRfNodes((nds) => applyNodeChanges(changes, nds) as Node<RfNodeData>[]);

      // Sync specific changes back to Zustand
      const positionUpdates: { id: string; position: { x: number; y: number } }[] = [];
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          positionUpdates.push({ id: change.id, position: change.position });
        }
      }

      if (removeChanges.length > 0) {
        removeNodes(removeChanges.map((c) => c.id));
        toast.success(
          `Deleted ${removeChanges.length} node${removeChanges.length !== 1 ? 's' : ''}`,
        );
      }

      if (positionUpdates.length === 1) {
        moveNode(positionUpdates[0]!.id, positionUpdates[0]!.position);
      } else if (positionUpdates.length > 1) {
        moveNodes(positionUpdates);
      }
    },
    [moveNode, moveNodes, removeNodes, edges],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setRfEdges((eds) => applyEdgeChanges(changes, eds));

      for (const change of changes) {
        if (change.type === 'remove') {
          removeEdge(change.id);
        }
      }
    },
    [removeEdge],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (connection.source && connection.target) {
        const id = addEdge(connection.source, connection.target, 'requires');
        if (!id) toast.warning('A connection already exists between these nodes');
      }
    },
    [addEdge],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
      const nodeIds = selectedNodes.map((n) => n.id);
      const edgeIds = selectedEdges.map((e) => e.id);

      // Update selection state
      if (nodeIds.length > 0) {
        selectNodes(nodeIds);
      } else if (edgeIds.length > 0) {
        selectEdges(edgeIds);
      } else {
        selectNodes([]);
        selectEdges([]);
      }
    },
    [selectNodes, selectEdges],
  );

  const onPaneClick = useCallback(() => {
    selectNodes([]);
    selectEdges([]);
  }, [selectNodes, selectEdges]);

  const onConnectEnd = useCallback(
    (
      event: MouseEvent | TouchEvent,
      connectionState: {
        isValid: boolean | null;
        fromNode?: { id: string } | null;
        fromHandle?: { type: 'source' | 'target' } | null;
      },
    ) => {
      if (connectionState.isValid) return;
      const sourceId = connectionState.fromNode?.id;
      if (!sourceId) return;

      const clientX =
        'changedTouches' in event
          ? event.changedTouches[0]?.clientX
          : (event as MouseEvent).clientX;
      const clientY =
        'changedTouches' in event
          ? event.changedTouches[0]?.clientY
          : (event as MouseEvent).clientY;
      if (clientX === undefined || clientY === undefined) return;

      const position = screenToFlowPosition({ x: clientX, y: clientY });

      setPendingConnection({
        sourceId,
        position,
        handleType: connectionState.fromHandle?.type ?? null,
      });
    },
    [screenToFlowPosition],
  );

  const handlePendingNodeAdd = useCallback(
    (result: NodeFormResult) => {
      if (!pendingConnection) return;

      // If dragged from target handle (top), new node is the prerequisite
      // If dragged from source handle (bottom), existing node is the prerequisite
      const edgeSpec =
        pendingConnection.handleType === 'target'
          ? { to: pendingConnection.sourceId, type: 'requires' as const }
          : { from: pendingConnection.sourceId, type: 'requires' as const };

      useGraphStore
        .getState()
        .addNodeWithEdge({ ...result, position: pendingConnection.position }, edgeSpec);
      setPendingConnection(undefined);
    },
    [pendingConnection],
  );

  return (
    <div className="w-full h-full relative">
      <RequiresArrowDef />
      <ImprovesArrowDef />
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        colorMode="dark"
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Cross} gap={40} size={1.5} color="#2a2420" />
        <GraphControls
          onTidy={handleTidyLayout}
          canUndo={canUndo}
          canRedo={canRedo}
          hideCompleted={hideCompleted}
          onToggleHideCompleted={toggleHideCompleted}
          onUndo={() => {
            useGraphStore.temporal.getState().undo();
            analytics.undoUsed();
          }}
          onRedo={() => {
            useGraphStore.temporal.getState().redo();
            analytics.redoUsed();
          }}
        />
        <MiniMap
          className="bg-surface-800! border-surface-border!"
          nodeColor="#3a3028"
          maskColor="rgba(0,0,0,0.6)"
        />
        {nodes.length > 0 && (
          <Panel position="top-right">
            <GraphLegend />
          </Panel>
        )}
      </ReactFlow>

      {nodes.length === 0 && <EmptyState />}

      {pendingConnection && (
        <NodeDialog
          onSubmit={handlePendingNodeAdd}
          onClose={() => setPendingConnection(undefined)}
        />
      )}

      <MultiSelectActions />

      {editingNode && (
        <NodeDialog
          initialNode={editingNode}
          onSubmit={(result) => {
            updateNode(editingNode.id, result);
            setEditingNodeId(undefined);
          }}
          onClose={() => setEditingNodeId(undefined)}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-surface-800 border border-surface-border rounded-xl p-8 max-w-sm w-full text-center shadow-xl mx-4">
        <h1 className="sr-only">Planscape — OSRS Quest &amp; Goal Planner</h1>
        <div className="flex items-center justify-center mb-3">
          <img src={logoUrl} alt="" aria-hidden="true" className="h-28 w-auto max-w-none" />
        </div>
        <p className="text-sm text-stone-400 mb-6 leading-relaxed">
          Map out your OSRS grind. Chain together quests, skill targets, and unlocks — see what you
          can do <span className="text-stone-200">now</span>, what's{' '}
          <span className="text-stone-600">blocked</span>, and where the biggest{' '}
          <span className="text-amber-400">bottlenecks</span> are.
        </p>
        <button
          onClick={() => useUIStore.getState().setShowAddNode(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-amber-700 hover:bg-amber-600 rounded transition-colors"
        >
          + Start your grind
        </button>
      </div>
    </div>
  );
}
