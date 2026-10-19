import { describe, expect, it } from 'vitest';
import { getDiary, previousDiaryId, withToggledTask } from './diary-db';

describe('diary database', () => {
  it('includes every area at all four tiers', () => {
    const varrock = getDiary('Varrock|easy');
    expect(varrock?.tasks.length).toBeGreaterThan(0);
    expect(varrock?.skillReqs.some((req) => req.skill === 'Mining')).toBe(true);
    expect(previousDiaryId('Varrock|easy')).toBeUndefined();
    expect(previousDiaryId('Varrock|medium')).toBe('Varrock|easy');
    expect(previousDiaryId('Varrock|elite')).toBe('Varrock|hard');
  });

  it('toggles a single task and pads to the diary length', () => {
    expect(withToggledTask([], 3, 1)).toEqual([false, true, false]);
    expect(withToggledTask([false, true, false], 3, 1)).toEqual([false, false, false]);
  });
});
