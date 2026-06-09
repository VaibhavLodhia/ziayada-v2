import type { StateCreator } from 'zustand';
import { getMe, type User } from '@/lib/api';

export type AuthSlice = {
  user: User | null;
  hydrating: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  hydrate: () => Promise<void>;
};

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  user: null,
  hydrating: false,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  hydrate: async () => {
    set({ hydrating: true });
    try {
      const me = await getMe();
      set({ user: me });
    } finally {
      set({ hydrating: false });
    }
  },
});
