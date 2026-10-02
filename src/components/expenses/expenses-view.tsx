"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/catalog/delete-dialog";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { CategoryBadge, expenseCategoryLabel } from "@/components/expenses/category-badge";
import { ExpenseChart } from "@/components/expenses/expense-chart";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Badge } from "@/components/ui/badge";
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
import { formatDisplayDate, formatPaymentMethod, formatPKR } from "@/lib/format";
import { todayKey } from "@/lib/sale-fields";
import * as expensesService from "@/lib/services/expenses.service";
import type { Expense, ExpenseCategory } from "@/lib/types";

const categories: Array<ExpenseCategory | "all"> = ["all", "rent", "electricity", "internet", "salary", "misc"];

function isAutoSalary(expense: Expense): boolean {
  return Boolean(expense.salaryPaymentId);
}

export function ExpensesView() {
  const { data, error, loading, reload } = useEntityList(() => expensesService.getAll());
  const [category, setCategory] = useState<ExpenseCategory | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const expenses = data ?? [];
  const month = todayKey().slice(0, 7);
  const thisMonth = expenses
    .filter((expense) => expense.date.startsWith(month))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const needle = query.trim().toLowerCase();
  const filtered = expenses
    .filter((expense) => {
      const matchesCategory = category === "all" || expense.category === category;
      const matchesFrom = from.length === 0 || expense.date >= from;
      const matchesTo = to.length === 0 || expense.date <= to;
      const matchesQuery = needle.length === 0 || expense.description.toLowerCase().includes(needle);
      return matchesCategory && matchesFrom && matchesTo && matchesQuery;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const slices = (["rent", "electricity", "internet", "salary", "misc"] as const).map((item) => ({
    key: item,
    label: expenseCategoryLabel(item),
    total: filtered.filter((expense) => expense.category === item).reduce((sum, expense) => sum + expense.amount, 0),
  }));

  async function confirmDelete() {
    if (!deleting || isAutoSalary(deleting)) return;
    setDeletePending(true);
    try {
      await expensesService.removeExpense(deleting.id);
      toast.success("Expense deleted");
      setDeleting(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete the expense.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Expenses"
        description="Operating costs. Salary rows are created when you pay an employee."
        action={
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add expense
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(thisMonth)}</p>
          </CardContent>
        </Card>
        <ExpenseChart data={slices} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={category}
          onValueChange={(value) => setCategory((value ?? "all") as ExpenseCategory | "all")}
        >
          <SelectTrigger className="w-full" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "all" ? "All categories" : expenseCategoryLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search description"
          aria-label="Search by description"
        />
      </div>

      {loading ? <LoadingRows /> : null}
      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState title="No expenses" description="Add an expense, or pay a salary from Employees." />
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((expense) => {
                const auto = isAutoSalary(expense);
                return (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDisplayDate(expense.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={expense.category} />
                        {auto ? <Badge variant="outline">auto</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-64 truncate font-medium">{expense.description}</TableCell>
                    <TableCell>{formatPKR(expense.amount)}</TableCell>
                    <TableCell>{formatPaymentMethod(expense.paymentMethod)}</TableCell>
                    <TableCell>
                      {auto ? null : (
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${expense.description}`}
                            onClick={() => {
                              setEditing(expense);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete ${expense.description}`}
                            onClick={() => setDeleting(expense)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      )}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit expense" : "Add expense"}</DialogTitle>
            <DialogDescription>Rent, utilities, internet, and other operating costs.</DialogDescription>
          </DialogHeader>
          {formOpen ? (
            <ExpenseForm
              key={editing?.id ?? "new"}
              expense={editing}
              onCancel={() => {
                setFormOpen(false);
                setEditing(null);
              }}
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
        title="Delete expense"
        description={deleting ? `Delete “${deleting.description}”?` : "Delete this expense?"}
        pending={deletePending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
