import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'dark',
      toggleMode: () => set(s => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
      setMode: (mode) => set({ mode }),
    }),
    { name: 'fitlog-theme' }
  )
);

export default useThemeStore;