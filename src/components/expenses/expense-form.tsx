"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/catalog/field";
import { expenseCategoryLabel } from "@/components/expenses/category-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPaymentMethod } from "@/lib/format";
import { expenseSchema, manualExpenseCategories, type ExpenseFormValues } from "@/lib/schemas/expense";
import * as expensesService from "@/lib/services/expenses.service";
import type { Expense, ExpenseCategory, SupplierPaymentMethod } from "@/lib/types";

const methods: SupplierPaymentMethod[] = ["cash", "online", "cheque", "pay_order"];

function manualCategory(category: ExpenseCategory): ExpenseFormValues["category"] {
  if (category === "salary") return "misc";
  return category;
}

export function ExpenseForm({
  expense,
  onCancel,
  onSaved,
}: {
  expense?: Expense | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    mode: "onChange",
    defaultValues: {
      date: expense?.date ?? format(new Date(), "yyyy-MM-dd"),
      category: expense ? manualCategory(expense.category) : "rent",
      description: expense?.description ?? "",
      amount: expense?.amount ?? 0,
      paymentMethod: expense?.paymentMethod ?? "cash",
    },
  });
  const category = useWatch({ control: form.control, name: "category" });
  const method = useWatch({ control: form.control, name: "paymentMethod" });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: ExpenseFormValues) {
    const payload = {
      date: values.date,
      category: values.category,
      description: values.description,
      amount: Math.round(values.amount),
      paymentMethod: values.paymentMethod,
    };
    try {
      if (expense) {
        await expensesService.update(expense.id, payload);
        toast.success("Expense updated");
      } else {
        await expensesService.create(payload);
        toast.success("Expense added");
      }
      onSaved();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the expense.");
    }
  }

  const errors = form.formState.errors;

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-date">Date</Label>
          <Input id="expense-date" type="date" {...form.register("date")} />
          <FieldError message={errors.date?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(value) =>
              form.setValue("category", (value ?? "rent") as ExpenseFormValues["category"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {manualExpenseCategories.map((item) => (
                <SelectItem key={item} value={item}>
                  {expenseCategoryLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.category?.message} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="expense-description">Description</Label>
          <Input id="expense-description" {...form.register("description")} />
          <FieldError message={errors.description?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-amount">Amount (Rs.)</Label>
          <Input
            id="expense-amount"
            type="number"
            min={1}
            {...form.register("amount", { valueAsNumber: true })}
          />
          <FieldError message={errors.amount?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Payment method</Label>
          <Select
            value={method}
            onValueChange={(value) =>
              form.setValue("paymentMethod", (value ?? "cash") as SupplierPaymentMethod, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              {methods.map((item) => (
                <SelectItem key={item} value={item}>
                  {formatPaymentMethod(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.paymentMethod?.message} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : expense ? "Save changes" : "Add expense"}
        </Button>
      </div>
    </form>
  );
}
