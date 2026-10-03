"use client";

import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/catalog/delete-dialog";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { SupplierForm } from "@/components/suppliers/supplier-form";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEntityList } from "@/hooks/use-entity-list";
import { csvExportFilename, downloadCsv } from "@/lib/csv";
import { formatPKR } from "@/lib/format";
import { supplierAddress } from "@/lib/purchase-fields";
import * as purchasesService from "@/lib/services/purchases.service";
import * as suppliersService from "@/lib/services/suppliers.service";
import type { Purchase, Supplier } from "@/lib/types";

interface SupplierData {
  suppliers: Supplier[];
  purchases: Purchase[];
}

export function SuppliersView() {
  const { data, error, loading, reload } = useEntityList<SupplierData>(async () => {
    const [suppliers, purchases] = await Promise.all([
      suppliersService.getAll(),
      purchasesService.getAll(),
    ]);
    return { suppliers, purchases };
  });
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const suppliers = useMemo(() => data?.suppliers ?? [], [data]);
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const purchase of data?.purchases ?? []) {
      map.set(purchase.supplierId, (map.get(purchase.supplierId) ?? 0) + purchase.total);
    }
    return map;
  }, [data?.purchases]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (needle.length === 0) return true;
      return (
        supplier.name.toLowerCase().includes(needle) ||
        supplier.contactName.toLowerCase().includes(needle)
      );
    });
  }, [suppliers, query]);

  const purchaseLinked = deleting
    ? (data?.purchases ?? []).some((purchase) => purchase.supplierId === deleting.id)
    : false;

  async function confirmDelete() {
    if (!deleting || purchaseLinked) return;
    setDeletePending(true);
    try {
      await suppliersService.removeSupplier(deleting.id);
      toast.success("Supplier deleted");
      setDeleting(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete the supplier.");
    } finally {
      setDeletePending(false);
    }
  }

  function exportRows() {
    downloadCsv(
      csvExportFilename("suppliers"),
      ["Supplier", "Contact person", "Phone", "Email", "Address", "Total purchased"],
      filtered.map((supplier) => [
        supplier.name,
        supplier.contactName,
        supplier.phone,
        supplier.email ?? "",
        supplierAddress(supplier),
        formatPKR(totals.get(supplier.id) ?? 0),
      ]),
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Suppliers"
        description="Wholesale contacts and how much has been bought from each."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={exportRows}>
              <Download />
              Export CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus />
              Add Supplier
            </Button>
          </div>
        }
      />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name or contact person"
        aria-label="Search suppliers"
        className="max-w-md"
      />
      {loading && !data ? <LoadingRows /> : null}
      {error && !data ? <LoadError message={error} onRetry={reload} /> : null}
      {data && suppliers.length === 0 ? (
        <EmptyState title="No suppliers yet" description="Add your first supplier to record purchases." />
      ) : null}
      {data && suppliers.length > 0 && filtered.length === 0 ? (
        <EmptyState title="No matching suppliers" description="Try a different name or contact person." />
      ) : null}
      {data && filtered.length > 0 ? (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact person</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Total purchased</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactName}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.email ?? "—"}</TableCell>
                  <TableCell>{supplierAddress(supplier)}</TableCell>
                  <TableCell className="text-right">{formatPKR(totals.get(supplier.id) ?? 0)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Edit ${supplier.name}`}
                        onClick={() => {
                          setEditing(supplier);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete ${supplier.name}`}
                        onClick={() => setDeleting(supplier)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit supplier" : "Add supplier"}</DialogTitle>
            <DialogDescription>Contact details used on purchase records.</DialogDescription>
          </DialogHeader>
          {formOpen ? (
            <SupplierForm
              key={editing?.id ?? "new"}
              supplier={editing}
              onCancel={() => setFormOpen(false)}
              onSaved={() => {
                setFormOpen(false);
                setEditing(null);
                reload();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleting !== null}
        title="Delete supplier"
        description={deleting ? `Remove ${deleting.name}?` : ""}
        blockedReason={
          purchaseLinked ? "This supplier has purchase history and cannot be deleted." : null
        }
        pending={deletePending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
