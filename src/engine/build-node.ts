import type {
  BossData,
  DiaryData,
  GraphNode,
  GroupData,
  ItemData,
  NodeType,
  Quantity,
  QuestData,
  SkillData,
} from './types';

export interface BuildNodeInput {
  id: string;
  type: NodeType;
  title: string;
  position: { x: number; y: number };
  complete?: boolean;
  notes: string | undefined;
  skillData: SkillData | undefined;
  questData: QuestData | undefined;
  bossData: BossData | undefined;
  itemData: ItemData | undefined;
  diaryData: DiaryData | undefined;
  quantity: Quantity | undefined;
  groupData: GroupData | undefined;
  tags: string[] | undefined;
}

/** Build a stored node and keep only the payload that belongs to its type. */
export function buildGraphNode(input: BuildNodeInput): GraphNode {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    position: input.position,
    complete: input.complete ?? false,
    notes: input.notes ?? undefined,
    skillData: input.type === 'skill' ? input.skillData : undefined,
    questData: input.type === 'quest' ? input.questData : undefined,
    bossData: input.type === 'kill' ? input.bossData : undefined,
    itemData: input.type === 'item' ? input.itemData : undefined,
    diaryData: input.type === 'diary' ? input.diaryData : undefined,
    quantity: input.quantity ?? undefined,
    groupData: input.type === 'group' ? input.groupData : undefined,
    tags: input.tags ?? [],
  };
}
