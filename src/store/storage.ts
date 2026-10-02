import { createJSONStorage, type StateStorage } from "zustand/middleware";

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export function browserStorage() {
  return createJSONStorage(() =>
    typeof window === "undefined" ? memoryStorage : window.localStorage,
  );
}

function prefersRememberMe(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as { state?: { rememberMe?: boolean } };
    return parsed.state?.rememberMe === true;
  } catch {
    return false;
  }
}

export const authStateStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(name) ?? window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    if (prefersRememberMe(value)) {
      window.localStorage.setItem(name, value);
      window.sessionStorage.removeItem(name);
      return;
    }
    window.sessionStorage.setItem(name, value);
    window.localStorage.removeItem(name);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(name);
    window.localStorage.removeItem(name);
  },
};
