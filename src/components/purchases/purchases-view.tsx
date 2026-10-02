"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { PurchaseDetail } from "@/components/purchases/purchase-detail";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatDisplayDate, formatPaymentMethod, formatPKR } from "@/lib/format";
import { purchasePaymentMethod, purchasePaymentStatus } from "@/lib/purchase-fields";
import * as productsService from "@/lib/services/products.service";
import * as purchasesService from "@/lib/services/purchases.service";
import * as suppliersService from "@/lib/services/suppliers.service";
import type { Product, Purchase, Supplier } from "@/lib/types";

interface PurchaseData {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
}

export function PurchasesView() {
  const { data, error, loading, reload } = useEntityList<PurchaseData>(async () => {
    const [purchases, suppliers, products] = await Promise.all([
      purchasesService.getAll(),
      suppliersService.getAll(),
      productsService.getAll(),
    ]);
    return { purchases, suppliers, products };
  });
  const [supplierId, setSupplierId] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Purchase | null>(null);

  const purchases = useMemo(() => data?.purchases ?? [], [data]);
  const filtered = useMemo(() => {
    return purchases
      .filter((purchase) => {
        const matchesSupplier = supplierId === "all" || purchase.supplierId === supplierId;
        const matchesStatus = status === "all" || purchasePaymentStatus(purchase) === status;
        const matchesFrom = from.length === 0 || purchase.date >= from;
        const matchesTo = to.length === 0 || purchase.date <= to;
        return matchesSupplier && matchesStatus && matchesFrom && matchesTo;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [purchases, supplierId, status, from, to]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Purchases"
        description="Stock bought from suppliers. A new purchase increases quantity on hand."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus />
            New Purchase
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select value={supplierId} onValueChange={(value) => setSupplierId(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by supplier">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All suppliers</SelectItem>
            {(data?.suppliers ?? []).map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
        <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by payment status">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading && !data ? <LoadingRows /> : null}
      {error && !data ? <LoadError message={error} onRetry={reload} /> : null}
      {data && purchases.length === 0 ? (
        <EmptyState title="No purchases yet" description="Record a purchase to add stock from a supplier." />
      ) : null}
      {data && purchases.length > 0 && filtered.length === 0 ? (
        <EmptyState title="No matching purchases" description="Try a different supplier, date, or status." />
      ) : null}
      {data && filtered.length > 0 ? (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((purchase) => {
                const paymentStatus = purchasePaymentStatus(purchase);
                return (
                  <TableRow key={purchase.id} className="cursor-pointer" onClick={() => setDetail(purchase)}>
                    <TableCell>{formatDisplayDate(purchase.date)}</TableCell>
                    <TableCell>{purchase.supplierName}</TableCell>
                    <TableCell className="font-medium">{purchase.productName}</TableCell>
                    <TableCell className="text-right">{purchase.quantity}</TableCell>
                    <TableCell className="text-right">{formatPKR(purchase.unitCost)}</TableCell>
                    <TableCell className="text-right">{formatPKR(purchase.total)}</TableCell>
                    <TableCell>{formatPaymentMethod(purchasePaymentMethod(purchase))}</TableCell>
                    <TableCell>
                      <Badge variant={paymentStatus === "pending" ? "outline" : "secondary"}>
                        {paymentStatus === "pending" ? "Pending" : "Paid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-40 truncate">{purchase.notes?.trim() || "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New purchase</DialogTitle>
            <DialogDescription>Stock quantity and latest purchase cost update when this is saved.</DialogDescription>
          </DialogHeader>
          {formOpen && data ? (
            <PurchaseForm
              suppliers={data.suppliers}
              products={data.products}
              purchases={data.purchases}
              onCancel={() => setFormOpen(false)}
              onSaved={() => {
                setFormOpen(false);
                reload();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <PurchaseDetail
        purchase={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />
    </div>
  );
}
