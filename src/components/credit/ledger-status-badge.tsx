import { Badge } from "@/components/ui/badge";
import { ledgerDisplayStatus, ledgerStatusLabel, type LedgerDisplayStatus } from "@/lib/sale-fields";
import type { CreditLedgerEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<LedgerDisplayStatus, string> = {
  upcoming: "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  due_today: "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300",
  overdue: "border-transparent bg-destructive/15 text-destructive",
  paid: "border-transparent bg-muted text-muted-foreground",
};

export function LedgerStatusBadge({ entry, className }: { entry: CreditLedgerEntry; className?: string }) {
  const status = ledgerDisplayStatus(entry);
  return (
    <Badge variant="outline" className={cn(styles[status], className)}>
      {ledgerStatusLabel(status, entry.dueDate)}
    </Badge>
  );
}
