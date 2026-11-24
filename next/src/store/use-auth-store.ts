import { create } from "zustand";
import type { User } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null; // 🛡️ Ye sirf RAM memory me rehta hai (LocalStorage par 0 trace)
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
}));