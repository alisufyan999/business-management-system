"use client";

import { formatDisplayDate, formatPaymentMethod, formatPKR } from "@/lib/format";
import { saleBalance } from "@/lib/sale-fields";
import type { CreditLedgerEntry, Payment } from "@/lib/types";
import { LedgerStatusBadge } from "@/components/credit/ledger-status-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function historyFor(entry: CreditLedgerEntry, payments: Payment[]) {
  const related = payments.filter(
    (payment) =>
      (payment.referenceId === entry.saleId &&
        (payment.referenceType === "sale" || payment.referenceType === "credit")) ||
      (payment.referenceId === entry.id && payment.referenceType === "credit"),
  );
  const recordedAt = new Map(payments.map((payment, position) => [payment.id, position]));
  const unique = [...new Map(related.map((payment) => [payment.id, payment])).values()];
  unique.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return (recordedAt.get(b.id) ?? 0) - (recordedAt.get(a.id) ?? 0);
  });
  let running = entry.amount;
  return unique.map((payment) => {
    running = Math.max(0, running - payment.amount);
    return { payment, running };
  });
}

export function CreditDetail({
  entry,
  payments,
  onOpenChange,
}: {
  entry: CreditLedgerEntry | null;
  payments: Payment[];
  onOpenChange: (open: boolean) => void;
}) {
  const rows = entry ? historyFor(entry, payments) : [];

  return (
    <Sheet open={entry !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {entry ? (
          <>
            <SheetHeader>
              <SheetTitle>{entry.customerName}</SheetTitle>
              <SheetDescription>Invoice {entry.saleId}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Remaining {formatPKR(saleBalance(entry.amount, entry.amountPaid))}</span>
                <LedgerStatusBadge entry={entry} />
              </div>
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded against this balance yet.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {rows.map(({ payment, running }) => (
                    <li key={payment.id} className="rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span>{formatDisplayDate(payment.date)}</span>
                        <span className="font-medium">{formatPKR(payment.amount)}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {formatPaymentMethod(payment.method)}
                        {payment.notes ? ` · ${payment.notes}` : ""}
                      </p>
                      <p className="text-muted-foreground">Balance after {formatPKR(running)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
