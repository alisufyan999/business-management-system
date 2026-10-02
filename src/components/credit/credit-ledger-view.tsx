"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { CreditDetail } from "@/components/credit/credit-detail";
import { CreditPaymentForm } from "@/components/credit/credit-payment-form";
import { LedgerStatusBadge } from "@/components/credit/ledger-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEntityList } from "@/hooks/use-entity-list";
import { formatDisplayDate, formatPKR } from "@/lib/format";
import {
  ledgerDisplayStatus,
  ledgerStatusLabel,
  openCreditCustomerCount,
  outstandingBalance,
  overdueAmount,
  saleBalance,
  sortLedgerEntries,
  type LedgerDisplayStatus,
} from "@/lib/sale-fields";
import * as creditService from "@/lib/services/credit.service";
import * as paymentsService from "@/lib/services/payments.service";
import type { CreditLedgerEntry, Payment } from "@/lib/types";

interface LedgerData {
  entries: CreditLedgerEntry[];
  payments: Payment[];
}

const statuses: Array<LedgerDisplayStatus | "all"> = ["all", "overdue", "due_today", "upcoming", "paid"];

export function CreditLedgerView() {
  const { data, error, loading, reload } = useEntityList<LedgerData>(async () => {
    const [entries, payments] = await Promise.all([creditService.getAll(), paymentsService.getAll()]);
    return { entries, payments };
  });
  const [status, setStatus] = useState<LedgerDisplayStatus | "all">("all");
  const [customerId, setCustomerId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<CreditLedgerEntry | null>(null);
  const [paying, setPaying] = useState<CreditLedgerEntry | null>(null);

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const payments = useMemo(() => data?.payments ?? [], [data]);
  const customers = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) map.set(entry.customerId, entry.customerName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  const filtered = useMemo(() => {
    const rows = entries.filter((entry) => {
      const display = ledgerDisplayStatus(entry);
      const matchesStatus = status === "all" || display === status;
      const matchesCustomer = customerId === "all" || entry.customerId === customerId;
      const matchesFrom = from.length === 0 || entry.dueDate >= from;
      const matchesTo = to.length === 0 || entry.dueDate <= to;
      return matchesStatus && matchesCustomer && matchesFrom && matchesTo;
    });
    return sortLedgerEntries(rows);
  }, [entries, status, customerId, from, to]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Credit ledger"
        description="Balances still owed, and payments recorded against them."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(outstandingBalance(entries))}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(overdueAmount(entries))}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Credit customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{openCreditCustomerCount(entries)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Customers who still owe a balance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={status} onValueChange={(value) => setStatus((value ?? "all") as LedgerDisplayStatus | "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "all" ? "All statuses" : ledgerStatusLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={customerId} onValueChange={(value) => setCustomerId(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by customer">
            <SelectValue placeholder="All customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Due from" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Due to" />
      </div>

      {loading ? <LoadingRows /> : null}
      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState title="No credit entries" description="Balances appear here when a sale is not paid in full." />
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => {
                const remaining = saleBalance(entry.amount, entry.amountPaid);
                return (
                  <TableRow key={entry.id} className="cursor-pointer" onClick={() => setDetail(entry)}>
                    <TableCell className="font-medium">{entry.customerName}</TableCell>
                    <TableCell>
                      <Link
                        href={`/sales/${entry.saleId}/invoice`}
                        className="underline-offset-4 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {entry.saleId}
                      </Link>
                    </TableCell>
                    <TableCell>{formatPKR(entry.amount)}</TableCell>
                    <TableCell>{formatPKR(entry.amountPaid)}</TableCell>
                    <TableCell>{formatPKR(remaining)}</TableCell>
                    <TableCell>{formatDisplayDate(entry.dueDate)}</TableCell>
                    <TableCell>
                      <LedgerStatusBadge entry={entry} />
                    </TableCell>
                    <TableCell>
                      {remaining > 0 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPaying(entry);
                          }}
                        >
                          Record Payment
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <CreditDetail
        entry={detail}
        payments={payments}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />

      <Dialog open={paying !== null} onOpenChange={(open) => { if (!open) setPaying(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {paying ? `${paying.customerName} · ${paying.saleId}` : "Apply a payment to this balance."}
            </DialogDescription>
          </DialogHeader>
          {paying ? (
            <CreditPaymentForm
              key={paying.id}
              entry={paying}
              onCancel={() => setPaying(null)}
              onSaved={() => {
                setPaying(null);
                setDetail(null);
                reload();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
