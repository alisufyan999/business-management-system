import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultSettings, type AppSettings } from "@/lib/settings-defaults";
import { browserStorage } from "@/store/storage";

interface SettingsState {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      update: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch },
        })),
    }),
    {
      name: "evernew-settings",
      storage: browserStorage(),
      partialize: (state) => ({ settings: state.settings }),
      merge: (persisted, current) => {
        const stored = (persisted as { settings?: Partial<AppSettings> } | undefined)?.settings;
        const settings = { ...current.settings, ...stored };
        if (!stored?.businessName || stored.businessName === "Evernew Technologies") {
          settings.businessName = defaultSettings.businessName;
        }
        if (!stored?.address || stored.address === "Gulberg III, Lahore") {
          settings.address = defaultSettings.address;
        }
        if (!stored?.email || stored.email === "admin@evernewtech.com") {
          settings.email = defaultSettings.email;
        }
        if (!stored?.password || stored.password === "Evernew@123") {
          settings.password = defaultSettings.password;
        }
        return { ...current, settings };
      },
    },
  ),
);
