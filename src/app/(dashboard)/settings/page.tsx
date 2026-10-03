import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Company details, display preferences, the sign-in password, and data backups.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
