import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditStatusBadge } from "@/components/dashboard/status-badge";
import { formatDisplayDate, formatPKR } from "@/lib/format";
import type { CreditLedgerEntry } from "@/lib/types";

export function PendingCreditWidget({ entries }: { entries: CreditLedgerEntry[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Pending credit</CardTitle>
        <CardDescription>Overdue balances and upcoming due dates</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No credit payments are waiting.
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{entry.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDisplayDate(entry.dueDate)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium">
                    {formatPKR(entry.amount - entry.amountPaid)}
                  </span>
                  <CreditStatusBadge status={entry.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
