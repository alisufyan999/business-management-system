import { DEMO_CREDENTIALS, DEMO_USER } from "@/lib/auth";
import { apiCall } from "@/lib/services/api";
import { defaultSettings } from "@/lib/settings-defaults";
import type { Session, User } from "@/lib/types";
import { useAuthStore } from "@/store/auth.store";
import { useSettingsStore } from "@/store/settings.store";
import { waitForHydration } from "@/store/hydrate";

export async function login(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<User> {
  // TODO: replace with real API call
  // A real backend would verify a hashed password through an API. This demo compares the saved settings password.
  await waitForHydration(useSettingsStore);
  return apiCall(useAuthStore, () => {
    const savedPassword = useSettingsStore.getState().settings.password || defaultSettings.password;
    const emailMatches = email.trim().toLowerCase() === DEMO_CREDENTIALS.email;
    if (!emailMatches || password !== savedPassword) {
      throw new Error("Invalid email or password.");
    }
    useAuthStore.getState().setSession({ user: DEMO_USER, rememberMe });
    return DEMO_USER;
  });
}

export async function logout(): Promise<void> {
  // TODO: replace with real API call
  await apiCall(useAuthStore, () => {
    useAuthStore.getState().clearSession();
  });
  useAuthStore.persist.clearStorage();
}

export function getSession(): Promise<Session> {
  // TODO: replace with real API call
  return apiCall(useAuthStore, () => {
    const { isAuthenticated, user, rememberMe } = useAuthStore.getState();
    return { isAuthenticated, user, rememberMe };
  });
}
