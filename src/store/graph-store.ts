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
  BossData,
  ItemData,
} from '../engine/types';
import { generateId } from '../engine/types';
import {
  isGroupMember,
  resolveStoredEdgeId,
  expandCompletionTargetIds,
  expandCopyTargetIds,
  collectUnfoldSelection,
  applyPositionUpdates,
  syncGroupCompletionStates,
} from '../engine/fold-view';
import { analytics } from '../analytics';

function pruneGroupsAfterMemberRemoval(nodes: GraphNode[], removedIds: Set<string>): GraphNode[] {
  return nodes
    .map((n) => {
      if (n.type !== 'group' || !n.groupData) return n;
      const memberIds = n.groupData.memberIds.filter((id) => !removedIds.has(id));
      if (memberIds.length < 2) return null;
      return { ...n, groupData: { ...n.groupData, memberIds } };
    })
    .filter((n): n is GraphNode => n !== null);
}

export interface AddNodeParams {
  type: NodeType;
  title: string;
  position: { x: number; y: number };
  notes: string | undefined;
  skillData: { skillName: SkillName; targetLevel: number; boost: number | undefined } | undefined;
  questData: { questId: string } | undefined;
  bossData: BossData | undefined;
  itemData: ItemData | undefined;
  quantity: Quantity | undefined;
  tags: string[] | undefined;
}

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  notes: string | undefined;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  addNode: (params: AddNodeParams) => string;
  addNodeWithEdge: (
    params: AddNodeParams,
    edge: { to: string; type: EdgeType } | { from: string; type: EdgeType },
  ) => string;
  updateNode: (id: string, updates: Partial<Omit<GraphNode, 'id'>>) => void;
  removeNode: (id: string) => void;
  removeNodes: (ids: string[]) => void;
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
  setNotes: (notes: string | undefined) => void;
  mergeGraph: (data: { nodes: GraphNode[]; edges: GraphEdge[] }) => void;
  syncPlayerData: (skills: Partial<Record<SkillName, number>>) => void;
  syncBossKcs: (kcs: Record<string, number>) => void;
  clearNodeCompletions: () => void;
  clearGraph: () => void;
  createFoldGroup: (memberIds: string[], title: string | undefined) => string | null;
  unfoldGroup: (groupId: string) => void;
}

export const useGraphStore = create<GraphState>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      notes: undefined,
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
          bossData: params.bossData ?? undefined,
          itemData: params.itemData ?? undefined,
          quantity: params.quantity ?? undefined,
          groupData: undefined,
          tags: params.tags ?? [],
        };
        set((state) => ({ nodes: [...state.nodes, node] }));
        return id;
      },

      addNodeWithEdge: (params, edgeSpec) => {
        const nodeId = generateId();
        const node: GraphNode = {
          id: nodeId,
          type: params.type,
          title: params.title,
          position: params.position,
          complete: false,
          notes: params.notes ?? undefined,
          skillData: params.skillData ?? undefined,
          questData: params.questData ?? undefined,
          bossData: params.bossData ?? undefined,
          itemData: params.itemData ?? undefined,
          quantity: params.quantity ?? undefined,
          groupData: undefined,
          tags: params.tags ?? [],
        };
        const from = 'from' in edgeSpec ? edgeSpec.from : nodeId;
        const to = 'to' in edgeSpec ? edgeSpec.to : nodeId;
        set((state) => {
          const duplicate = state.edges.some(
            (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
          );
          const edge: GraphEdge = { id: generateId(), from, to, type: edgeSpec.type };
          return {
            nodes: [...state.nodes, node],
            edges: duplicate ? state.edges : [...state.edges, edge],
          };
        });
        analytics.edgeCreated();
        return nodeId;
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
        set((state) => {
          const removedIds = new Set([id]);
          const unfolded = collectUnfoldSelection(removedIds, state.nodes);
          return {
            nodes: pruneGroupsAfterMemberRemoval(
              state.nodes.filter((n) => n.id !== id),
              removedIds,
            ),
            edges: state.edges.filter((e) => e.from !== id && e.to !== id),
            selectedNodeIds:
              unfolded.length > 0 ? unfolded : state.selectedNodeIds.filter((nid) => nid !== id),
            selectedEdgeIds: unfolded.length > 0 ? [] : state.selectedEdgeIds,
          };
        });
      },

      removeNodes: (ids) => {
        const idSet = new Set(ids);
        set((state) => {
          const unfolded = collectUnfoldSelection(idSet, state.nodes);
          return {
            nodes: pruneGroupsAfterMemberRemoval(
              state.nodes.filter((n) => !idSet.has(n.id)),
              idSet,
            ),
            edges: state.edges.filter((e) => !idSet.has(e.from) && !idSet.has(e.to)),
            selectedNodeIds:
              unfolded.length > 0
                ? unfolded
                : state.selectedNodeIds.filter((nid) => !idSet.has(nid)),
            selectedEdgeIds: unfolded.length > 0 ? [] : state.selectedEdgeIds,
          };
        });
      },

      moveNode: (id, position) => {
        set((state) => ({
          nodes: applyPositionUpdates(state.nodes, new Map([[id, position]])),
        }));
      },

      moveNodes: (positions) => {
        const posMap = new Map(positions.map((p) => [p.id, p.position]));
        set((state) => ({
          nodes: applyPositionUpdates(state.nodes, posMap),
        }));
      },

      toggleNodeComplete: (id) => {
        set((state) => {
          const targetIds = expandCompletionTargetIds([id], state.nodes);
          if (targetIds.length === 0) return state;

          const targetSet = new Set(targetIds);
          const allComplete = targetIds.every(
            (tid) => state.nodes.find((n) => n.id === tid)?.complete,
          );
          const newComplete = !allComplete;

          let nodes = state.nodes.map((n) => {
            if (!targetSet.has(n.id)) return n;
            if (newComplete) analytics.nodeCompleted(n.type);
            if (newComplete && n.quantity) {
              return {
                ...n,
                complete: true,
                quantity: { ...n.quantity, current: n.quantity.target },
              };
            }
            return { ...n, complete: newComplete };
          });
          nodes = syncGroupCompletionStates(nodes);
          return { nodes };
        });
      },

      toggleNodesComplete: (ids) => {
        set((state) => {
          const targetIds = expandCompletionTargetIds(ids, state.nodes);
          if (targetIds.length === 0) return state;

          const idsSet = new Set(targetIds);
          const allComplete = targetIds.every(
            (tid) => state.nodes.find((n) => n.id === tid)?.complete,
          );
          const newComplete = !allComplete;

          let nodes = state.nodes.map((n) => {
            if (!idsSet.has(n.id)) return n;
            if (newComplete) analytics.nodeCompleted(n.type);
            if (newComplete && n.quantity) {
              return {
                ...n,
                complete: true,
                quantity: { ...n.quantity, current: n.quantity.target },
              };
            }
            return { ...n, complete: newComplete };
          });
          nodes = syncGroupCompletionStates(nodes);
          return { nodes };
        });
      },

      duplicateNodes: (ids) => {
        const state = get();
        const nodesToDupe = state.nodes.filter((n) => ids.includes(n.id) && n.type !== 'group');
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
        const realId = resolveStoredEdgeId(id);
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== realId),
        }));
      },

      reverseEdge: (id) => {
        const realId = resolveStoredEdgeId(id);
        set((state) => ({
          edges: state.edges.map((e) => (e.id === realId ? { ...e, from: e.to, to: e.from } : e)),
        }));
      },

      setEdgeType: (id, type) => {
        const realId = resolveStoredEdgeId(id);
        set((state) => ({
          edges: state.edges.map((e) => (e.id === realId ? { ...e, type } : e)),
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
        const copyIds = expandCopyTargetIds(state.selectedNodeIds, state.nodes);
        const selectedSet = new Set(copyIds);
        const nodesToCopy = state.nodes.filter((n) => selectedSet.has(n.id) && n.type !== 'group');
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

          const pasteNodes = clipboardData.nodes.filter((n) => n.type !== 'group');
          if (pasteNodes.length === 0) return 0;

          // Compute bounding center of clipboard nodes so we can center them at the target
          const xs = pasteNodes.map((n) => n.position.x);
          const ys = pasteNodes.map((n) => n.position.y);
          const clipCenterX = (Math.min(...xs) + Math.max(...xs)) / 2;
          const clipCenterY = (Math.min(...ys) + Math.max(...ys)) / 2;
          const dx = center.x - clipCenterX;
          const dy = center.y - clipCenterY;

          const idMap = new Map<string, string>();
          const newNodes = pasteNodes.map((node) => {
            const newId = generateId();
            idMap.set(node.id, newId);
            return {
              ...node,
              id: newId,
              position: { x: node.position.x + dx, y: node.position.y + dy },
              complete: false,
            };
          });

          const newEdges = clipboardData.edges
            .filter((edge) => idMap.has(edge.from) && idMap.has(edge.to))
            .map((edge) => ({
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
          notes: data.notes ?? undefined,
          selectedNodeIds: [],
          selectedEdgeIds: [],
        });
      },

      setNotes: (notes) => set({ notes: notes || undefined }),

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

      syncPlayerData: (skills) => {
        set((state) => {
          let nodes = state.nodes.map((n) => {
            if (n.complete) return n; // never auto-un-complete
            if (n.type === 'skill' && n.skillData) {
              const playerLevel = skills[n.skillData.skillName];
              if (playerLevel !== undefined && playerLevel >= n.skillData.targetLevel) {
                return { ...n, complete: true };
              }
            }
            return n;
          });
          nodes = syncGroupCompletionStates(nodes);
          return { nodes };
        });
      },

      syncBossKcs: (kcs) => {
        set((state) => {
          let nodes = state.nodes.map((n) => {
            if (n.type !== 'kill' || !n.bossData) return n;
            const womKc = kcs[n.bossData.bossId];
            if (!womKc) return n;
            const currentKc = n.quantity?.current ?? 0;
            if (womKc <= currentKc) return n; // never decrement
            return {
              ...n,
              quantity: { target: n.quantity?.target ?? 0, current: womKc },
            };
          });
          nodes = syncGroupCompletionStates(nodes);
          return { nodes };
        });
      },

      clearNodeCompletions: () => {
        set((state) => {
          let nodes = state.nodes.map((n) => ({
            ...n,
            complete: false,
            quantity: n.quantity ? { ...n.quantity, current: 0 } : undefined,
          }));
          nodes = syncGroupCompletionStates(nodes);
          return { nodes };
        });
      },

      clearGraph: () => {
        set({ nodes: [], edges: [], notes: undefined, selectedNodeIds: [], selectedEdgeIds: [] });
      },

      createFoldGroup: (memberIds, title) => {
        const state = get();
        const uniqueIds = [...new Set(memberIds)];
        if (uniqueIds.length < 2) return null;

        const members = state.nodes.filter((n) => uniqueIds.includes(n.id));
        if (members.length < 2) return null;
        if (members.some((n) => n.type === 'group')) return null;
        if (members.some((n) => isGroupMember(n.id, state.nodes))) return null;

        const cx = members.reduce((sum, n) => sum + n.position.x, 0) / members.length;
        const cy = members.reduce((sum, n) => sum + n.position.y, 0) / members.length;
        const groupId = generateId();
        const groupNode: GraphNode = {
          id: groupId,
          type: 'group',
          title: title ?? `${members.length} nodes`,
          position: { x: cx, y: cy },
          complete: members.every((m) => m.complete),
          notes: undefined,
          skillData: undefined,
          questData: undefined,
          bossData: undefined,
          itemData: undefined,
          quantity: undefined,
          groupData: { memberIds: uniqueIds },
          tags: [],
        };

        set({
          nodes: [...state.nodes, groupNode],
          selectedNodeIds: [groupId],
          selectedEdgeIds: [],
        });
        return groupId;
      },

      unfoldGroup: (groupId) => {
        const group = get().nodes.find((n) => n.id === groupId);
        const memberIds = group?.groupData?.memberIds ?? [];
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== groupId),
          selectedNodeIds:
            memberIds.length > 0 ? memberIds : state.selectedNodeIds.filter((id) => id !== groupId),
          selectedEdgeIds: [],
        }));
      },
    }),
    {
      limit: 50,
      equality: (a, b) => a.nodes === b.nodes && a.edges === b.edges,
    },
  ),
);
