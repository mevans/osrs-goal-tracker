import { useState, useRef, useEffect, useMemo } from 'react';
import { OSRS_SKILLS } from '../engine/types';
import { ALL_QUESTS } from '../engine/quest-db';
import type { GraphNode, NodeType, SkillName, Quantity } from '../engine/types';
import { SkillIcon } from './SkillIcon';
import { useGraphStore } from '../store/graph-store';

const NODE_TYPES: { value: NodeType; label: string }[] = [
  { value: 'goal', label: 'Goal' },
  { value: 'quest', label: 'Quest' },
  { value: 'skill', label: 'Skill Target' },
  { value: 'task', label: 'Task' },
];

export interface NodeFormResult {
  type: NodeType;
  title: string;
  notes: string | undefined;
  skillData: { skillName: SkillName; targetLevel: number; boost: number | undefined } | undefined;
  questData: { questId: string } | undefined;
  quantity: Quantity | undefined;
  tags: string[];
}

interface NodeDialogProps {
  initialNode?: GraphNode;
  onSubmit: (result: NodeFormResult) => void;
  onClose: () => void;
}

export function NodeDialog({ initialNode, onSubmit, onClose }: NodeDialogProps) {
  const isEdit = initialNode !== undefined;

  const [type, setType] = useState<NodeType>(initialNode?.type ?? 'task');
  const [title, setTitle] = useState(
    initialNode?.type === 'goal' || initialNode?.type === 'task' ? (initialNode.title ?? '') : '',
  );
  const [notes, setNotes] = useState(initialNode?.notes ?? '');
  const [skillName, setSkillName] = useState<SkillName>(
    initialNode?.skillData?.skillName ?? OSRS_SKILLS[0],
  );
  const [targetLevel, setTargetLevel] = useState(
    initialNode?.skillData?.targetLevel.toString() ?? '',
  );
  const [boost, setBoost] = useState(initialNode?.skillData?.boost?.toString() ?? '');
  const [questId, setQuestId] = useState(
    initialNode?.questData?.questId ?? ALL_QUESTS[0]?.id ?? '',
  );
  const [quantityTarget, setQuantityTarget] = useState(
    initialNode?.quantity?.target.toString() ?? '',
  );
  const [tags, setTags] = useState<string[]>(initialNode?.tags ?? []);
  const [newTag, setNewTag] = useState('');

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [tagInputFocused, setTagInputFocused] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // All unique tags across the graph, for autocomplete
  const allNodes = useGraphStore((s) => s.nodes);
  const allExistingTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of allNodes) {
      for (const t of n.tags) set.add(t);
    }
    return [...set].sort();
  }, [allNodes]);

  // Filtered suggestions: existing tags that match input, excluding already-added tags
  const suggestions = useMemo(() => {
    const q = newTag.trim().toLowerCase();
    if (!q) return allExistingTags;
    return allExistingTags.filter((t) => t.toLowerCase().includes(q) && !tags.includes(t));
  }, [newTag, allExistingTags, tags]);

  useEffect(() => {
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((type === 'goal' || type === 'task') && !title.trim()) return;
    if (type === 'skill' && !targetLevel) return;
    if (type === 'quest' && !questId) return;

    let finalTitle = title.trim();
    if (type === 'skill') {
      const level = Number(targetLevel) || 1;
      const boostVal = Number(boost) || 0;
      finalTitle =
        boostVal > 0 ? `${level - boostVal}+${boostVal} ${skillName}` : `${level} ${skillName}`;
    } else if (type === 'quest') {
      const quest = ALL_QUESTS.find((q) => q.id === questId);
      finalTitle = quest?.name ?? questId;
    }

    const qTarget = Number(quantityTarget);
    onSubmit({
      type,
      title: finalTitle || (initialNode?.title ?? ''),
      notes: notes.trim() || undefined,
      skillData:
        type === 'skill'
          ? { skillName, targetLevel: Number(targetLevel) || 1, boost: Number(boost) || undefined }
          : undefined,
      questData: type === 'quest' && questId ? { questId } : undefined,
      quantity:
        qTarget > 0 ? { target: qTarget, current: initialNode?.quantity?.current ?? 0 } : undefined,
      tags,
    });
  };

  const addTag = (value?: string) => {
    const trimmed = (value ?? newTag).trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag('');
    setHighlightedIndex(-1);
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const isGoalOrTask = type === 'goal' || type === 'task';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-lg p-5 w-96 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          {isEdit ? 'Edit Node' : 'Add Node'}
        </h2>

        {/* Type selector */}
        <div className="mb-3">
          <label className="block text-xs uppercase text-gray-400 mb-1">Type</label>
          <div className="grid grid-cols-4 gap-1">
            {NODE_TYPES.map((nt) => (
              <button
                key={nt.value}
                type="button"
                onClick={() => setType(nt.value)}
                className={`text-xs py-1.5 rounded font-medium transition-colors ${
                  type === nt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {nt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title — goal/task only */}
        {isGoalOrTask && (
          <div className="mb-3">
            <label className="block text-xs uppercase text-gray-400 mb-1">Title</label>
            <input
              ref={titleInputRef}
              className="w-full bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'goal' ? 'e.g. Fire Cape' : 'e.g. Unlock Piety'}
            />
          </div>
        )}

        {/* Quest select */}
        {type === 'quest' && (
          <div className="mb-3">
            <label className="block text-xs uppercase text-gray-400 mb-1">Quest</label>
            <select
              autoFocus
              className="w-full bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
              value={questId}
              onChange={(e) => setQuestId(e.target.value)}
            >
              {ALL_QUESTS.map((quest) => (
                <option key={quest.id} value={quest.id}>
                  {quest.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Skill fields */}
        {type === 'skill' && (
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="block text-xs uppercase text-gray-400 mb-1">Skill</label>
              <div className="flex items-center gap-2">
                <SkillIcon skill={skillName} size={20} />
                <select
                  className="flex-1 bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value as SkillName)}
                >
                  {OSRS_SKILLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="w-20">
              <label className="block text-xs uppercase text-gray-400 mb-1">Level</label>
              <input
                autoFocus
                type="number"
                min={1}
                max={99}
                className="w-full bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                placeholder="70"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs uppercase text-gray-400 mb-1">Boost</label>
              <input
                type="number"
                min={0}
                max={25}
                className="w-full bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
                value={boost}
                onChange={(e) => setBoost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* Quantity target — goal/task only */}
        {isGoalOrTask && (
          <div className="mb-3">
            <label className="block text-xs uppercase text-gray-400 mb-1">Quantity Target</label>
            <input
              type="number"
              min={0}
              className="w-32 bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
              value={quantityTarget}
              onChange={(e) => setQuantityTarget(e.target.value)}
              placeholder="e.g. 6"
            />
            <span className="text-xs text-gray-500 ml-2">Leave empty for non-tracked</span>
          </div>
        )}

        {/* Notes */}
        <div className="mb-3">
          <label className="block text-xs uppercase text-gray-400 mb-1">Notes</label>
          <textarea
            className="w-full bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm resize-y min-h-[48px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
          />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-xs uppercase text-gray-400 mb-1">Tags</label>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-blue-600/30 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-500/30"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-100 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:border-blue-400 focus:outline-none"
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => setTagInputFocused(true)}
                onBlur={() => setTagInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex((i) => Math.max(i - 1, -1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                      addTag(suggestions[highlightedIndex]);
                    } else {
                      addTag();
                    }
                  } else if (e.key === 'Escape') {
                    setHighlightedIndex(-1);
                    setNewTag('');
                  }
                }}
                placeholder="Add tag..."
              />
              {tagInputFocused && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-0.5 bg-gray-700 border border-gray-600 rounded shadow-lg z-10 max-h-36 overflow-y-auto">
                  {suggestions.map((tag, i) => (
                    <li key={tag}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // keep input focused
                          addTag(tag);
                        }}
                        className={`w-full text-left text-xs px-2 py-1 ${
                          i === highlightedIndex
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-200 hover:bg-gray-600'
                        }`}
                      >
                        {tag}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => addTag()}
              disabled={!newTag.trim()}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isGoalOrTask && !title.trim() ? true : type === 'skill' && !targetLevel ? true : false
            }
            className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEdit ? 'Save' : 'Add Node'}
          </button>
        </div>
      </form>
    </div>
  );
}
