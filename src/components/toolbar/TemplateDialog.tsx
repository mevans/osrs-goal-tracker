import { useState } from 'react';
import { OSRS_SKILLS } from '../../engine/types';
import type { SkillName } from '../../engine/types';
import type { TemplateDefinition, TemplateNode, SoftDecision } from '../../templates/types';
import { allTemplates } from '../../templates/example-template';
import { SkillIcon } from '../SkillIcon';

type Stage = 'pick' | 'configure' | 'review';

interface TemplateDialogProps {
  onApply: (template: TemplateDefinition, decisions: Map<string, SoftDecision>) => void;
  onClose: () => void;
}

export function TemplateDialog({ onApply, onClose }: TemplateDialogProps) {
  const [stage, setStage] = useState<Stage>('pick');
  const [template, setTemplate] = useState<TemplateDefinition | undefined>(undefined);
  const [decisions, setDecisions] = useState<Map<string, SoftDecision>>(new Map());
  const [editingKey, setEditingKey] = useState<string | undefined>(undefined);

  const softNodes = template?.nodes.filter((n) => n.requirement === 'soft') ?? [];
  const hardNodes = template?.nodes.filter((n) => n.requirement === 'hard') ?? [];

  const handlePickTemplate = (t: TemplateDefinition) => {
    setTemplate(t);
    // Default all soft nodes to 'keep'
    const defaults = new Map<string, SoftDecision>();
    for (const node of t.nodes) {
      if (node.requirement === 'soft') {
        defaults.set(node.key, { action: 'keep' });
      }
    }
    setDecisions(defaults);
    setStage('configure');
  };

  const setDecision = (key: string, decision: SoftDecision) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      next.set(key, decision);
      return next;
    });
  };

  const handleApply = () => {
    if (template) {
      onApply(template, decisions);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-[540px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {stage === 'pick' && 'Choose Template'}
            {stage === 'configure' && template?.name}
            {stage === 'review' && 'Review'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">
            Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {stage === 'pick' && (
            <div className="space-y-2">
              {allTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handlePickTemplate(t)}
                  className="w-full text-left bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition-colors"
                >
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          )}

          {stage === 'configure' && template && (
            <div className="space-y-4">
              {/* Hard requirements (locked) */}
              {hardNodes.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    Required — always included
                  </div>
                  <div className="space-y-1.5">
                    {hardNodes.map((node) => (
                      <HardNodeRow key={node.key} node={node} />
                    ))}
                  </div>
                </div>
              )}

              {/* Soft requirements (configurable) */}
              {softNodes.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    Recommended — keep, edit, or discard
                  </div>
                  <div className="space-y-2">
                    {softNodes.map((node) => (
                      <SoftNodeRow
                        key={node.key}
                        node={node}
                        decision={decisions.get(node.key) ?? { action: 'keep' }}
                        isEditing={editingKey === node.key}
                        onDecision={(d) => setDecision(node.key, d)}
                        onStartEdit={() => setEditingKey(node.key)}
                        onStopEdit={() => setEditingKey(undefined)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {stage === 'configure' && (
          <div className="p-4 border-t border-gray-700 flex items-center justify-between">
            <button
              onClick={() => { setStage('pick'); setTemplate(undefined); }}
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
            >
              Back
            </button>
            <div className="text-xs text-gray-500">
              {softNodes.filter((n) => decisions.get(n.key)?.action !== 'discard').length} of{' '}
              {softNodes.length} recommendations kept
            </div>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded font-medium"
            >
              Apply Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const TYPE_BADGES: Record<string, string> = {
  goal: 'bg-amber-900/60 text-amber-300',
  quest: 'bg-blue-900/60 text-blue-300',
  skill: 'bg-green-900/60 text-green-300',
  unlock: 'bg-purple-900/60 text-purple-300',
};

function HardNodeRow({ node }: { node: TemplateNode }) {
  return (
    <div className="flex items-center gap-2 bg-gray-700/50 rounded px-3 py-2">
      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-medium ${TYPE_BADGES[node.type] ?? ''}`}>
        {node.type}
      </span>
      {node.skillData && <SkillIcon skill={node.skillData.skillName} size={14} />}
      <span className="text-sm text-white">{node.title}</span>
      <span className="text-xs text-gray-500 ml-auto">required</span>
    </div>
  );
}

function SoftNodeRow({
  node,
  decision,
  isEditing,
  onDecision,
  onStartEdit,
  onStopEdit,
}: {
  node: TemplateNode;
  decision: SoftDecision;
  isEditing: boolean;
  onDecision: (d: SoftDecision) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const discarded = decision.action === 'discard';
  const edited = decision.action === 'edit';

  const displayTitle = edited ? (decision.edits.title ?? node.title) : node.title;
  return (
    <div className={`rounded border ${discarded ? 'border-gray-700 opacity-50' : 'border-gray-600'} bg-gray-700/50`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-medium ${TYPE_BADGES[node.type] ?? ''}`}>
          {node.type}
        </span>
        {node.skillData && <SkillIcon skill={node.skillData.skillName} size={14} />}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white truncate">
            {displayTitle}
            {edited && <span className="text-xs text-blue-400 ml-1">(edited)</span>}
          </div>
          <div className="text-xs text-gray-400">{node.rationale}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!discarded && (
            <button
              onClick={() => { onStartEdit(); }}
              className="text-xs text-gray-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-gray-600"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => onDecision(discarded ? { action: 'keep' } : { action: 'discard' })}
            className={`text-xs px-1.5 py-0.5 rounded ${
              discarded
                ? 'text-green-400 hover:bg-gray-600'
                : 'text-red-400 hover:bg-gray-600'
            }`}
          >
            {discarded ? 'Restore' : 'Discard'}
          </button>
        </div>
      </div>

      {isEditing && !discarded && (
        <EditPanel
          node={node}
          decision={decision}
          onSave={(edits) => {
            onDecision({ action: 'edit', edits });
            onStopEdit();
          }}
          onCancel={onStopEdit}
        />
      )}
    </div>
  );
}

function EditPanel({
  node,
  decision,
  onSave,
  onCancel,
}: {
  node: TemplateNode;
  decision: SoftDecision;
  onSave: (edits: NonNullable<Extract<SoftDecision, { action: 'edit' }>['edits']>) => void;
  onCancel: () => void;
}) {
  const currentEdits = decision.action === 'edit' ? decision.edits : {};

  const [title, setTitle] = useState(currentEdits.title ?? node.title);
  const [skillNameEdit, setSkillNameEdit] = useState<SkillName>(
    currentEdits.skillData?.skillName ?? node.skillData?.skillName ?? OSRS_SKILLS[0],
  );
  const [skillLevel, setSkillLevel] = useState(
    String(currentEdits.skillData?.targetLevel ?? node.skillData?.targetLevel ?? ''),
  );
  const [skillBoost, setSkillBoost] = useState(
    String(currentEdits.skillData?.boost ?? node.skillData?.boost ?? ''),
  );
  const [notes, setNotes] = useState(currentEdits.notes ?? node.notes ?? '');

  const handleSave = () => {
    const edits: Record<string, unknown> = {};

    if (title !== node.title) edits['title'] = title;
    if (notes !== (node.notes ?? '')) edits['notes'] = notes || undefined;

    if (node.skillData) {
      const nameChanged = skillNameEdit !== node.skillData.skillName;
      const levelChanged = skillLevel !== String(node.skillData.targetLevel);
      const boostChanged = (Number(skillBoost) || 0) !== (node.skillData.boost ?? 0);
      if (nameChanged || levelChanged || boostChanged) {
        edits['skillData'] = {
          skillName: skillNameEdit,
          targetLevel: Number(skillLevel) || node.skillData.targetLevel,
          boost: Number(skillBoost) || undefined,
        };
      }
    }

    onSave(edits as NonNullable<Extract<SoftDecision, { action: 'edit' }>['edits']>);
  };

  return (
    <div className="px-3 py-2 border-t border-gray-600 space-y-2">
      <div>
        <label className="block text-[10px] uppercase text-gray-400 mb-0.5">Title</label>
        <input
          className="w-full bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:border-blue-400 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {node.skillData && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] uppercase text-gray-400 mb-0.5">Skill</label>
            <div className="flex items-center gap-1.5">
              <SkillIcon skill={skillNameEdit} size={18} />
              <select
                className="flex-1 bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:border-blue-400 focus:outline-none"
                value={skillNameEdit}
                onChange={(e) => setSkillNameEdit(e.target.value as SkillName)}
              >
                {OSRS_SKILLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="w-20">
            <label className="block text-[10px] uppercase text-gray-400 mb-0.5">Level</label>
            <input
              type="number"
              min={1}
              max={99}
              className="w-full bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:border-blue-400 focus:outline-none"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
            />
          </div>
          <div className="w-20">
            <label className="block text-[10px] uppercase text-gray-400 mb-0.5">Boost</label>
            <input
              type="number"
              min={0}
              max={25}
              className="w-full bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:border-blue-400 focus:outline-none"
              value={skillBoost}
              onChange={(e) => setSkillBoost(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-[10px] uppercase text-gray-400 mb-0.5">Notes</label>
        <input
          className="w-full bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:border-blue-400 focus:outline-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="text-xs text-white bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}
