import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEMO_USER } from "@/lib/auth";
import type { Session, User } from "@/lib/types";
import { authStateStorage } from "@/store/storage";

interface AuthState extends Session {
  setSession: (session: { user: User; rememberMe: boolean }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      rememberMe: false,
      setSession: ({ user, rememberMe }) =>
        set({ isAuthenticated: true, user, rememberMe }),
      clearSession: () =>
        set({ isAuthenticated: false, user: null, rememberMe: false }),
    }),
    {
      name: "evernew-auth",
      storage: createJSONStorage(() => authStateStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        rememberMe: state.rememberMe,
      }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<AuthState>;
        const previousAdmin = stored.user?.email === "admin@evernewtech.com" || stored.user?.email === DEMO_USER.email;
        const user = stored.user && previousAdmin ? { ...stored.user, name: DEMO_USER.name, email: DEMO_USER.email } : stored.user ?? null;
        return {
          ...current,
          isAuthenticated: stored.isAuthenticated ?? current.isAuthenticated,
          rememberMe: stored.rememberMe ?? current.rememberMe,
          user,
        };
      },
    },
  ),
);
