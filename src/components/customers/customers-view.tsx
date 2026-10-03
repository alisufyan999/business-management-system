"use client";

import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/catalog/delete-dialog";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { CustomerDetail } from "@/components/customers/customer-detail";
import { CustomerForm } from "@/components/customers/customer-form";
import { CustomerTypeBadge } from "@/components/customers/customer-type-badge";
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
import { formatPKR } from "@/lib/format";
import { csvExportFilename, downloadCsv } from "@/lib/csv";
import { customerTypeLabel, outstandingBalance } from "@/lib/sale-fields";
import * as creditService from "@/lib/services/credit.service";
import * as customersService from "@/lib/services/customers.service";
import * as salesService from "@/lib/services/sales.service";
import type { CreditLedgerEntry, Customer, CustomerType, Sale } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CustomerData {
  customers: Customer[];
  sales: Sale[];
  credit: CreditLedgerEntry[];
}

const typeFilters: Array<CustomerType | "all"> = ["all", "walk_in", "regular", "credit"];

export function CustomersView() {
  const { data, error, loading, reload } = useEntityList<CustomerData>(async () => {
    const [customers, sales, credit] = await Promise.all([
      customersService.getAll(),
      salesService.getAll(),
      creditService.getAll(),
    ]);
    return { customers, sales, credit };
  });
  const [query, setQuery] = useState("");
  const [type, setType] = useState<CustomerType | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [detail, setDetail] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const customers = useMemo(() => data?.customers ?? [], [data]);
  const sales = useMemo(() => data?.sales ?? [], [data]);
  const credit = useMemo(() => data?.credit ?? [], [data]);

  const purchaseTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of sales) {
      map.set(sale.customerId, (map.get(sale.customerId) ?? 0) + sale.amount);
    }
    return map;
  }, [sales]);

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const customer of customers) {
      map.set(
        customer.id,
        outstandingBalance(credit.filter((entry) => entry.customerId === customer.id)),
      );
    }
    return map;
  }, [customers, credit]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesType = type === "all" || customer.type === type;
      if (!matchesType) return false;
      if (needle.length === 0) return true;
      return (
        customer.name.toLowerCase().includes(needle) ||
        (customer.phone ?? "").toLowerCase().includes(needle)
      );
    });
  }, [customers, query, type]);

  const historyLinked = deleting
    ? sales.some((sale) => sale.customerId === deleting.id) ||
      credit.some((entry) => entry.customerId === deleting.id)
    : false;

  async function confirmDelete() {
    if (!deleting || historyLinked) return;
    setDeletePending(true);
    try {
      await customersService.removeCustomer(deleting.id);
      toast.success("Customer deleted");
      setDeleting(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete the customer.");
    } finally {
      setDeletePending(false);
    }
  }

  function exportRows() {
    downloadCsv(
      csvExportFilename("customers"),
      ["Name", "Phone", "Email", "Type", "Total purchases", "Outstanding"],
      filtered.map((customer) => [
        customer.name,
        customer.phone ?? "",
        customer.email ?? "",
        customerTypeLabel[customer.type],
        formatPKR(purchaseTotals.get(customer.id) ?? 0),
        formatPKR(balances.get(customer.id) ?? 0),
      ]),
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Walk-in, regular, and credit customers, with live purchase and balance totals."
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
              Add Customer
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or phone"
          aria-label="Search customers"
          className="sm:max-w-xs"
        />
        <Select value={type} onValueChange={(value) => setType((value ?? "all") as CustomerType | "all")}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            {typeFilters.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "all" ? "All types" : customerTypeLabel[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingRows /> : null}
      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="No customers yet — add your first customer."
        />
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total purchases</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => {
                const balance = balances.get(customer.id) ?? 0;
                return (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => setDetail(customer)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || "—"}</TableCell>
                    <TableCell>{customer.email || "—"}</TableCell>
                    <TableCell>
                      <CustomerTypeBadge type={customer.type} />
                    </TableCell>
                    <TableCell>{formatPKR(purchaseTotals.get(customer.id) ?? 0)}</TableCell>
                    <TableCell className={cn(balance > 0 && "font-medium text-destructive")}>
                      {formatPKR(balance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${customer.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditing(customer);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete ${customer.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleting(customer);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            <DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update contact details and customer type." : "Add a customer to the register."}
            </DialogDescription>
          </DialogHeader>
          {formOpen ? (
            <CustomerForm
              key={editing?.id ?? "new"}
              customer={editing}
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

      <CustomerDetail
        customer={detail}
        sales={sales}
        credit={credit}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />

      <DeleteDialog
        open={deleting !== null}
        title="Delete customer"
        description={deleting ? `Remove ${deleting.name} from the register?` : ""}
        blockedReason={
          historyLinked
            ? "This customer has sales or credit history and cannot be deleted."
            : null
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
