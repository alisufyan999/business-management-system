import { apiCall } from "@/lib/services/api";
import { defaultSettings, type AppSettings } from "@/lib/settings-defaults";
import { useSettingsStore } from "@/store/settings.store";

export function getSettings(): Promise<AppSettings> {
  // TODO: replace with real API call
  return apiCall(useSettingsStore, () => useSettingsStore.getState().settings);
}

export function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  // TODO: replace with real API call
  return apiCall(useSettingsStore, () => {
    useSettingsStore.getState().update(patch);
    return useSettingsStore.getState().settings;
  });
}

export function changePassword(currentPassword: string, nextPassword: string): Promise<void> {
  // TODO: replace with real API call
  // A real backend would hash this password and update it through an API, not store it in the browser.
  return apiCall(useSettingsStore, () => {
    const current = useSettingsStore.getState().settings.password || defaultSettings.password;
    if (currentPassword !== current) throw new Error("Current password is incorrect.");
    if (nextPassword.length < 8) throw new Error("New password must be at least 8 characters.");
    useSettingsStore.getState().update({ password: nextPassword });
  });
}
