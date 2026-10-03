"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { Button } from "@/components/ui/button";
import { PaymentChart } from "@/components/dashboard/payment-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { PaymentSlice } from "@/lib/dashboard-metrics";
import { csvExportFilename, downloadCsv } from "@/lib/csv";
import { formatDisplayDate, formatPaymentMethod, formatPKR } from "@/lib/format";
import { todayKey } from "@/lib/sale-fields";
import * as paymentsService from "@/lib/services/payments.service";
import type { Payment, PaymentMethod, PaymentReferenceType } from "@/lib/types";

const methods: Array<PaymentMethod | "all"> = ["all", "cash", "online", "cheque", "pay_order", "credit"];
const methodOrder: PaymentMethod[] = ["cash", "online", "cheque", "pay_order", "credit"];

function isLogPayment(payment: Payment): boolean {
  return payment.referenceType === "sale" || payment.referenceType === "credit";
}

function typeLabel(type: PaymentReferenceType): string {
  return type === "credit" ? "Credit Repayment" : "Sale Payment";
}

export function PaymentsView() {
  const { data, error, loading, reload } = useEntityList(() => paymentsService.getAll());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [type, setType] = useState<PaymentReferenceType | "all">("all");
  const [query, setQuery] = useState("");

  const recordedAt = new Map((data ?? []).map((payment, position) => [payment.id, position]));
  const log = (data ?? []).filter(isLogPayment);
  const today = todayKey();
  const month = today.slice(0, 7);
  const collectedToday = log.filter((payment) => payment.date === today).reduce((sum, payment) => sum + payment.amount, 0);
  const collectedMonth = log
    .filter((payment) => payment.date.startsWith(month))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const needle = query.trim().toLowerCase();
  const filtered = log
    .filter((payment) => {
      const matchesFrom = from.length === 0 || payment.date >= from;
      const matchesTo = to.length === 0 || payment.date <= to;
      const matchesMethod = method === "all" || payment.method === method;
      const matchesType = type === "all" || payment.referenceType === type;
      const matchesQuery = needle.length === 0 || payment.partyName.toLowerCase().includes(needle);
      return matchesFrom && matchesTo && matchesMethod && matchesType && matchesQuery;
    })
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return (recordedAt.get(a.id) ?? 0) - (recordedAt.get(b.id) ?? 0);
    });

  const slices: PaymentSlice[] = methodOrder.map((item) => ({
    method: item,
    label: formatPaymentMethod(item),
    total: filtered.filter((payment) => payment.method === item).reduce((sum, payment) => sum + payment.amount, 0),
  }));

  function exportRows() {
    downloadCsv(
      csvExportFilename("payments"),
      ["Date", "Type", "Customer", "Amount", "Method", "Notes"],
      filtered.map((payment) => [
        formatDisplayDate(payment.date),
        typeLabel(payment.referenceType),
        payment.partyName,
        formatPKR(payment.amount),
        formatPaymentMethod(payment.method),
        payment.notes ?? "",
      ]),
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Payments"
        description="Payments are created from a sale or a credit repayment. This log is read only."
        action={
          <Button type="button" variant="outline" onClick={exportRows}>
            <Download />
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Collected today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(collectedToday)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Collected this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(collectedMonth)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
        <Select value={method} onValueChange={(value) => setMethod((value ?? "all") as PaymentMethod | "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by method">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            {methods.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "all" ? "All methods" : formatPaymentMethod(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(value) => setType((value ?? "all") as PaymentReferenceType | "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="sale">Sale Payment</SelectItem>
            <SelectItem value="credit">Credit Repayment</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search customer"
          aria-label="Search by customer"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          {loading ? <LoadingRows /> : null}
          {error ? <LoadError message={error} onRetry={reload} /> : null}
          {!loading && !error && filtered.length === 0 ? (
            <EmptyState title="No payments" description="Sale payments and credit repayments will show up here." />
          ) : null}
          {!loading && !error && filtered.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDisplayDate(payment.date)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.referenceType === "credit" ? "secondary" : "outline"}>
                          {typeLabel(payment.referenceType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{payment.partyName}</TableCell>
                      <TableCell>{formatPKR(payment.amount)}</TableCell>
                      <TableCell>{formatPaymentMethod(payment.method)}</TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">{payment.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>
        <PaymentChart data={slices} title="Collections by method" description="Share of the filtered payments" />
      </div>
    </div>
  );
}
