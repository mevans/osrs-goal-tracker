import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SkillName } from '../engine/types';

interface PlayerState {
  skills: Partial<Record<SkillName, number>>;
  rsn: string | undefined;
  setRsn: (rsn: string | undefined) => void;
  loadProfile: (skills: Partial<Record<SkillName, number>>) => void;
  resetProfile: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      skills: {},
      rsn: undefined,

      setRsn: (rsn) => set({ rsn }),

      loadProfile: (skills) => set({ skills }),

      resetProfile: () => set({ skills: {}, rsn: undefined }),
    }),
    { name: 'planscape-player' },
  ),
);
