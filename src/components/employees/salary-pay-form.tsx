"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/catalog/field";
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
import { Textarea } from "@/components/ui/textarea";
import { formatPaymentMethod } from "@/lib/format";
import { salaryPaymentSchema, type SalaryPaymentFormValues } from "@/lib/schemas/employee";
import { todayKey } from "@/lib/sale-fields";
import { paySalary } from "@/lib/services/employees.service";
import type { Employee, SupplierPaymentMethod } from "@/lib/types";

const methods: SupplierPaymentMethod[] = ["cash", "online", "cheque", "pay_order"];

export function SalaryPayForm({
  employee,
  onCancel,
  onSaved,
}: {
  employee: Employee;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const form = useForm<SalaryPaymentFormValues>({
    resolver: zodResolver(salaryPaymentSchema),
    mode: "onChange",
    defaultValues: {
      month: todayKey().slice(0, 7),
      amount: employee.monthlySalary,
      date: format(new Date(), "yyyy-MM-dd"),
      method: "cash",
      notes: "",
    },
  });
  const method = useWatch({ control: form.control, name: "method" });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: SalaryPaymentFormValues) {
    try {
      await paySalary({
        employeeId: employee.id,
        month: values.month,
        amount: values.amount,
        date: values.date,
        method: values.method,
        notes: values.notes,
      });
      toast.success("Salary paid");
      onSaved();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not record the salary.");
    }
  }

  const errors = form.formState.errors;

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-month">Month</Label>
          <Input id="salary-month" type="month" {...form.register("month")} />
          <FieldError message={errors.month?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-amount">Amount (Rs.)</Label>
          <Input
            id="salary-amount"
            type="number"
            min={1}
            {...form.register("amount", { valueAsNumber: true })}
          />
          <FieldError message={errors.amount?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-date">Payment date</Label>
          <Input id="salary-date" type="date" {...form.register("date")} />
          <FieldError message={errors.date?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Payment method</Label>
          <Select
            value={method}
            onValueChange={(value) =>
              form.setValue("method", (value ?? "cash") as SupplierPaymentMethod, { shouldValidate: true })
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
          <FieldError message={errors.method?.message} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="salary-notes">Notes</Label>
          <Textarea id="salary-notes" rows={2} {...form.register("notes")} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Pay salary"}
        </Button>
      </div>
    </form>
  );
}
