import { create } from 'zustand';
import { temporal } from 'zundo';
import type {
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  GraphData,
  SkillName,
  Quantity,
} from '../engine/types';
import { generateId } from '../engine/types';

export interface AddNodeParams {
  type: NodeType;
  title: string;
  position: { x: number; y: number };
  notes: string | undefined;
  skillData: { skillName: SkillName; targetLevel: number; boost: number | undefined } | undefined;
  questData: { questId: string } | undefined;
  quantity: Quantity | undefined;
  tags: string[] | undefined;
}

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  addNode: (params: AddNodeParams) => string;
  updateNode: (id: string, updates: Partial<Omit<GraphNode, 'id'>>) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  toggleNodeComplete: (id: string) => void;
  toggleNodesComplete: (ids: string[]) => void;
  duplicateNodes: (ids: string[]) => string[];
  addTagToNode: (nodeId: string, tag: string) => void;
  removeTagFromNode: (nodeId: string, tag: string) => void;
  addEdge: (from: string, to: string, type: EdgeType) => string;
  removeEdge: (id: string) => void;
  reverseEdge: (id: string) => void;
  setEdgeType: (id: string, type: EdgeType) => void;
  selectNodes: (ids: string[]) => void;
  selectEdges: (ids: string[]) => void;
  copySelection: () => void;
  pasteClipboard: (offset: { x: number; y: number }) => void;
  loadGraph: (data: GraphData) => void;
  mergeGraph: (data: { nodes: GraphNode[]; edges: GraphEdge[] }) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>()(
  temporal(
    (set) => ({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],

      addNode: (params) => {
        const id = generateId();
        const node: GraphNode = {
          id,
          type: params.type,
          title: params.title,
          position: params.position,
          complete: false,
          notes: params.notes ?? undefined,
          skillData: params.skillData ?? undefined,
          questData: params.questData ?? undefined,
          quantity: params.quantity ?? undefined,
          tags: params.tags ?? [],
        };
        set((state) => ({ nodes: [...state.nodes, node] }));
        return id;
      },

      updateNode: (id, updates) => {
        set((state) => ({
          nodes: state.nodes.map((n) => {
            if (n.id !== id) return n;
            const merged = { ...n, ...updates };
            // Sync complete status with quantity when quantity is being updated
            if (updates.quantity !== undefined && merged.quantity) {
              merged.complete = merged.quantity.current >= merged.quantity.target;
            }
            return merged;
          }),
        }));
      },

      removeNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.from !== id && e.to !== id),
          selectedNodeIds: state.selectedNodeIds.filter((nid) => nid !== id),
        }));
      },

      moveNode: (id, position) => {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
        }));
      },

      toggleNodeComplete: (id) => {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, complete: !n.complete } : n)),
        }));
      },

      toggleNodesComplete: (ids) => {
        set((state) => {
          const idsSet = new Set(ids);
          // If all selected are complete, mark all incomplete; otherwise mark all complete
          const allComplete = ids.every((id) => state.nodes.find((n) => n.id === id)?.complete);
          return {
            nodes: state.nodes.map((n) =>
              idsSet.has(n.id) ? { ...n, complete: !allComplete } : n,
            ),
          };
        });
      },

      duplicateNodes: (ids) => {
        const state = useGraphStore.getState();
        const nodesToDupe = state.nodes.filter((n) => ids.includes(n.id));
        const idMap = new Map<string, string>();

        const newNodes = nodesToDupe.map((node) => {
          const newId = generateId();
          idMap.set(node.id, newId);
          return {
            ...node,
            id: newId,
            position: { x: node.position.x + 40, y: node.position.y + 40 },
            complete: false,
          };
        });

        // Copy internal edges (edges between duplicated nodes)
        const idsSet = new Set(ids);
        const edgesToDupe = state.edges.filter((e) => idsSet.has(e.from) && idsSet.has(e.to));
        const newEdges = edgesToDupe.map((edge) => ({
          ...edge,
          id: generateId(),
          from: idMap.get(edge.from)!,
          to: idMap.get(edge.to)!,
        }));

        set((state) => ({
          nodes: [...state.nodes, ...newNodes],
          edges: [...state.edges, ...newEdges],
          selectedNodeIds: newNodes.map((n) => n.id),
        }));

        return newNodes.map((n) => n.id);
      },

      addTagToNode: (nodeId, tag) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId && !n.tags.includes(tag) ? { ...n, tags: [...n.tags, tag] } : n,
          ),
        }));
      },

      removeTagFromNode: (nodeId, tag) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, tags: n.tags.filter((t) => t !== tag) } : n,
          ),
        }));
      },

      addEdge: (from, to, type) => {
        // Prevent duplicate edges (same from/to pair in either direction)
        const { edges: existing } = useGraphStore.getState();
        const duplicate = existing.some(
          (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
        );
        if (duplicate) return '';

        const id = generateId();
        const edge: GraphEdge = { id, from, to, type };
        set((state) => ({ edges: [...state.edges, edge] }));
        return id;
      },

      removeEdge: (id) => {
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== id),
        }));
      },

      reverseEdge: (id) => {
        set((state) => ({
          edges: state.edges.map((e) => (e.id === id ? { ...e, from: e.to, to: e.from } : e)),
        }));
      },

      setEdgeType: (id, type) => {
        set((state) => ({
          edges: state.edges.map((e) => (e.id === id ? { ...e, type } : e)),
        }));
      },

      selectNodes: (ids) => {
        set({ selectedNodeIds: ids, selectedEdgeIds: [] });
      },

      selectEdges: (ids) => {
        set({ selectedEdgeIds: ids, selectedNodeIds: [] });
      },

      copySelection: async () => {
        const state = useGraphStore.getState();
        const selectedSet = new Set(state.selectedNodeIds);
        const nodesToCopy = state.nodes.filter((n) => selectedSet.has(n.id));
        const edgesToCopy = state.edges.filter(
          (e) => selectedSet.has(e.from) && selectedSet.has(e.to),
        );

        const clipboardData = JSON.stringify({ nodes: nodesToCopy, edges: edgesToCopy });
        try {
          await navigator.clipboard.writeText(clipboardData);
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
        }
      },

      pasteClipboard: async (offset) => {
        try {
          const clipboardText = await navigator.clipboard.readText();
          const clipboardData = JSON.parse(clipboardText) as {
            nodes: GraphNode[];
            edges: GraphEdge[];
          };

          const idMap = new Map<string, string>();
          const newNodes = clipboardData.nodes.map((node) => {
            const newId = generateId();
            idMap.set(node.id, newId);
            return {
              ...node,
              id: newId,
              position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
              complete: false,
            };
          });

          const newEdges = clipboardData.edges.map((edge) => ({
            ...edge,
            id: generateId(),
            from: idMap.get(edge.from)!,
            to: idMap.get(edge.to)!,
          }));

          set((state) => ({
            nodes: [...state.nodes, ...newNodes],
            edges: [...state.edges, ...newEdges],
            selectedNodeIds: newNodes.map((n) => n.id),
          }));
        } catch (err) {
          // Silently fail if clipboard is empty or invalid JSON
          console.error('Failed to paste from clipboard:', err);
        }
      },

      loadGraph: (data) => {
        set({
          nodes: data.nodes,
          edges: data.edges,
          selectedNodeIds: [],
          selectedEdgeIds: [],
        });
      },

      mergeGraph: ({ nodes: newNodes, edges: newEdges }) => {
        set((state) => {
          const existingNodeIds = new Set(state.nodes.map((n) => n.id));
          const existingEdgeIds = new Set(state.edges.map((e) => e.id));
          return {
            nodes: [...state.nodes, ...newNodes.filter((n) => !existingNodeIds.has(n.id))],
            edges: [...state.edges, ...newEdges.filter((e) => !existingEdgeIds.has(e.id))],
          };
        });
      },

      clearGraph: () => {
        set({ nodes: [], edges: [], selectedNodeIds: [], selectedEdgeIds: [] });
      },
    }),
    {
      limit: 50,
      equality: (a, b) => a.nodes === b.nodes && a.edges === b.edges,
    },
  ),
);
