import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SkillName } from '../engine/types';

interface PlayerState {
  skills: Partial<Record<SkillName, number>>;
  bossKcs: Record<string, number>;
  rsn: string | undefined;
  setRsn: (rsn: string | undefined) => void;
  loadProfile: (
    skills: Partial<Record<SkillName, number>>,
    bossKcs: Record<string, number>,
  ) => void;
  resetProfile: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      skills: {},
      bossKcs: {},
      rsn: undefined,

      setRsn: (rsn) => set({ rsn }),

      loadProfile: (skills, bossKcs) => set({ skills, bossKcs }),

      resetProfile: () => set({ skills: {}, bossKcs: {}, rsn: undefined }),
    }),
    { name: 'planscape-player' },
  ),
);
