import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useViewportCenter } from '../hooks/useViewportCenter';
import {
  ReactFlow,
  MiniMap,
  Controls,
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

const nodeTypes = { custom: CustomNode };
const edgeTypes = { requires: RequiresEdge, improves: ImprovesEdge };

interface GraphEditorProps {
  edgeMode: EdgeType;
}

export function GraphEditor({ edgeMode }: GraphEditorProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds);
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
  const { undo, redo } = useGraphStore.temporal.getState();

  const { editingNodeId, setEditingNodeId, setShowHelp } = useUIStore();

  // Paste at viewport center rather than a fixed offset
  const pasteAtViewportCenter = useCallback(() => {
    pasteClipboard(getViewportCenter());
  }, [pasteClipboard, getViewportCenter]);

  // Get node being edited for edit dialog
  const editingNode = useMemo(
    () => (editingNodeId ? nodes.find((n) => n.id === editingNodeId) : undefined),
    [editingNodeId, nodes],
  );

  const statuses = useMemo(() => computeAllStatuses(nodes, edges), [nodes, edges]);

  // Compute highlight set: selected nodes + all prerequisites + all dependents (requires edges only)
  const highlightedNodeIds = useMemo(() => {
    if (selectedNodeIds.length === 0) return null;
    const set = new Set<string>();

    for (const nodeId of selectedNodeIds) {
      set.add(nodeId);
      // Add all prerequisites (up the tree)
      const prereqs = getAllPrerequisites(nodeId, edges);
      prereqs.forEach((id) => set.add(id));
      // Add all dependents (down the tree)
      const deps = getAllDependents(nodeId, edges);
      deps.forEach((id) => set.add(id));
    }

    return set;
  }, [selectedNodeIds, edges]);

  // Compute highlighted edges: only edges between highlighted nodes
  const highlightedEdgeIds = useMemo(() => {
    if (!highlightedNodeIds) return null;
    const set = new Set<string>();

    for (const edge of edges) {
      if (highlightedNodeIds.has(edge.from) && highlightedNodeIds.has(edge.to)) {
        set.add(edge.id);
      }
    }

    return set;
  }, [highlightedNodeIds, edges]);

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
    duplicateNodes,
    copySelection,
    pasteClipboard: pasteAtViewportCenter,
    fitView,
    undo,
    redo,
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
  const [rfEdges, setRfEdges] = useState<Edge[]>(() => buildRfEdges(edges, highlightedEdgeIds));

  // Sync Zustand → local RF state for data changes (add/remove/update/toggle) + highlighting + selection
  useEffect(() => {
    setRfNodes(
      buildRfNodes(nodes, statuses, { highlightedIds: highlightedNodeIds, selectedNodeIds }),
    );
  }, [nodes, statuses, highlightedNodeIds, selectedNodeIds]);

  useEffect(() => {
    setRfEdges(buildRfEdges(edges, highlightedEdgeIds));
  }, [edges, highlightedEdgeIds]);

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
        addEdge(connection.source, connection.target, edgeMode);
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
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
        <Controls className="bg-gray-800! border-gray-700! shadow-lg! [&>button]:bg-gray-800! [&>button]:border-gray-700! [&>button]:text-gray-300! [&>button:hover]:bg-gray-700!" />
        <MiniMap
          className="bg-gray-800! border-gray-700!"
          nodeColor="#4b5563"
          maskColor="rgba(0,0,0,0.6)"
        />
        <Panel position="top-right">
          <Legend />
        </Panel>
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
      <div className="pointer-events-auto bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-sm w-full text-center shadow-xl mx-4">
        <h2 className="text-base font-semibold text-white mb-2">OSRS Planner</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Build a visual dependency graph of your goals — quests, skill targets, and unlocks. See
          what you can do <span className="text-white">now</span>, what's{' '}
          <span className="text-gray-500">blocked</span>, and where the biggest{' '}
          <span className="text-amber-400">bottlenecks</span> are.
        </p>
        <button
          onClick={() => useUIStore.getState().setShowAddNode(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
        >
          + Start planning
        </button>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="bg-gray-800/90 border border-gray-700 rounded-lg p-3 text-xs backdrop-blur-sm">
      <div className="space-y-1 mb-3">
        <div className="text-gray-500 font-medium uppercase tracking-wide text-[10px] mb-1.5">
          Node type
        </div>
        {[
          { color: 'bg-amber-500', label: 'Goal' },
          { color: 'bg-blue-500', label: 'Quest' },
          { color: 'bg-green-600', label: 'Skill' },
          { color: 'bg-purple-600', label: 'Task' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${color}`} />
            <span className="text-gray-300">{label}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="text-gray-500 font-medium uppercase tracking-wide text-[10px] mb-1.5">
          Status
        </div>
        {[
          { border: 'border-green-500', label: 'Complete' },
          { border: 'border-blue-400', label: 'Available' },
          { border: 'border-gray-600', label: 'Blocked' },
        ].map(({ border, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 border-2 ${border}`} />
            <span className="text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
