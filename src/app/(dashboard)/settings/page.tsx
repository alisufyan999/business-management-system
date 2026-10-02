import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Company details, display preferences, and the sign-in password.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
