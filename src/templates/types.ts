import type { GraphNode, GraphEdge, NodeType, SkillName } from '../engine/types';

export interface TemplateNode {
  /** Stable key within the template (not a graph UUID — real IDs generated on apply). */
  key: string;
  type: NodeType;
  title: string;
  requirement: 'hard' | 'soft';
  /** Why the template includes this node. Shown during soft-requirement prompts. */
  rationale: string;
  notes: string | undefined;
  skillData: { skillName: SkillName; targetLevel: number; boost: number | undefined } | undefined;
  questData: { questId: string } | undefined;
}

export interface TemplateEdge {
  fromKey: string;
  toKey: string;
  type: GraphEdge['type'];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

/** What the user decided for each soft node. */
export type SoftDecision =
  | { action: 'keep' }
  | {
      action: 'edit';
      edits: Partial<Pick<TemplateNode, 'title' | 'notes' | 'skillData' | 'questData'>>;
    }
  | { action: 'discard' };

/** Result of applying decisions to a template. Ready to merge into the graph. */
export interface ExpansionResult {
  nodesToAdd: GraphNode[];
  edgesToAdd: GraphEdge[];
  nodesToUpdate: { id: string; updates: Partial<GraphNode> }[];
}
