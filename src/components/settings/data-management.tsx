"use client";

import { format, parseISO } from "date-fns";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseBackup, type AppBackup } from "@/lib/backup";
import * as backupService from "@/lib/services/backup.service";
import { defaultSettings } from "@/lib/settings-defaults";
import { useSettingsStore } from "@/store/settings.store";

export function DataManagement() {
  const router = useRouter();
  const lastBackupAt = useSettingsStore((state) => state.settings.lastBackupAt);
  const dateFormat = useSettingsStore((state) => state.settings.dateFormat);
  const [pending, setPending] = useState<AppBackup | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function exportFullBackup() {
    setExporting(true);
    try {
      await backupService.exportBackup();
      toast.success("Backup downloaded");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not export the backup.");
    } finally {
      setExporting(false);
    }
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBackup(JSON.parse(String(reader.result)));
        if (!parsed) {
          toast.error("Invalid or incompatible backup file");
          return;
        }
        setPending(parsed);
      } catch {
        toast.error("Invalid or incompatible backup file");
      }
    };
    reader.readAsText(file);
  }

  async function confirmRestore() {
    if (!pending) return;
    setRestoring(true);
    try {
      await backupService.restoreBackup(pending);
      toast.success("Backup restored");
      router.push("/dashboard");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not restore the backup.");
      setRestoring(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Full backup</CardTitle>
          <CardDescription>Download every record stored in this browser.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Last backup: {formatBackupStamp(lastBackupAt, dateFormat)}</p>
          <Button type="button" className="w-fit" onClick={() => void exportFullBackup()} disabled={exporting}>
            <Download />
            {exporting ? "Exporting…" : "Export full backup (JSON)"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Restore from backup</CardTitle>
          <CardDescription>Replace the records in this browser with a backup file.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="backup-file">Backup file</Label>
          <Input id="backup-file" type="file" accept=".json,application/json" onChange={onFile} />
        </CardContent>
      </Card>
      <AlertDialog open={pending !== null} onOpenChange={(open) => { if (!open && !restoring) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all current data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will REPLACE all current data in the app with the contents of this backup. This cannot be undone. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={restoring} onClick={(event) => { event.preventDefault(); void confirmRestore(); }}>
              {restoring ? "Restoring…" : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatBackupStamp(lastBackupAt: string | undefined, dateFormat: string): string {
  if (!lastBackupAt) return "Never backed up";
  const parsed = parseISO(lastBackupAt);
  if (Number.isNaN(parsed.getTime())) return "Never backed up";
  return format(parsed, `${dateFormat || defaultSettings.dateFormat} HH:mm`);
}
