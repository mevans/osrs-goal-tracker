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
import {
  computeAllStatuses,
  getAllPrerequisites,
  getAllDependents,
  getImprovements,
} from '../engine/graph-engine';
import { CustomNode, type CustomNodeData } from './nodes/CustomNode';
import { RequiresEdge, RequiresArrowDef } from './edges/RequiresEdge';
import { ImprovesEdge, ImprovesArrowDef } from './edges/ImprovesEdge';
import { EdgeActions } from './edges/EdgeActions';
import { AddNodeDialog, type AddNodeResult } from './toolbar/AddNodeDialog';
import { QuickAddBar } from './QuickAddBar';
import type { EdgeType } from '../engine/types';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { requires: RequiresEdge, improves: ImprovesEdge };

interface GraphEditorProps {
  edgeMode: EdgeType;
}

function buildRfNodes(
  nodes: ReturnType<typeof useGraphStore.getState>['nodes'],
  statuses: Map<string, import('../engine/types').DerivedStatus>,
  highlightedIds: Set<string> | null,
): Node<CustomNodeData>[] {
  return nodes.map((n) => {
    const node: Node<CustomNodeData> = {
      id: n.id,
      type: 'custom' as const,
      position: n.position,
      className: highlightedIds && !highlightedIds.has(n.id) ? 'opacity-25' : '',
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
        questData: n.questData,
        quantity: n.quantity,
        tags: n.tags,
      },
    };
    return node;
  });
}

export function GraphEditor({ edgeMode }: GraphEditorProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const { moveNode, addNode, addEdge, removeNode, removeEdge, selectNode, selectEdge } =
    useGraphStore.getState();
  const { screenToFlowPosition } = useReactFlow();
  const { undo, redo } = useGraphStore.temporal.getState();

  const [showSuggestions, setShowSuggestions] = useState(true);

  const statuses = useMemo(() => computeAllStatuses(nodes, edges), [nodes, edges]);

  // Compute highlight set: selected node + prerequisites + dependents + improvements + siblings
  const highlightedNodeIds = useMemo(() => {
    if (!selectedNodeId) return null;
    const set = new Set<string>();
    set.add(selectedNodeId);

    // Add all prerequisites (requires edges going backward)
    const prereqs = getAllPrerequisites(selectedNodeId, edges);
    prereqs.forEach((id) => set.add(id));

    // Add all dependents (requires edges going forward)
    const deps = getAllDependents(selectedNodeId, edges);
    deps.forEach((id) => set.add(id));

    // Add improvements (improves edges in either direction)
    const improvements = getImprovements(selectedNodeId, edges);
    improvements.forEach((id) => set.add(id));

    // For each prerequisite, add all its dependents (siblings that share same prereqs)
    const siblings = new Set<string>();
    prereqs.forEach((prereqId) => {
      const sibs = getAllDependents(prereqId, edges);
      sibs.forEach((id) => siblings.add(id));
    });
    siblings.forEach((id) => set.add(id));

    // For each improvement, also include its prerequisites chain
    improvements.forEach((impId) => {
      set.add(impId);
      const impPrereqs = getAllPrerequisites(impId, edges);
      impPrereqs.forEach((id) => set.add(id));
    });

    return set;
  }, [selectedNodeId, edges]);

  // Selected node for quick-add suggestions
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  // Existing node titles for filtering suggestions
  const existingTitles = useMemo(() => new Set(nodes.map((n) => n.title.toLowerCase())), [nodes]);

  // Reset suggestions when selection changes
  useEffect(() => {
    setShowSuggestions(true);
  }, [selectedNodeId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Escape: deselect
      if (event.key === 'Escape') {
        selectNode(undefined);
        selectEdge(undefined);
      }

      // Ctrl+Z or Cmd+Z: Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y: Redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) ||
        (event.ctrlKey && event.key === 'y')
      ) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectNode, selectEdge, undo, redo]);

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
    buildRfNodes(nodes, statuses, highlightedNodeIds),
  );
  const [rfEdges, setRfEdges] = useState<Edge[]>(() =>
    edges.map((e) => ({ id: e.id, source: e.from, target: e.to, type: e.type })),
  );

  // Sync Zustand → local RF state for data changes (add/remove/update/toggle) + highlighting
  useEffect(() => {
    setRfNodes(buildRfNodes(nodes, statuses, highlightedNodeIds));
  }, [nodes, statuses, highlightedNodeIds]);

  useEffect(() => {
    setRfEdges(edges.map((e) => ({ id: e.id, source: e.from, target: e.to, type: e.type })));
  }, [edges]);

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
    [moveNode, removeNode, selectNode, edges],
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
    setEdgeClickPos(undefined);
  }, [selectNode, selectEdge]);

  const [edgeClickPos, setEdgeClickPos] = useState<{ x: number; y: number } | undefined>(undefined);

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setEdgeClickPos({ x: event.clientX, y: event.clientY });
      selectEdge(edge.id);
    },
    [selectEdge],
  );

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
    (result: AddNodeResult) => {
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
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
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

      {edgeClickPos && <EdgeActions clickX={edgeClickPos.x} clickY={edgeClickPos.y} />}

      {pendingConnection && (
        <AddNodeDialog
          onSubmit={handlePendingNodeAdd}
          onClose={() => setPendingConnection(undefined)}
        />
      )}

      {selectedNode && showSuggestions && (
        <QuickAddBar
          selectedNode={selectedNode}
          existingTitles={existingTitles}
          onClose={() => setShowSuggestions(false)}
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
