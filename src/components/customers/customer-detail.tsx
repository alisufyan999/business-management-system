"use client";

import { formatDisplayDate, formatPaymentMethod, formatPKR } from "@/lib/format";
import { creditStatusLabel, saleBalance } from "@/lib/sale-fields";
import type { CreditLedgerEntry, Customer, Sale } from "@/lib/types";
import { CustomerTypeBadge } from "@/components/customers/customer-type-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CustomerDetail({
  customer,
  sales,
  credit,
  onOpenChange,
}: {
  customer: Customer | null;
  sales: Sale[];
  credit: CreditLedgerEntry[];
  onOpenChange: (open: boolean) => void;
}) {
  const history = customer
    ? sales
        .filter((sale) => sale.customerId === customer.id)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    : [];
  const ledger = customer
    ? credit
        .filter((entry) => entry.customerId === customer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  return (
    <Sheet open={customer !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {customer ? (
          <>
            <SheetHeader>
              <SheetTitle>{customer.name}</SheetTitle>
              <SheetDescription>Contact details and purchase history.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <CustomerTypeBadge type={customer.type} />
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{customer.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{customer.email || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Address</dt>
                  <dd>{customer.address || customer.city || "—"}</dd>
                </div>
              </dl>

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Purchase history</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No purchases yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>{formatDisplayDate(sale.date)}</TableCell>
                            <TableCell>{sale.id}</TableCell>
                            <TableCell>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                            <TableCell>{formatPKR(sale.amount)}</TableCell>
                            <TableCell>{formatPKR(saleBalance(sale.amount, sale.amountPaid))}</TableCell>
                            <TableCell>{formatPaymentMethod(sale.paymentMethod)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              {customer.type === "credit" ? (
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Credit ledger</h3>
                  {ledger.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No credit entries yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {ledger.map((entry) => (
                        <li key={entry.id} className="rounded-lg border px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span>{formatDisplayDate(entry.createdAt)}</span>
                            <span className="font-medium">{formatPKR(entry.amount)}</span>
                          </div>
                          <p className="text-muted-foreground">
                            Due {formatDisplayDate(entry.dueDate)} · {creditStatusLabel[entry.status]}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
