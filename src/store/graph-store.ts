import { create } from 'zustand';
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
}

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | undefined;
  selectedEdgeId: string | undefined;

  addNode: (params: AddNodeParams) => string;
  updateNode: (id: string, updates: Partial<Omit<GraphNode, 'id'>>) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  toggleNodeComplete: (id: string) => void;
  addEdge: (from: string, to: string, type: EdgeType) => string;
  removeEdge: (id: string) => void;
  reverseEdge: (id: string) => void;
  setEdgeType: (id: string, type: EdgeType) => void;
  selectNode: (id: string | undefined) => void;
  selectEdge: (id: string | undefined) => void;
  loadGraph: (data: GraphData) => void;
  mergeGraph: (data: { nodes: GraphNode[]; edges: GraphEdge[] }) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>()((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: undefined,
  selectedEdgeId: undefined,

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
    };
    set((state) => ({ nodes: [...state.nodes, node] }));
    return id;
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }));
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.from !== id && e.to !== id),
      selectedNodeId: state.selectedNodeId === id ? undefined : state.selectedNodeId,
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

  selectNode: (id) => {
    set({ selectedNodeId: id, selectedEdgeId: undefined });
  },

  selectEdge: (id) => {
    set({ selectedEdgeId: id, selectedNodeId: undefined });
  },

  loadGraph: (data) => {
    set({
      nodes: data.nodes,
      edges: data.edges,
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
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
    set({ nodes: [], edges: [], selectedNodeId: undefined, selectedEdgeId: undefined });
  },
}));
