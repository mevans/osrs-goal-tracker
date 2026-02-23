import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  hideCompleted: boolean;
  toggleHideCompleted: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      hideCompleted: false,
      toggleHideCompleted: () => set((s) => ({ hideCompleted: !s.hideCompleted })),
    }),
    { name: 'planscape-preferences' },
  ),
);
