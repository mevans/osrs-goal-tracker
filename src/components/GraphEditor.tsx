import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useViewportCenter } from '../hooks/useViewportCenter';
import {
  ReactFlow,
  MiniMap,
  Controls,
  ControlButton,
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
import { applyLayout } from '../engine/layout';
import { analytics } from '../analytics';
import { useGraphStore } from '../store/graph-store';
import { computeAllStatuses, getAllPrerequisites, getAllDependents } from '../engine/graph-engine';
import { CustomNode, type CustomNodeData } from './nodes/CustomNode';
import { RequiresEdge, RequiresArrowDef } from './edges/RequiresEdge';
import { ImprovesEdge, ImprovesArrowDef } from './edges/ImprovesEdge';
import { NodeDialog, type NodeFormResult } from './NodeDialog';
import { MultiSelectActions } from './MultiSelectActions';
import { useUIStore } from '../store/ui-store';
import type { EdgeType } from '../engine/types';
import { buildRfNodes, buildRfEdges } from './rfHelpers';
import { CompassIcon } from './CompassIcon';
import { GraphLegend } from './GraphLegend';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { requires: RequiresEdge, improves: ImprovesEdge };

// SVG icons for React Flow ControlButton (must use fill="currentColor" to respect RF color theming)
const TidyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" opacity="0.85" />
  </svg>
);

const UndoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
  </svg>
);

const RedoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
  </svg>
);

interface GraphEditorProps {
  edgeMode: EdgeType;
}

export function GraphEditor({ edgeMode }: GraphEditorProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useGraphStore((s) => s.selectedEdgeIds);
  const {
    moveNode,
    moveNodes,
    addNode,
    updateNode,
    addEdge,
    removeNode,
    removeEdge,
    selectNodes,
    selectEdges,
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
    const laidOut = applyLayout(storeNodes, storeEdges);
    useGraphStore.setState({ nodes: laidOut });
    analytics.tidyLayout();
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [fitView]);

  const { editingNodeId, setEditingNodeId, setShowHelp } = useUIStore();

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

  const statuses = useMemo(() => computeAllStatuses(nodes, edges), [nodes, edges]);

  // Compute highlight set: selected nodes + all prerequisites + all dependents (requires edges only)
  // OR just the two endpoints when an edge is selected
  const highlightedNodeIds = useMemo(() => {
    if (selectedNodeIds.length > 0) {
      const set = new Set<string>();
      for (const nodeId of selectedNodeIds) {
        set.add(nodeId);
        getAllPrerequisites(nodeId, edges).forEach((id) => set.add(id));
        getAllDependents(nodeId, edges).forEach((id) => set.add(id));
      }
      return set;
    }

    if (selectedEdgeIds.length > 0) {
      const set = new Set<string>();
      for (const edgeId of selectedEdgeIds) {
        const edge = edges.find((e) => e.id === edgeId);
        if (edge) {
          set.add(edge.from);
          set.add(edge.to);
        }
      }
      return set;
    }

    return null;
  }, [selectedNodeIds, selectedEdgeIds, edges]);

  // Compute highlighted edges: selected edges + edges between highlighted nodes
  const highlightedEdgeIds = useMemo(() => {
    if (!highlightedNodeIds) return null;
    const set = new Set<string>(selectedEdgeIds);

    for (const edge of edges) {
      if (highlightedNodeIds.has(edge.from) && highlightedNodeIds.has(edge.to)) {
        set.add(edge.id);
      }
    }

    return set;
  }, [highlightedNodeIds, selectedEdgeIds, edges]);

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

  // Local RF state — React Flow owns positions and selection during interaction
  const [rfNodes, setRfNodes] = useState<Node<CustomNodeData>[]>(() =>
    buildRfNodes(nodes, statuses, { highlightedIds: highlightedNodeIds, selectedNodeIds }),
  );
  const [rfEdges, setRfEdges] = useState<Edge[]>(() =>
    buildRfEdges(edges, highlightedEdgeIds, selectedEdgeIds),
  );

  // Sync Zustand → local RF state for data changes (add/remove/update/toggle) + highlighting + selection
  useEffect(() => {
    setRfNodes(
      buildRfNodes(nodes, statuses, { highlightedIds: highlightedNodeIds, selectedNodeIds }),
    );
  }, [nodes, statuses, highlightedNodeIds, selectedNodeIds]);

  useEffect(() => {
    setRfEdges(buildRfEdges(edges, highlightedEdgeIds, selectedEdgeIds));
  }, [edges, highlightedEdgeIds, selectedEdgeIds]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Check for node removal — confirm if it has edges
      for (const change of changes) {
        if (change.type === 'remove') {
          const nodeEdges = edges.filter((e) => e.from === change.id || e.to === change.id);
          if (nodeEdges.length > 0) {
            const confirmed = window.confirm(
              `This node has ${nodeEdges.length} edge(s). Delete anyway?`,
            );
            if (!confirmed) {
              return; // Cancel all changes if user declines
            }
          }
          toast.success('Node deleted');
        }
      }

      // Apply ALL changes locally (position, select, dimensions, remove)
      setRfNodes((nds) => applyNodeChanges(changes, nds) as Node<CustomNodeData>[]);

      // Sync specific changes back to Zustand
      const positionUpdates: { id: string; position: { x: number; y: number } }[] = [];
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          positionUpdates.push({ id: change.id, position: change.position });
        }
        if (change.type === 'remove') {
          removeNode(change.id);
        }
      }
      if (positionUpdates.length === 1) {
        moveNode(positionUpdates[0]!.id, positionUpdates[0]!.position);
      } else if (positionUpdates.length > 1) {
        moveNodes(positionUpdates);
      }
    },
    [moveNode, moveNodes, removeNode, edges],
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
        const id = addEdge(connection.source, connection.target, edgeMode);
        if (!id) toast.warning('A connection already exists between these nodes');
      }
    },
    [addEdge, edgeMode],
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
      const newId = addNode({ ...result, position: pendingConnection.position });

      // If dragged from target handle (top), new node is the prerequisite
      // If dragged from source handle (bottom), existing node is the prerequisite
      if (pendingConnection.handleType === 'target') {
        addEdge(newId, pendingConnection.sourceId, edgeMode);
      } else {
        addEdge(pendingConnection.sourceId, newId, edgeMode);
      }

      setPendingConnection(undefined);
    },
    [pendingConnection, addNode, addEdge, edgeMode],
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
        <Controls className="bg-surface-800! border-surface-border! shadow-lg! [&>button]:bg-surface-800! [&>button]:border-surface-border! [&>button]:text-stone-300! [&>button:hover]:bg-surface-700!">
          <ControlButton onClick={handleTidyLayout} title="Tidy Layout">
            <TidyIcon />
          </ControlButton>
          <ControlButton
            onClick={() => {
              useGraphStore.temporal.getState().undo();
              analytics.undoUsed();
            }}
            title="Undo (Ctrl+Z)"
            style={{ opacity: canUndo ? 1 : 0.3, cursor: canUndo ? 'pointer' : 'not-allowed' }}
          >
            <UndoIcon />
          </ControlButton>
          <ControlButton
            onClick={() => {
              useGraphStore.temporal.getState().redo();
              analytics.redoUsed();
            }}
            title="Redo (Ctrl+Shift+Z)"
            style={{ opacity: canRedo ? 1 : 0.3, cursor: canRedo ? 'pointer' : 'not-allowed' }}
          >
            <RedoIcon />
          </ControlButton>
        </Controls>
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
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <CompassIcon size={64} />
          <h2 className="text-base font-semibold text-amber-100 tracking-wide">Planscape</h2>
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
