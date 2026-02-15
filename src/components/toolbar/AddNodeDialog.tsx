import { useState } from 'react';
import { OSRS_SKILLS } from '../../engine/types';
import type { NodeType, SkillName, Quantity } from '../../engine/types';
import { SkillIcon } from '../SkillIcon';

const NODE_TYPES: { value: NodeType; label: string }[] = [
  { value: 'goal', label: 'Goal' },
  { value: 'quest', label: 'Quest' },
  { value: 'skill', label: 'Skill Target' },
  { value: 'unlock', label: 'Unlock' },
];

export interface AddNodeResult {
  type: NodeType;
  title: string;
  notes: string | undefined;
  skillData: { skillName: SkillName; targetLevel: number; boost: number | undefined } | undefined;
  questData: { questId: string } | undefined;
  quantity: Quantity | undefined;
}

interface AddNodeDialogProps {
  onSubmit: (result: AddNodeResult) => void;
  onClose: () => void;
}

export function AddNodeDialog({ onSubmit, onClose }: AddNodeDialogProps) {
  const [type, setType] = useState<NodeType>('goal');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [skillName, setSkillName] = useState<SkillName>(OSRS_SKILLS[0]);
  const [targetLevel, setTargetLevel] = useState('');
  const [boost, setBoost] = useState('');
  const [questId, setQuestId] = useState('');
  const [quantityTarget, setQuantityTarget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const qTarget = Number(quantityTarget);
    onSubmit({
      type,
      title: title.trim(),
      notes: notes.trim() || undefined,
      skillData:
        type === 'skill'
          ? { skillName, targetLevel: Number(targetLevel) || 1, boost: Number(boost) || undefined }
          : undefined,
      questData: type === 'quest' && questId.trim() ? { questId: questId.trim() } : undefined,
      quantity: qTarget > 0 ? { target: qTarget, current: 0 } : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-lg p-5 w-96 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Add Node</h2>

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

        <div className="mb-3">
          <label className="block text-xs uppercase text-gray-400 mb-1">Title</label>
          <input
            autoFocus
            className="w-full bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dragon Slayer II"
          />
        </div>

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

        {type === 'quest' && (
          <div className="mb-3">
            <label className="block text-xs uppercase text-gray-400 mb-1">Quest ID</label>
            <input
              className="w-full bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
              value={questId}
              onChange={(e) => setQuestId(e.target.value)}
              placeholder="Optional identifier"
            />
          </div>
        )}

        {(type === 'goal' || type === 'unlock') && (
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

        <div className="mb-4">
          <label className="block text-xs uppercase text-gray-400 mb-1">Notes</label>
          <textarea
            className="w-full bg-gray-700 text-white rounded px-2 py-1.5 border border-gray-600 focus:border-blue-400 focus:outline-none text-sm resize-y min-h-[48px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
          />
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
            disabled={!title.trim()}
            className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Node
          </button>
        </div>
      </form>
    </div>
  );
}
