import type { RefObject } from 'react';
import { OSRS_SKILLS, type SkillName } from '../../engine/types';
import { ALL_QUESTS } from '../../engine/quest-db';
import { ALL_BOSSES } from '../../engine/boss-db';
import { ALL_DIARIES, DIARY_AREAS } from '../../engine/diary-db';
import type { NodeType } from '../../engine/types';
import { SkillIcon } from '../SkillIcon';
import { BossIcon } from '../BossIcon';
import { ItemPicker } from '../ItemPicker';

const fieldClass =
  'w-full bg-surface-700 text-white rounded px-3 py-2 border border-surface-border focus:border-brand focus:outline-none text-sm';

export function TitleField({
  type,
  title,
  onChange,
  inputRef,
}: {
  type: NodeType;
  title: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="mb-3">
      <input
        ref={inputRef}
        className={fieldClass}
        value={title}
        onChange={(e) => onChange(e.target.value)}
        placeholder={type === 'goal' ? 'e.g. Fire Cape' : 'e.g. Unlock Piety'}
      />
    </div>
  );
}

export function ItemFields({
  itemId,
  onChange,
  autoFocus,
}: {
  itemId: string;
  onChange: (itemId: string) => void;
  autoFocus: boolean;
}) {
  return (
    <div className="mb-3">
      <ItemPicker itemId={itemId} onChange={onChange} autoFocus={autoFocus} />
    </div>
  );
}

export function QuestFields({
  questId,
  onChange,
}: {
  questId: string;
  onChange: (questId: string) => void;
}) {
  return (
    <div className="mb-3">
      <select
        autoFocus
        className={fieldClass}
        value={questId}
        onChange={(e) => onChange(e.target.value)}
      >
        {ALL_QUESTS.map((quest) => (
          <option key={quest.name} value={quest.name}>
            {quest.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DiaryFields({
  diaryId,
  onChange,
}: {
  diaryId: string;
  onChange: (diaryId: string) => void;
}) {
  return (
    <div className="mb-3">
      <select
        autoFocus
        className={fieldClass}
        value={diaryId}
        onChange={(e) => onChange(e.target.value)}
      >
        {DIARY_AREAS.map((area) => (
          <optgroup key={area} label={area}>
            {ALL_DIARIES.filter((diary) => diary.area === area).map((diary) => (
              <option key={diary.id} value={diary.id}>
                {diary.name} ({diary.tasks.length})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export function KillFields({
  bossId,
  onBossChange,
  kcCurrent,
  onKcCurrentChange,
  kcTarget,
  onKcTargetChange,
}: {
  bossId: string;
  onBossChange: (bossId: string) => void;
  kcCurrent: string;
  onKcCurrentChange: (value: string) => void;
  kcTarget: string;
  onKcTargetChange: (value: string) => void;
}) {
  return (
    <>
      <div className="mb-3">
        <div className="flex items-center gap-2">
          {bossId && <BossIcon bossId={bossId} size={28} />}
          <select
            autoFocus
            className="flex-1 bg-surface-700 text-white rounded px-3 py-2 border border-surface-border focus:border-brand focus:outline-none text-sm"
            value={bossId}
            onChange={(e) => onBossChange(e.target.value)}
          >
            {ALL_BOSSES.map((boss) => (
              <option key={boss.id} value={boss.id}>
                {boss.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-stone-400 mb-1.5">
          Kill count
          <span className="text-stone-600 ml-1">— leave target blank if grinding for a drop</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-stone-500">Current KC</span>
            <input
              type="number"
              min={0}
              className="w-24 bg-surface-700 text-white rounded px-2 py-1.5 border border-surface-border focus:border-brand focus:outline-none text-sm"
              value={kcCurrent}
              onChange={(e) => onKcCurrentChange(e.target.value)}
              placeholder="0"
            />
          </div>
          <span className="text-stone-600 mt-4">/</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-stone-500">
              Target KC <span className="text-stone-600">(optional)</span>
            </span>
            <input
              type="number"
              min={0}
              className="w-24 bg-surface-700 text-white rounded px-2 py-1.5 border border-surface-border focus:border-brand focus:outline-none text-sm"
              value={kcTarget}
              onChange={(e) => onKcTargetChange(e.target.value)}
              placeholder="e.g. 40"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function SkillFields({
  skillName,
  onSkillChange,
  targetLevel,
  onTargetLevelChange,
  boost,
  onBoostChange,
}: {
  skillName: SkillName;
  onSkillChange: (skill: SkillName) => void;
  targetLevel: string;
  onTargetLevelChange: (value: string) => void;
  boost: string;
  onBoostChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2 mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <SkillIcon skill={skillName} size={20} />
          <select
            className="flex-1 bg-surface-700 text-white rounded px-2 py-2 border border-surface-border focus:border-brand focus:outline-none text-sm"
            value={skillName}
            onChange={(e) => onSkillChange(e.target.value as SkillName)}
          >
            {[...OSRS_SKILLS]
              .sort((a, b) => a.localeCompare(b))
              .map((s) => (
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
          className="w-full bg-surface-700 text-white rounded px-2 py-2 border border-surface-border focus:border-brand focus:outline-none text-sm"
          value={targetLevel}
          onChange={(e) => onTargetLevelChange(e.target.value)}
          placeholder="Level"
        />
      </div>
      <div className="w-20">
        <input
          type="number"
          min={0}
          max={25}
          className="w-full bg-surface-700 text-white rounded px-2 py-2 border border-surface-border focus:border-brand focus:outline-none text-sm"
          value={boost}
          onChange={(e) => onBoostChange(e.target.value)}
          placeholder="Boost"
        />
      </div>
    </div>
  );
}

export function NodeTypeFields({
  type,
  isEdit,
  title,
  onTitleChange,
  titleInputRef,
  itemId,
  onItemChange,
  questId,
  onQuestChange,
  diaryId,
  onDiaryChange,
  bossId,
  onBossChange,
  kcCurrent,
  onKcCurrentChange,
  kcTarget,
  onKcTargetChange,
  skillName,
  onSkillChange,
  targetLevel,
  onTargetLevelChange,
  boost,
  onBoostChange,
}: {
  type: NodeType;
  isEdit: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  titleInputRef: RefObject<HTMLInputElement | null>;
  itemId: string;
  onItemChange: (itemId: string) => void;
  questId: string;
  onQuestChange: (questId: string) => void;
  diaryId: string;
  onDiaryChange: (diaryId: string) => void;
  bossId: string;
  onBossChange: (bossId: string) => void;
  kcCurrent: string;
  onKcCurrentChange: (value: string) => void;
  kcTarget: string;
  onKcTargetChange: (value: string) => void;
  skillName: SkillName;
  onSkillChange: (skill: SkillName) => void;
  targetLevel: string;
  onTargetLevelChange: (value: string) => void;
  boost: string;
  onBoostChange: (value: string) => void;
}) {
  return (
    <>
      {(type === 'goal' || type === 'task') && (
        <TitleField type={type} title={title} onChange={onTitleChange} inputRef={titleInputRef} />
      )}
      {type === 'item' && (
        <ItemFields itemId={itemId} onChange={onItemChange} autoFocus={!isEdit} />
      )}
      {type === 'quest' && <QuestFields questId={questId} onChange={onQuestChange} />}
      {type === 'diary' && <DiaryFields diaryId={diaryId} onChange={onDiaryChange} />}
      {type === 'kill' && (
        <KillFields
          bossId={bossId}
          onBossChange={onBossChange}
          kcCurrent={kcCurrent}
          onKcCurrentChange={onKcCurrentChange}
          kcTarget={kcTarget}
          onKcTargetChange={onKcTargetChange}
        />
      )}
      {type === 'skill' && (
        <SkillFields
          skillName={skillName}
          onSkillChange={onSkillChange}
          targetLevel={targetLevel}
          onTargetLevelChange={onTargetLevelChange}
          boost={boost}
          onBoostChange={onBoostChange}
        />
      )}
    </>
  );
}
