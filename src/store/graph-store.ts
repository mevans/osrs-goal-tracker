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
import { analytics } from '../analytics';

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
  moveNodes: (positions: { id: string; position: { x: number; y: number } }[]) => void;
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
  copySelection: () => Promise<number>;
  pasteClipboard: (center: { x: number; y: number }) => Promise<number>;
  loadGraph: (data: GraphData) => void;
  mergeGraph: (data: { nodes: GraphNode[]; edges: GraphEdge[] }) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>()(
  temporal(
    (set, get) => ({
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
          completedPrereqIds: [],
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

      moveNodes: (positions) => {
        const posMap = new Map(positions.map((p) => [p.id, p.position]));
        set((state) => ({
          nodes: state.nodes.map((n) => {
            const pos = posMap.get(n.id);
            return pos ? { ...n, position: pos } : n;
          }),
        }));
      },

      toggleNodeComplete: (id) => {
        set((state) => ({
          nodes: state.nodes.map((n) => {
            if (n.id !== id) return n;
            const newComplete = !n.complete;
            if (newComplete) analytics.nodeCompleted(n.type);
            // When marking complete, sync quantity.current to target for consistency
            if (newComplete && n.quantity) {
              return {
                ...n,
                complete: true,
                quantity: { ...n.quantity, current: n.quantity.target },
              };
            }
            return { ...n, complete: newComplete };
          }),
        }));
      },

      toggleNodesComplete: (ids) => {
        set((state) => {
          const idsSet = new Set(ids);
          // If all selected are complete, mark all incomplete; otherwise mark all complete
          const allComplete = ids.every((id) => state.nodes.find((n) => n.id === id)?.complete);
          return {
            nodes: state.nodes.map((n) => {
              if (!idsSet.has(n.id)) return n;
              const newComplete = !allComplete;
              if (newComplete && n.quantity) {
                return {
                  ...n,
                  complete: true,
                  quantity: { ...n.quantity, current: n.quantity.target },
                };
              }
              return { ...n, complete: newComplete };
            }),
          };
        });
      },

      duplicateNodes: (ids) => {
        const state = get();
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
        const { edges: existing } = get();
        const duplicate = existing.some(
          (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
        );
        if (duplicate) return '';

        const id = generateId();
        const edge: GraphEdge = { id, from, to, type };
        set((state) => ({ edges: [...state.edges, edge] }));
        analytics.edgeCreated();
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
        const state = get();
        const selectedSet = new Set(state.selectedNodeIds);
        const nodesToCopy = state.nodes.filter((n) => selectedSet.has(n.id));
        const edgesToCopy = state.edges.filter(
          (e) => selectedSet.has(e.from) && selectedSet.has(e.to),
        );

        const clipboardData = JSON.stringify({ nodes: nodesToCopy, edges: edgesToCopy });
        try {
          await navigator.clipboard.writeText(clipboardData);
          return nodesToCopy.length;
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
          return -1;
        }
      },

      pasteClipboard: async (center) => {
        try {
          const clipboardText = await navigator.clipboard.readText();
          const clipboardData = JSON.parse(clipboardText) as {
            nodes: GraphNode[];
            edges: GraphEdge[];
          };

          if (clipboardData.nodes.length === 0) return 0;

          // Compute bounding center of clipboard nodes so we can center them at the target
          const xs = clipboardData.nodes.map((n) => n.position.x);
          const ys = clipboardData.nodes.map((n) => n.position.y);
          const clipCenterX = (Math.min(...xs) + Math.max(...xs)) / 2;
          const clipCenterY = (Math.min(...ys) + Math.max(...ys)) / 2;
          const dx = center.x - clipCenterX;
          const dy = center.y - clipCenterY;

          const idMap = new Map<string, string>();
          const newNodes = clipboardData.nodes.map((node) => {
            const newId = generateId();
            idMap.set(node.id, newId);
            return {
              ...node,
              id: newId,
              position: { x: node.position.x + dx, y: node.position.y + dy },
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

          return newNodes.length;
        } catch (err) {
          // Silently fail if clipboard is empty or invalid JSON
          console.error('Failed to paste from clipboard:', err);
          return -1;
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
