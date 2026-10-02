"use client";

import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/store/auth.store";

function subscribeToAuthHydration(onStoreChange: () => void) {
  return useAuthStore.persist.onFinishHydration(onStoreChange);
}

function getAuthHydrated() {
  return useAuthStore.persist.hasHydrated();
}

function getServerAuthHydrated() {
  return false;
}

export function useSession() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const rememberMe = useAuthStore((state) => state.rememberMe);
  const hydrated = useSyncExternalStore(
    subscribeToAuthHydration,
    getAuthHydrated,
    getServerAuthHydrated,
  );

  return { isAuthenticated, user, rememberMe, hydrated };
}
