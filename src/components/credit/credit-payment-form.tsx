"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useMemo } from "react";
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
import { creditPaymentSchema, type CreditPaymentFormValues } from "@/lib/schemas/credit-payment";
import { saleBalance } from "@/lib/sale-fields";
import { recordCreditPayment } from "@/lib/services/credit.service";
import type { CreditLedgerEntry, SupplierPaymentMethod } from "@/lib/types";

const methods: SupplierPaymentMethod[] = ["cash", "online", "cheque", "pay_order"];

export function CreditPaymentForm({
  entry,
  onCancel,
  onSaved,
}: {
  entry: CreditLedgerEntry;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const remaining = saleBalance(entry.amount, entry.amountPaid);
  const schema = useMemo(() => creditPaymentSchema(remaining), [remaining]);
  const form = useForm<CreditPaymentFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      amount: remaining,
      method: "cash",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });
  const method = useWatch({ control: form.control, name: "method" });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: CreditPaymentFormValues) {
    try {
      await recordCreditPayment({
        entryId: entry.id,
        amount: values.amount,
        method: values.method,
        date: values.date,
        notes: values.notes,
      });
      toast.success("Payment recorded");
      onSaved();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not record the payment.");
    }
  }

  const errors = form.formState.errors;

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="credit-amount">Amount received (Rs.)</Label>
          <Input
            id="credit-amount"
            type="number"
            min={1}
            max={remaining}
            {...form.register("amount", { valueAsNumber: true })}
          />
          <FieldError message={errors.amount?.message} />
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="credit-date">Date</Label>
          <Input id="credit-date" type="date" {...form.register("date")} />
          <FieldError message={errors.date?.message} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="credit-notes">Notes</Label>
          <Textarea id="credit-notes" rows={2} {...form.register("notes")} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Record payment"}
        </Button>
      </div>
    </form>
  );
}
