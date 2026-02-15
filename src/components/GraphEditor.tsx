import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
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
import { computeAllStatuses } from '../engine/graph-engine';
import { CustomNode, type CustomNodeData } from './nodes/CustomNode';
import { RequiresEdge, RequiresArrowDef } from './edges/RequiresEdge';
import { ImprovesEdge, ImprovesArrowDef } from './edges/ImprovesEdge';
import { AddNodeDialog, type AddNodeResult } from './toolbar/AddNodeDialog';
import type { EdgeType } from '../engine/types';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { requires: RequiresEdge, improves: ImprovesEdge };

interface GraphEditorProps {
  edgeMode: EdgeType;
}

function buildRfNodes(
  nodes: ReturnType<typeof useGraphStore.getState>['nodes'],
  statuses: Map<string, import('../engine/types').DerivedStatus>,
): Node<CustomNodeData>[] {
  return nodes.map((n) => ({
    id: n.id,
    type: 'custom' as const,
    position: n.position,
    data: {
      title: n.title,
      nodeType: n.type,
      status: statuses.get(n.id) ?? 'available',
      complete: n.complete,
      subtitle: n.skillData
        ? n.skillData.boost
          ? `${n.skillData.skillName} ${n.skillData.targetLevel - n.skillData.boost}+${n.skillData.boost}`
          : `${n.skillData.skillName} ${n.skillData.targetLevel}`
        : undefined,
      skillData: n.skillData,
      quantity: n.quantity,
    },
  }));
}

export function GraphEditor({ edgeMode }: GraphEditorProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const { moveNode, addNode, addEdge, removeNode, removeEdge, selectNode, selectEdge } = useGraphStore.getState();
  const { screenToFlowPosition } = useReactFlow();

  const statuses = useMemo(() => computeAllStatuses(nodes, edges), [nodes, edges]);

  // Pending connection: when a drag ends on empty space
  const [pendingConnection, setPendingConnection] = useState<{
    sourceId: string;
    position: { x: number; y: number };
  } | undefined>(undefined);

  // Local RF state — React Flow owns positions and selection during interaction
  const [rfNodes, setRfNodes] = useState<Node<CustomNodeData>[]>(() =>
    buildRfNodes(nodes, statuses),
  );
  const [rfEdges, setRfEdges] = useState<Edge[]>(() =>
    edges.map((e) => ({ id: e.id, source: e.from, target: e.to, type: e.type })),
  );

  // Sync Zustand → local RF state for data changes (add/remove/update/toggle)
  // Does NOT depend on selectedNodeId — selection is handled locally by applyNodeChanges
  useEffect(() => {
    setRfNodes(buildRfNodes(nodes, statuses));
  }, [nodes, statuses]);

  useEffect(() => {
    setRfEdges(edges.map((e) => ({ id: e.id, source: e.from, target: e.to, type: e.type })));
  }, [edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply ALL changes locally (position, select, dimensions, remove)
      setRfNodes((nds) => applyNodeChanges(changes, nds) as Node<CustomNodeData>[]);

      // Sync specific changes back to Zustand
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          moveNode(change.id, change.position);
        }
        if (change.type === 'remove') {
          removeNode(change.id);
        }
        // Sync selection to Zustand for the side panel
        if (change.type === 'select') {
          if (change.selected) {
            selectNode(change.id);
          } else {
            // Only clear if this was the selected node
            const current = useGraphStore.getState().selectedNodeId;
            if (current === change.id) {
              selectNode(undefined);
            }
          }
        }
      }
    },
    [moveNode, removeNode, selectNode],
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

  const onPaneClick = useCallback(() => {
    selectNode(undefined);
    selectEdge(undefined);
  }, [selectNode, selectEdge]);

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      selectEdge(edge.id);
    },
    [selectEdge],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: { isValid: boolean | null; fromNode?: { id: string } | null }) => {
      if (connectionState.isValid) return;
      const sourceId = connectionState.fromNode?.id;
      if (!sourceId) return;

      const clientX = 'changedTouches' in event ? event.changedTouches[0]?.clientX : (event as MouseEvent).clientX;
      const clientY = 'changedTouches' in event ? event.changedTouches[0]?.clientY : (event as MouseEvent).clientY;
      if (clientX === undefined || clientY === undefined) return;

      const position = screenToFlowPosition({ x: clientX, y: clientY });

      setPendingConnection({ sourceId, position });
    },
    [screenToFlowPosition],
  );

  const handlePendingNodeAdd = useCallback(
    (result: AddNodeResult) => {
      if (!pendingConnection) return;
      const newId = addNode({ ...result, position: pendingConnection.position });
      addEdge(pendingConnection.sourceId, newId, edgeMode);
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
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        colorMode="dark"
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
        <Controls className="!bg-gray-800 !border-gray-700 !shadow-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-300 [&>button:hover]:!bg-gray-700" />
        <MiniMap
          className="!bg-gray-800 !border-gray-700"
          nodeColor="#4b5563"
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>

      {pendingConnection && (
        <AddNodeDialog
          onSubmit={handlePendingNodeAdd}
          onClose={() => setPendingConnection(undefined)}
        />
      )}
    </div>
  );
}

/** Hook to get viewport center for placing new nodes. */
export function useViewportCenter(): () => { x: number; y: number } {
  const { getViewport } = useReactFlow();

  return useCallback(() => {
    const { x, y, zoom } = getViewport();
    const centerX = (-x + window.innerWidth / 2) / zoom;
    const centerY = (-y + window.innerHeight / 2) / zoom;
    return { x: centerX, y: centerY };
  }, [getViewport]);
}
