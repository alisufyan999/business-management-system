"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { billMath, billPartyKindLabels } from "@/lib/invoice-document";
import * as billsService from "@/lib/services/bills.service";

export function InvoicesView() {
  const router = useRouter();
  const { data, error, loading, reload } = useEntityList(() => billsService.getAll());
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const bills = (data ?? []).filter((bill) => {
    if (!needle) return true;
    return bill.number.toLowerCase().includes(needle) || bill.partyName.toLowerCase().includes(needle);
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Invoices"
        description="Create a bill for a customer, vendor, dealer, walk-in, or anyone else."
        action={
          <Button asChild>
            <Link href="/invoices/new">
              <Plus />
              New invoice
            </Link>
          </Button>
        }
      />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search invoice number or name"
      />
      {loading ? <LoadingRows /> : null}
      {!loading && error ? <LoadError message={error} onRetry={reload} /> : null}
      {!loading && !error && bills.length === 0 ? (
        <EmptyState title="No invoices yet" description="Create a bill, then save the file or print it." />
      ) : null}
      {!loading && !error && bills.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Bill to</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => {
                const totals = billMath(bill.lines, bill.discountValue, bill.amountPaid);
                return (
                  <TableRow key={bill.id} className="cursor-pointer" onClick={() => router.push(`/invoices/${bill.id}`)}>
                    <TableCell className="font-medium">{bill.number}</TableCell>
                    <TableCell>{formatDisplayDate(bill.date)}</TableCell>
                    <TableCell>{bill.partyName}</TableCell>
                    <TableCell>{billPartyKindLabels[bill.partyKind]}</TableCell>
                    <TableCell>{formatPKR(totals.total)}</TableCell>
                    <TableCell>{formatPKR(totals.balance)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
