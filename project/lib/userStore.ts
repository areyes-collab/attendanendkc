// @ts-nocheck
import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'teacher';
  profile_image?: string;
  email?: string;
  rfid_id?: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user: User | null) => set({ user }),
  updateUser: (userData: Partial<User>) => 
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),
}));