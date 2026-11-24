import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoginResponse, User } from "@/types/api";

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (response: LoginResponse) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (response) => set({ token: response.access_token, user: response.user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: "inklira-auth" },
  ),
);
