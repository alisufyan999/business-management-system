"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { SaleStatusBadge } from "@/components/sales/sale-status-badge";
import { Button } from "@/components/ui/button";
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
import { formatDisplayDate, formatPaymentMethod, formatPKR } from "@/lib/format";
import { saleBalance, saleStatusLabel } from "@/lib/sale-fields";
import * as customersService from "@/lib/services/customers.service";
import * as salesService from "@/lib/services/sales.service";
import type { Customer, PaymentMethod, Sale, SaleStatus } from "@/lib/types";

interface SalesData {
  sales: Sale[];
  customers: Customer[];
}

const methods: Array<PaymentMethod | "all"> = ["all", "cash", "online", "cheque", "pay_order", "credit"];
const statuses: Array<SaleStatus | "all"> = ["all", "paid", "partial", "credit"];

export function SalesView() {
  const router = useRouter();
  const { data, error, loading, reload } = useEntityList<SalesData>(async () => {
    const [sales, customers] = await Promise.all([
      salesService.getAll(),
      customersService.getAll(),
    ]);
    return { sales, customers };
  });
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customerId, setCustomerId] = useState("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [status, setStatus] = useState<SaleStatus | "all">("all");

  const sales = useMemo(() => data?.sales ?? [], [data]);
  const customers = useMemo(() => data?.customers ?? [], [data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sales
      .filter((sale) => {
        const matchesQuery =
          needle.length === 0 ||
          sale.id.toLowerCase().includes(needle) ||
          sale.customerName.toLowerCase().includes(needle);
        const matchesCustomer = customerId === "all" || sale.customerId === customerId;
        const matchesMethod = method === "all" || sale.paymentMethod === method;
        const matchesStatus = status === "all" || sale.status === status;
        const matchesFrom = from.length === 0 || sale.date >= from;
        const matchesTo = to.length === 0 || sale.date <= to;
        return matchesQuery && matchesCustomer && matchesMethod && matchesStatus && matchesFrom && matchesTo;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [sales, query, customerId, method, status, from, to]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Sales"
        description="Invoices, balances, and payment status."
        action={
          <Button asChild>
            <Link href="/sales/new">
              <Plus />
              New Sale
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search invoice or customer"
          aria-label="Search sales"
        />
        <Select value={customerId} onValueChange={(value) => setCustomerId(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by customer">
            <SelectValue placeholder="All customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={(value) => setMethod((value ?? "all") as PaymentMethod | "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by payment method">
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
        <Select value={status} onValueChange={(value) => setStatus((value ?? "all") as SaleStatus | "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "all" ? "All statuses" : saleStatusLabel[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
      </div>

      {loading ? <LoadingRows /> : null}
      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState title="No sales yet" description="Record a sale from the point of sale." />
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/sales/${sale.id}/invoice`)}
                >
                  <TableCell className="font-medium">{sale.id}</TableCell>
                  <TableCell>{formatDisplayDate(sale.date)}</TableCell>
                  <TableCell>{sale.customerName}</TableCell>
                  <TableCell>{sale.items.length}</TableCell>
                  <TableCell>{formatPKR(sale.amount)}</TableCell>
                  <TableCell>{formatPKR(sale.amountPaid)}</TableCell>
                  <TableCell>{formatPKR(saleBalance(sale.amount, sale.amountPaid))}</TableCell>
                  <TableCell>{formatPaymentMethod(sale.paymentMethod)}</TableCell>
                  <TableCell>
                    <SaleStatusBadge status={sale.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
