"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";
import { X } from "lucide-react";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BACKUP_BANNER_KEY } from "@/lib/backup";
import { useSettingsStore } from "@/store/settings.store";

const listeners = new Set<() => void>();

function bannerDismissed(): boolean {
  return sessionStorage.getItem(BACKUP_BANNER_KEY) === "1";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dismissBanner(): void {
  sessionStorage.setItem(BACKUP_BANNER_KEY, "1");
  listeners.forEach((listener) => listener());
}

export function BackupBanner() {
  const pathname = usePathname();
  const lastBackupAt = useSettingsStore((state) => state.settings.lastBackupAt);
  const dismissed = useSyncExternalStore(subscribe, bannerDismissed, () => false);
  const age = backupAgeDays(lastBackupAt);
  const stale = age === null || age > 7;
  if (dismissed || !stale) return null;

  const message =
    age === null
      ? "You haven't backed up your data yet — export a backup to avoid losing records."
      : `You haven't backed up your data in ${age} days — export a backup to avoid losing records.`;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
      <p>
        {message}{" "}
        {pathname === "/settings" ? null : (
          <Link href="/settings" className="font-medium underline underline-offset-2">
            Open Settings
          </Link>
        )}
      </p>
      <Button type="button" variant="ghost" size="icon-xs" aria-label="Dismiss backup reminder" onClick={dismissBanner}>
        <X />
      </Button>
    </div>
  );
}

function backupAgeDays(lastBackupAt: string | undefined): number | null {
  if (!lastBackupAt) return null;
  const parsed = parseISO(lastBackupAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return differenceInCalendarDays(new Date(), parsed);
}
