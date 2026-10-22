import React, { useState, useRef, useEffect, useMemo } from 'react';
import { OSRS_SKILLS } from '../engine/types';
import { ALL_QUESTS } from '../engine/quest-db';
import { ALL_BOSSES } from '../engine/boss-db';
import { ALL_DIARIES, getDiaryName } from '../engine/diary-db';
import { getItemName } from '../engine/item-db';
import type {
  GraphNode,
  NodeType,
  SkillName,
  Quantity,
  BossData,
  ItemData,
  DiaryData,
} from '../engine/types';
import { useGraphStore } from '../store/graph-store';
import { NodeTypeFields } from './node-dialog/TypeFields';
import { creatableNodeTypes } from '../engine/node-registry';
import { Dialog, dialogCancel } from './ui/dialog';
import { nodeAppearance } from './node-appearance';

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

const DiaryIcon = () => (
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
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
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

const KillIcon = () => (
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
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l2-2" />
    <path d="M17.5 14.5l2-2" />
    <path d="M19 22l-4-4" />
    <path d="M20 20l1 1" />
    <path d="M6.5 6.5l3-3" />
  </svg>
);

const ItemIcon = () => (
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
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
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

const TYPE_ICONS: Record<Exclude<NodeType, 'group'>, () => React.ReactElement> = {
  goal: GoalIcon,
  quest: QuestIcon,
  skill: SkillTypeIcon,
  diary: DiaryIcon,
  task: TaskIcon,
  kill: KillIcon,
  item: ItemIcon,
};

const NODE_TYPE_CONFIG = creatableNodeTypes().map((info) => {
  const appearance = nodeAppearance(info.type);
  const iconType = info.type === 'group' ? 'task' : info.type;
  return {
    value: info.type,
    label: info.label,
    description: info.description,
    Icon: TYPE_ICONS[iconType],
    formBorder: appearance.accentBorder,
    cardBorder: appearance.cardBorder,
    cardBg: appearance.cardBg,
    iconColor: appearance.iconColor,
    buttonClass: appearance.buttonClass,
  };
});

// --- Types ---

export interface NodeFormResult {
  type: NodeType;
  title: string;
  notes: string | undefined;
  skillData: { skillName: SkillName; targetLevel: number; boost: number | undefined } | undefined;
  questData: { questId: string } | undefined;
  bossData: BossData | undefined;
  itemData: ItemData | undefined;
  diaryData: DiaryData | undefined;
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
    initialNode?.questData?.questId ?? ALL_QUESTS[0]?.name ?? '',
  );
  const [diaryId, setDiaryId] = useState(
    initialNode?.diaryData?.diaryId ?? ALL_DIARIES[0]?.id ?? '',
  );
  const [bossId, setBossId] = useState(initialNode?.bossData?.bossId ?? ALL_BOSSES[0]?.id ?? '');
  const [itemId, setItemId] = useState(initialNode?.itemData?.itemId ?? '');
  const [quantityTarget, setQuantityTarget] = useState(
    initialNode?.quantity?.target.toString() ?? '',
  );
  const [kcCurrent, setKcCurrent] = useState(
    initialNode?.type === 'kill' ? (initialNode.quantity?.current.toString() ?? '0') : '0',
  );
  const [kcTarget, setKcTarget] = useState(
    initialNode?.type === 'kill' && initialNode.quantity?.target
      ? initialNode.quantity.target.toString()
      : '',
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
    if (type === 'diary' && !diaryId) return;
    if (type === 'kill' && !bossId) return;
    if (type === 'item' && !itemId) return;

    let finalTitle = title.trim();
    if (type === 'skill') {
      const level = Number(targetLevel) || 1;
      const boostVal = Number(boost) || 0;
      finalTitle =
        boostVal > 0 ? `${level - boostVal}+${boostVal} ${skillName}` : `${level} ${skillName}`;
    } else if (type === 'quest') {
      finalTitle = questId;
    } else if (type === 'diary') {
      finalTitle = getDiaryName(diaryId);
    } else if (type === 'kill') {
      finalTitle = bossId;
    } else if (type === 'item') {
      finalTitle = getItemName(itemId);
    }

    const qTarget = Number(quantityTarget);
    const killTarget = Number(kcTarget) || 0;
    const killCurrent = Number(kcCurrent) || 0;
    onSubmit({
      type,
      title: finalTitle || (initialNode?.title ?? ''),
      notes: notes.trim() || undefined,
      skillData:
        type === 'skill'
          ? { skillName, targetLevel: Number(targetLevel) || 1, boost: Number(boost) || undefined }
          : undefined,
      questData: type === 'quest' && questId ? { questId } : undefined,
      bossData: type === 'kill' && bossId ? { bossId } : undefined,
      itemData: type === 'item' && itemId ? { itemId } : undefined,
      diaryData:
        type === 'diary' && diaryId
          ? {
              diaryId,
              completed:
                initialNode?.diaryData?.diaryId === diaryId ? initialNode.diaryData.completed : [],
            }
          : undefined,
      quantity:
        type === 'kill'
          ? { target: killTarget, current: killCurrent }
          : qTarget > 0
            ? { target: qTarget, current: initialNode?.quantity?.current ?? 0 }
            : undefined,
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

  const hasTitle = type === 'goal' || type === 'task';
  const hasQuantity = hasTitle || type === 'item';
  const cfg = NODE_TYPE_CONFIG.find((c) => c.value === type)!;

  return (
    <Dialog
      title={isEdit ? `Edit ${cfg.label}` : `New ${cfg.label}`}
      onClose={onClose}
      width="md"
      className={`border-l-4 ${cfg.formBorder}`}
      footer={
        <>
          <button type="button" onClick={onClose} className={dialogCancel}>
            Cancel
          </button>
          <button
            type="submit"
            form="node-dialog-form"
            disabled={
              (hasTitle && !title.trim()) ||
              (type === 'skill' && !targetLevel) ||
              (type === 'kill' && !bossId) ||
              (type === 'item' && !itemId)
            }
            className={`px-3 py-1.5 text-sm text-white rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${cfg.buttonClass}`}
          >
            {isEdit ? 'Save' : `Add ${cfg.label}`}
          </button>
        </>
      }
    >
      <form id="node-dialog-form" onSubmit={handleSubmit}>
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
                  : 'border-surface-border hover:border-surface-600 hover:bg-surface-700/50'
              }`}
            >
              <div className={`mb-1.5 ${type === c.value ? c.iconColor : 'text-stone-500'}`}>
                <c.Icon />
              </div>
              <div
                className={`text-sm font-medium leading-none ${type === c.value ? 'text-white' : 'text-stone-400'}`}
              >
                {c.label}
              </div>
              <div className="text-xs text-stone-500 mt-1 leading-tight">{c.description}</div>
            </button>
          ))}
        </div>

        <NodeTypeFields
          type={type}
          isEdit={isEdit}
          title={title}
          onTitleChange={setTitle}
          titleInputRef={titleInputRef}
          itemId={itemId}
          onItemChange={setItemId}
          questId={questId}
          onQuestChange={setQuestId}
          diaryId={diaryId}
          onDiaryChange={setDiaryId}
          bossId={bossId}
          onBossChange={setBossId}
          kcCurrent={kcCurrent}
          onKcCurrentChange={setKcCurrent}
          kcTarget={kcTarget}
          onKcTargetChange={setKcTarget}
          skillName={skillName}
          onSkillChange={setSkillName}
          targetLevel={targetLevel}
          onTargetLevelChange={setTargetLevel}
          boost={boost}
          onBoostChange={setBoost}
        />

        {/* More options toggle */}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 mb-3 transition-colors"
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
            {/* Quantity target — goal/task/kill */}
            {hasQuantity && (
              <div>
                <label className="block text-xs text-stone-400 mb-1">
                  Quantity{' '}
                  <span className="text-stone-600">— track progress toward a count (optional)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-32 bg-surface-700 text-white rounded px-2 py-1.5 border border-surface-border focus:border-brand focus:outline-none text-sm"
                  value={quantityTarget}
                  onChange={(e) => setQuantityTarget(e.target.value)}
                  placeholder="e.g. 500"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs text-stone-400 mb-1">Notes</label>
              <textarea
                className="w-full bg-surface-700 text-white rounded px-2 py-1.5 border border-surface-border focus:border-brand focus:outline-none text-sm resize-y min-h-[48px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-stone-400 mb-1">Tags</label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-brand/20 text-brand-text text-xs px-2 py-0.5 rounded border border-brand/30"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-white leading-none"
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
                    className="w-full bg-surface-700 text-white text-xs rounded px-2 py-1 border border-surface-border focus:border-brand focus:outline-none"
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
                        e.stopPropagation();
                        setHighlightedIndex(-1);
                        setNewTag('');
                      }
                    }}
                    placeholder="Add tag..."
                  />
                  {tagInputFocused && suggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full mt-0.5 bg-surface-700 border border-surface-border rounded shadow-lg z-10 max-h-36 overflow-y-auto">
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
                                ? 'bg-brand text-white'
                                : 'text-stone-200 hover:bg-surface-600'
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
                  className="px-2 py-1 text-xs bg-brand text-white rounded hover:bg-brand-bright disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
}
