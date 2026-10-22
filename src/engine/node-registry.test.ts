import { describe, expect, it } from 'vitest';
import { creatableNodeTypes, getNodeTypeInfo, NODE_TYPES } from './node-registry';
import type { NodeType } from './types';

const ALL_TYPES: NodeType[] = ['goal', 'quest', 'skill', 'diary', 'task', 'kill', 'item', 'group'];

describe('node registry', () => {
  it('describes every node type once', () => {
    expect(NODE_TYPES.map((info) => info.type).sort()).toEqual([...ALL_TYPES].sort());
  });

  it('gives diaries a different accent from skills', () => {
    expect(getNodeTypeInfo('diary').accent).not.toBe(getNodeTypeInfo('skill').accent);
  });

  it('keeps groups out of the create dialog and the legend', () => {
    expect(creatableNodeTypes().map((info) => info.type)).not.toContain('group');
    expect(getNodeTypeInfo('group').legend).toBe(false);
  });
});
