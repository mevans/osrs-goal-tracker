import React, { useState, useRef, useEffect, useMemo } from 'react';
import { OSRS_SKILLS } from '../engine/types';
import { ALL_QUESTS } from '../engine/quest-db';
import type { GraphNode, NodeType, SkillName, Quantity } from '../engine/types';
import { SkillIcon } from './SkillIcon';
import { useGraphStore } from '../store/graph-store';

// --- Icons ---

const GoalIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const QuestIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const SkillTypeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TaskIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const ChevronDown = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// --- Type config ---

type TypeConfig = {
  value: NodeType;
  label: string;
  description: string;
  Icon: () => React.ReactElement;
  formBorder: string;
  cardBorder: string;
  cardBg: string;
  iconColor: string;
  buttonClass: string;
};

const NODE_TYPE_CONFIG: TypeConfig[] = [
  {
    value: 'goal',
    label: 'Goal',
    description: 'End goals & item grinds',
    Icon: GoalIcon,
    formBorder: 'border-l-amber-500',
    cardBorder: 'border-amber-500',
    cardBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    buttonClass: 'bg-amber-600 hover:bg-amber-500',
  },
  {
    value: 'quest',
    label: 'Quest',
    description: 'Quest completions',
    Icon: QuestIcon,
    formBorder: 'border-l-blue-500',
    cardBorder: 'border-blue-500',
    cardBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    buttonClass: 'bg-blue-600 hover:bg-blue-500',
  },
  {
    value: 'skill',
    label: 'Skill Target',
    description: 'Train a skill to a level',
    Icon: SkillTypeIcon,
    formBorder: 'border-l-green-500',
    cardBorder: 'border-green-500',
    cardBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    buttonClass: 'bg-green-700 hover:bg-green-600',
  },
  {
    value: 'task',
    label: 'Task',
    description: 'Actions & unlocks',
    Icon: TaskIcon,
    formBorder: 'border-l-purple-500',
    cardBorder: 'border-purple-500',
    cardBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    buttonClass: 'bg-purple-700 hover:bg-purple-600',
  },
];

// --- Types ---

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

// --- Component ---

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
  const [showMore, setShowMore] = useState(isEdit);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [tagInputFocused, setTagInputFocused] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  const allNodes = useGraphStore((s) => s.nodes);
  const allExistingTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of allNodes) {
      for (const t of n.tags) set.add(t);
    }
    return [...set].sort();
  }, [allNodes]);

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
  const cfg = NODE_TYPE_CONFIG.find((c) => c.value === type)!;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className={`bg-gray-800 border border-gray-700 border-l-4 ${cfg.formBorder} rounded-lg p-5 w-96 shadow-xl max-h-[90vh] overflow-y-auto`}
      >
        <h2 className="text-base font-semibold text-white mb-4">
          {isEdit ? `Edit ${cfg.label}` : `New ${cfg.label}`}
        </h2>

        {/* Type picker */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {NODE_TYPE_CONFIG.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setType(c.value)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                type === c.value
                  ? `${c.cardBorder} ${c.cardBg}`
                  : 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/50'
              }`}
            >
              <div className={`mb-1.5 ${type === c.value ? c.iconColor : 'text-gray-500'}`}>
                <c.Icon />
              </div>
              <div
                className={`text-sm font-medium leading-none ${type === c.value ? 'text-white' : 'text-gray-400'}`}
              >
                {c.label}
              </div>
              <div className="text-xs text-gray-500 mt-1 leading-tight">{c.description}</div>
            </button>
          ))}
        </div>

        {/* Title — goal/task only */}
        {isGoalOrTask && (
          <div className="mb-3">
            <input
              ref={titleInputRef}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'goal' ? 'e.g. Fire Cape' : 'e.g. Unlock Piety'}
            />
          </div>
        )}

        {/* Quest select */}
        {type === 'quest' && (
          <div className="mb-3">
            <select
              autoFocus
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
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
              <div className="flex items-center gap-2">
                <SkillIcon skill={skillName} size={20} />
                <select
                  className="flex-1 bg-gray-700 text-white rounded px-2 py-2 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
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
              <input
                autoFocus
                type="number"
                min={1}
                max={99}
                className="w-full bg-gray-700 text-white rounded px-2 py-2 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                placeholder="Level"
              />
            </div>
            <div className="w-20">
              <input
                type="number"
                min={0}
                max={25}
                className="w-full bg-gray-700 text-white rounded px-2 py-2 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
                value={boost}
                onChange={(e) => setBoost(e.target.value)}
                placeholder="Boost"
              />
            </div>
          </div>
        )}

        {/* More options toggle */}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors"
        >
          <span
            className={`transition-transform duration-150 ${showMore ? 'rotate-0' : '-rotate-90'}`}
          >
            <ChevronDown />
          </span>
          More options
        </button>

        {showMore && (
          <div className="space-y-3 mb-4">
            {/* Quantity target — goal/task only */}
            {isGoalOrTask && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Quantity{' '}
                  <span className="text-gray-600">— track progress toward a count (optional)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-32 bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
                  value={quantityTarget}
                  onChange={(e) => setQuantityTarget(e.target.value)}
                  placeholder="e.g. 500"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea
                className="w-full bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm resize-y min-h-[48px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tags</label>
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
                              e.preventDefault();
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
          </div>
        )}

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
            className={`px-3 py-1.5 text-sm text-white rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${cfg.buttonClass}`}
          >
            {isEdit ? 'Save' : `Add ${cfg.label}`}
          </button>
        </div>
      </form>
    </div>
  );
}
