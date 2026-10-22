import { useMemo } from 'react';
import { toast } from 'sonner';
import type { GraphNode, Quantity } from '../../engine/types';
import { deriveGraphView } from '../../engine/graph-view';
import { getNodeTitle } from '../../engine/node-utils';
import { useGraphStore } from '../../store/graph-store';
import { usePlayerStore } from '../../store/player-store';
import { useGraphActions } from '../graph-actions';
import { nodeAppearance, statusAppearance } from '../node-appearance';
import { adjustQuantity, quantityStep } from '../quantity';
import { ShortcutHint } from '../Kbd';
import { QuestPrereqsPanel } from '../nodes/QuestPrereqsPanel';
import { DiaryPrereqsPanel } from '../nodes/DiaryPrereqsPanel';
import { GroupTitleInput } from '../nodes/FoldGroupNode';
import { confirm } from '../ui/confirm';

export function NodeInspector({
  node,
  onShowPlanning,
}: {
  node: GraphNode;
  onShowPlanning: () => void;
}) {
  const actions = useGraphActions();
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const addNodeWithEdge = useGraphStore((s) => s.addNodeWithEdge);
  const addEdge = useGraphStore((s) => s.addEdge);
  const playerSkills = usePlayerStore((s) => s.skills);
  const status = useMemo(() => {
    const view = deriveGraphView({
      nodes,
      edges,
      selectedNodeIds: [node.id],
      selectedEdgeIds: [],
      hideCompleted: false,
    });
    return view.statuses.get(node.id) ?? 'available';
  }, [nodes, edges, node.id]);

  if (!actions) return null;

  const appearance = nodeAppearance(node.type);
  const title = getNodeTitle(node);
  const quantity = node.quantity;

  const remove = async () => {
    const edgeCount = edges.filter((edge) => edge.from === node.id || edge.to === node.id).length;
    const ok = await confirm(
      node.type === 'group'
        ? {
            title: 'Delete this group?',
            description: 'Its members stay on the canvas.',
            confirmLabel: 'Delete',
            tone: 'danger',
          }
        : {
            title: 'Delete this node?',
            ...(edgeCount > 0
              ? {
                  description: `This also removes ${edgeCount} edge${edgeCount === 1 ? '' : 's'}.`,
                }
              : {}),
            confirmLabel: 'Delete',
            tone: 'danger',
          },
    );
    if (!ok) return;
    actions.removeNode(node.id);
    toast.success(node.type === 'group' ? 'Group deleted' : 'Node deleted');
  };

  return (
    <div className="w-72 bg-surface-800 border-l border-surface-border flex flex-col overflow-hidden">
      <div className="p-3 border-b border-surface-border flex gap-1">
        <button type="button" className="flex-1 text-xs px-2.5 py-1 rounded bg-brand text-white">
          Selected
        </button>
        <button
          type="button"
          onClick={onShowPlanning}
          className="flex-1 text-xs px-2.5 py-1 rounded bg-surface-700 text-stone-300 hover:bg-surface-600"
        >
          Planning
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-sm shrink-0 ${appearance.swatch}`} />
            <span className="text-[10px] uppercase tracking-wide text-stone-400">
              {appearance.shortLabel}
            </span>
            <span className={`ml-auto w-1.5 h-1.5 rounded-full ${statusAppearance(status).dot}`} />
            <span className="text-[10px] uppercase text-stone-500">{status}</span>
          </div>
          {node.type === 'group' ? (
            <GroupTitleInput
              title={node.title}
              onRename={(next) => actions.updateNode(node.id, { title: next })}
            />
          ) : (
            <h2 className="text-sm font-medium text-white break-words">{title}</h2>
          )}
          {node.notes && (
            <p className="text-xs text-stone-400 mt-1 whitespace-pre-wrap">{node.notes}</p>
          )}
        </div>

        {node.type !== 'group' && (
          <button
            type="button"
            onClick={() => actions.toggleNodeComplete(node.id)}
            className={`text-xs py-1.5 px-2 rounded font-medium flex items-center justify-between gap-2 ${
              node.complete
                ? 'bg-surface-600 text-stone-300 hover:bg-surface-700'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
          >
            <span>{node.complete ? 'Completed' : 'Mark complete'}</span>
            <ShortcutHint id="toggleComplete" />
          </button>
        )}

        {node.type === 'group' && (
          <>
            <p className="text-xs text-stone-400">
              {node.groupData?.memberIds.length ?? 0} members
            </p>
            <button
              type="button"
              onClick={() => actions.toggleNodeComplete(node.id)}
              className="text-xs py-1.5 px-2 rounded font-medium bg-green-600 text-white hover:bg-green-500"
            >
              {node.complete ? 'Mark members incomplete' : 'Mark members complete'}
            </button>
          </>
        )}

        {quantity && (
          <QuantityEditor
            quantity={quantity}
            onChange={(next) => actions.updateNode(node.id, { quantity: next })}
          />
        )}

        {node.type === 'group' && (
          <button
            type="button"
            onClick={() => {
              actions.unfoldGroup(node.id);
              toast.success('Group unfolded');
            }}
            className="text-xs py-1.5 px-2 rounded font-medium bg-amber-700/80 text-white hover:bg-amber-600"
          >
            Unfold
          </button>
        )}

        {node.type !== 'group' && (
          <button
            type="button"
            onClick={() => actions.beginEdit(node.id)}
            className="text-xs py-1.5 px-2 rounded bg-brand/20 text-brand-text hover:bg-brand/30 border border-brand/30 flex items-center justify-between gap-2"
          >
            <span>Edit details</span>
            <ShortcutHint id="editNode" />
          </button>
        )}

        {node.type === 'quest' && node.questData && (
          <QuestPrereqsPanel
            questId={node.questData.questId}
            nodeId={node.id}
            nodes={nodes}
            edges={edges}
            playerSkills={playerSkills}
            onAddNodeWithEdge={addNodeWithEdge}
            onAddEdge={addEdge}
          />
        )}
        {node.type === 'diary' && node.diaryData && (
          <DiaryPrereqsPanel
            diaryId={node.diaryData.diaryId}
            nodeId={node.id}
            nodes={nodes}
            edges={edges}
            playerSkills={playerSkills}
            onAddNodeWithEdge={addNodeWithEdge}
            onAddEdge={addEdge}
          />
        )}

        <button
          type="button"
          onClick={remove}
          className="text-xs py-1.5 px-2 rounded text-red-400 hover:text-red-300 hover:bg-surface-700 flex items-center justify-between gap-2 mt-auto"
        >
          <span>{node.type === 'group' ? 'Delete group' : 'Delete'}</span>
          <ShortcutHint id="delete" />
        </button>
      </div>
    </div>
  );
}

function QuantityEditor({
  quantity,
  onChange,
}: {
  quantity: Quantity;
  onChange: (quantity: Quantity) => void;
}) {
  const setCurrent = (current: number) => onChange({ ...quantity, current });

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={quantity.current === 0}
          onClick={(event) =>
            setCurrent(adjustQuantity(quantity.current, quantity.target, -quantityStep(event)))
          }
          className="text-xs w-7 h-7 rounded bg-surface-700 text-stone-300 hover:bg-surface-600 disabled:opacity-50 shrink-0"
          title="−1  (shift: −10,  ctrl+shift: −100)"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          {...(quantity.target > 0 && { max: quantity.target })}
          value={quantity.current}
          onChange={(event) => {
            const raw = Math.max(0, Number(event.target.value) || 0);
            setCurrent(quantity.target > 0 ? Math.min(quantity.target, raw) : raw);
          }}
          className="min-w-0 flex-1 text-center text-xs bg-surface-700 text-stone-200 rounded border border-surface-border focus:border-brand focus:outline-none py-1 [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
        />
        {quantity.target > 0 && (
          <span className="text-xs text-stone-400 shrink-0">/ {quantity.target}</span>
        )}
        <button
          type="button"
          disabled={quantity.target > 0 && quantity.current >= quantity.target}
          onClick={(event) =>
            setCurrent(adjustQuantity(quantity.current, quantity.target, quantityStep(event)))
          }
          className="text-xs w-7 h-7 rounded bg-surface-700 text-stone-300 hover:bg-surface-600 disabled:opacity-50 shrink-0"
          title="+1  (shift: +10,  ctrl+shift: +100)"
        >
          +
        </button>
      </div>
      <p className="text-[10px] text-stone-500 text-center">shift ×10 · ctrl ×100</p>
    </div>
  );
}
