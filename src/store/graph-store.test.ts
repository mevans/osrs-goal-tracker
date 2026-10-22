import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDiary } from '../engine/diary-db';
import type { AddNodeParams } from './graph-store';
import { useGraphStore } from './graph-store';
import { useSelectionStore } from './selection-store';

function params(overrides: Partial<AddNodeParams> = {}): AddNodeParams {
  return {
    type: 'task',
    title: 'Task',
    position: { x: 0, y: 0 },
    notes: undefined,
    skillData: undefined,
    questData: undefined,
    bossData: undefined,
    itemData: undefined,
    diaryData: undefined,
    quantity: undefined,
    tags: undefined,
    ...overrides,
  };
}

function store() {
  return useGraphStore.getState();
}

describe('graph store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});
    store().clearGraph();
    useGraphStore.temporal.getState().clear();
  });

  it('adds a node and connects it in either direction', () => {
    const goal = store().addNode(params({ type: 'goal', title: 'Fire cape', tags: ['pvm'] }));
    const quest = store().addNodeWithEdge(params({ type: 'quest', title: 'Fight caves' }), {
      to: goal,
      type: 'requires',
    });
    const gear = store().addNodeWithEdge(params({ type: 'task', title: 'Ranging potion' }), {
      from: goal,
      type: 'improves',
    });

    const { nodes, edges } = store();
    expect(nodes.find((n) => n.id === goal)).toMatchObject({
      title: 'Fire cape',
      complete: false,
      tags: ['pvm'],
    });
    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: quest, to: goal, type: 'requires' }),
        expect.objectContaining({ from: goal, to: gear, type: 'improves' }),
      ]),
    );
  });

  it('rejects a second edge between the same nodes, including the reverse direction', () => {
    const a = store().addNode(params({ title: 'A' }));
    const b = store().addNode(params({ title: 'B' }));
    expect(store().addEdge(a, b, 'requires')).not.toBe('');
    expect(store().addEdge(b, a, 'improves')).toBe('');
    expect(store().edges).toHaveLength(1);
  });

  it('reverses an edge and changes its type', () => {
    const a = store().addNode(params({ title: 'A' }));
    const b = store().addNode(params({ title: 'B' }));
    const edgeId = store().addEdge(a, b, 'requires');
    store().reverseEdge(edgeId);
    store().setEdgeType(edgeId, 'improves');
    expect(store().edges[0]).toMatchObject({ from: b, to: a, type: 'improves' });
  });

  it('removes a node together with its edges', () => {
    const a = store().addNode(params({ title: 'A' }));
    const b = store().addNode(params({ title: 'B' }));
    store().addEdge(a, b, 'requires');
    store().removeNode(a);
    expect(store().nodes.map((n) => n.id)).toEqual([b]);
    expect(store().edges).toEqual([]);
  });

  it('marks a quantity node complete when the count reaches the target', () => {
    const id = store().addNode(
      params({ type: 'goal', title: 'Bones', quantity: { target: 10, current: 0 } }),
    );
    store().updateNode(id, { quantity: { target: 10, current: 10 } });
    expect(store().nodes[0]).toMatchObject({ complete: true, quantity: { current: 10 } });

    store().updateNode(id, { quantity: { target: 10, current: 4 } });
    expect(store().nodes[0]?.complete).toBe(false);

    store().toggleNodeComplete(id);
    expect(store().nodes[0]).toMatchObject({
      complete: true,
      quantity: { current: 10, target: 10 },
    });
  });

  it('completes a diary when every task is checked, and when the node is marked complete', () => {
    const diary = getDiary('Ardougne|easy');
    expect(diary).toBeDefined();
    const taskCount = diary!.tasks.length;
    const id = store().addNode(
      params({
        type: 'diary',
        title: 'ignored',
        diaryData: { diaryId: 'Ardougne|easy', completed: [] },
      }),
    );

    for (let index = 0; index < taskCount; index++) {
      store().toggleDiaryTask(id, index);
    }
    expect(store().nodes[0]?.complete).toBe(true);

    store().toggleDiaryTask(id, 0);
    expect(store().nodes[0]?.complete).toBe(false);

    store().toggleNodeComplete(id);
    const completed = store().nodes[0]?.diaryData?.completed ?? [];
    expect(store().nodes[0]?.complete).toBe(true);
    expect(completed.length).toBe(taskCount);
    expect(completed.every(Boolean)).toBe(true);
  });

  it('completes a folded group by completing its members', () => {
    const a = store().addNode(params({ title: 'A', position: { x: 0, y: 0 } }));
    const b = store().addNode(params({ title: 'B', position: { x: 40, y: 0 } }));
    const groupId = store().createFoldGroup([a, b], 'Pair');
    expect(groupId).toBeTruthy();

    store().toggleNodeComplete(groupId!);
    const nodes = store().nodes;
    expect(nodes.find((n) => n.id === a)?.complete).toBe(true);
    expect(nodes.find((n) => n.id === b)?.complete).toBe(true);
    expect(nodes.find((n) => n.id === groupId)?.complete).toBe(true);
  });

  it('moves folded members with the group and dissolves a group that loses a member', () => {
    const a = store().addNode(params({ title: 'A', position: { x: 0, y: 0 } }));
    const b = store().addNode(params({ title: 'B', position: { x: 30, y: 10 } }));
    const groupId = store().createFoldGroup([a, b], 'Pair')!;
    const beforeA = store().nodes.find((n) => n.id === a)!.position;
    const beforeGroup = store().nodes.find((n) => n.id === groupId)!.position;

    store().moveNode(groupId, { x: beforeGroup.x + 80, y: beforeGroup.y + 25 });
    const afterA = store().nodes.find((n) => n.id === a)!.position;
    expect(afterA).toEqual({ x: beforeA.x + 80, y: beforeA.y + 25 });

    store().removeNode(b);
    expect(store().nodes.some((n) => n.type === 'group')).toBe(false);
    expect(store().nodes.some((n) => n.id === a)).toBe(true);
  });

  it('refuses a fold of fewer than two plain nodes', () => {
    const a = store().addNode(params({ title: 'A' }));
    expect(store().createFoldGroup([a], 'Nope')).toBeNull();
  });

  it('selects members when a group is unfolded or deleted', () => {
    const a = store().addNode(params({ title: 'A' }));
    const b = store().addNode(params({ title: 'B' }));
    const groupId = store().createFoldGroup([a, b], 'Pair')!;

    store().unfoldGroup(groupId);
    expect(store().nodes.some((n) => n.type === 'group')).toBe(false);
    expect(useSelectionStore.getState().selectedNodeIds.sort()).toEqual([a, b].sort());

    const again = store().createFoldGroup([a, b], 'Pair')!;
    store().removeNode(again);
    expect(useSelectionStore.getState().selectedNodeIds.sort()).toEqual([a, b].sort());
  });

  it('duplicates nodes without their completion, keeping edges between them', () => {
    const a = store().addNode(params({ title: 'A', position: { x: 0, y: 0 } }));
    const b = store().addNode(params({ title: 'B', position: { x: 10, y: 0 } }));
    store().addEdge(a, b, 'requires');
    store().toggleNodeComplete(a);

    const copies = store().duplicateNodes([a, b]);
    expect(copies).toHaveLength(2);
    const copyNodes = store().nodes.filter((n) => copies.includes(n.id));
    expect(copyNodes.every((n) => !n.complete)).toBe(true);
    expect(
      store().edges.some(
        (e) => copies.includes(e.from) && copies.includes(e.to) && e.type === 'requires',
      ),
    ).toBe(true);
  });

  it('undo and redo restore graph edits and ignore selection-only changes', () => {
    const id = store().addNode(params({ title: 'A' }));
    useSelectionStore.getState().selectNodes([id]);
    useGraphStore.temporal.getState().undo();
    expect(store().nodes).toEqual([]);

    useGraphStore.temporal.getState().redo();
    expect(store().nodes.map((n) => n.title)).toEqual(['A']);
  });

  it('auto-completes a skill at the target level and never clears an existing completion', () => {
    const id = store().addNode(
      params({
        type: 'skill',
        title: 'ignored',
        skillData: { skillName: 'Prayer', targetLevel: 70, boost: 5 },
      }),
    );

    store().syncPlayerData({ Prayer: 69 });
    expect(store().nodes[0]?.complete).toBe(false);

    store().syncPlayerData({ Prayer: 70 });
    expect(store().nodes[0]?.complete).toBe(true);

    store().syncPlayerData({ Prayer: 10 });
    expect(store().nodes.find((n) => n.id === id)?.complete).toBe(true);
  });

  it('raises boss kill counts and does not lower them', () => {
    store().addNode(
      params({
        type: 'kill',
        title: 'Sire',
        bossData: { bossId: 'Abyssal Sire' },
        quantity: { target: 100, current: 10 },
      }),
    );

    store().syncBossKcs({ 'Abyssal Sire': 40 });
    expect(store().nodes[0]?.quantity?.current).toBe(40);

    store().syncBossKcs({ 'Abyssal Sire': 5 });
    expect(store().nodes[0]?.quantity?.current).toBe(40);
  });

  it('clears completion progress without deleting the plan', () => {
    const id = store().addNode(
      params({ type: 'goal', title: 'Bones', quantity: { target: 5, current: 5 } }),
    );
    store().updateNode(id, { quantity: { target: 5, current: 5 } });
    store().setNotes('keep me');
    store().clearNodeCompletions();

    expect(store().nodes[0]).toMatchObject({
      complete: false,
      quantity: { current: 0, target: 5 },
    });
    expect(store().notes).toBe('keep me');
  });

  it('loads, merges, and clears a graph', () => {
    const existing = store().addNode(params({ title: 'Stay' }));
    store().mergeGraph({
      nodes: [
        {
          ...params({ title: 'Imported' }),
          id: 'imported',
          complete: false,
          groupData: undefined,
          tags: [],
        },
        {
          ...params({ title: 'Duplicate id' }),
          id: existing,
          complete: false,
          groupData: undefined,
          tags: [],
        },
      ],
      edges: [{ id: 'e', from: 'imported', to: existing, type: 'requires' }],
    });
    expect(
      store()
        .nodes.map((n) => n.title)
        .sort(),
    ).toEqual(['Imported', 'Stay']);

    store().loadGraph({ nodes: [], edges: [], notes: 'fresh' });
    expect(store().nodes).toEqual([]);
    expect(store().notes).toBe('fresh');
    store().setNotes('');
    expect(store().notes).toBeUndefined();

    store().addNode(params({ title: 'Gone' }));
    store().clearGraph();
    expect(store().nodes).toEqual([]);
  });

  it('copies and pastes the selection around the requested point', async () => {
    let clip = '';
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: async (text: string) => {
          clip = text;
        },
        readText: async () => clip,
      },
    });

    const a = store().addNode(params({ title: 'A', position: { x: 0, y: 0 } }));
    const b = store().addNode(params({ title: 'B', position: { x: 20, y: 0 } }));
    store().addEdge(a, b, 'requires');
    store().toggleNodeComplete(a);
    useSelectionStore.getState().selectNodes([a, b]);

    expect(await store().copySelection()).toBe(2);
    expect(await store().pasteClipboard({ x: 200, y: 100 })).toBe(2);

    const pasted = store().nodes.filter((n) => n.id !== a && n.id !== b);
    expect(pasted.every((n) => !n.complete)).toBe(true);
    const xs = pasted.map((n) => n.position.x);
    const ys = pasted.map((n) => n.position.y);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBe(200);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBe(100);
    expect(
      store().edges.some(
        (e) => pasted.some((n) => n.id === e.from) && pasted.some((n) => n.id === e.to),
      ),
    ).toBe(true);

    vi.unstubAllGlobals();
  });

  it('reports an empty or unreadable clipboard', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: async () => {},
        readText: async () => 'not json',
      },
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await store().copySelection()).toBe(0);
    expect(await store().pasteClipboard({ x: 0, y: 0 })).toBe(-1);

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
