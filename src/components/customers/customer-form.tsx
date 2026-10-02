"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { customerSchema, type CustomerFormValues } from "@/lib/schemas/customer";
import { customerTypeLabel } from "@/lib/sale-fields";
import * as customersService from "@/lib/services/customers.service";
import type { Customer, CustomerType } from "@/lib/types";

const types: CustomerType[] = ["walk_in", "regular", "credit"];

function defaults(customer?: Customer | null): CustomerFormValues {
  return {
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    type: customer?.type ?? "regular",
  };
}

export function CustomerForm({
  customer,
  onCancel,
  onSaved,
}: {
  customer?: Customer | null;
  onCancel: () => void;
  onSaved: (customer: Customer) => void;
}) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    mode: "onChange",
    defaultValues: defaults(customer),
  });
  const type = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: CustomerFormValues) {
    const payload: Omit<Customer, "id"> = {
      name: values.name,
      phone: values.phone,
      type: values.type,
      email: values.email.trim() ? values.email.trim() : undefined,
      address: values.address.trim() ? values.address.trim() : undefined,
      ...(customer?.city ? { city: customer.city } : {}),
    };
    try {
      const saved = customer
        ? await customersService.update(customer.id, payload)
        : await customersService.create(payload);
      toast.success(customer ? "Customer updated" : "Customer added");
      onSaved(saved);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the customer.");
    }
  }

  const errors = form.formState.errors;

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="customer-name">Name</Label>
          <Input id="customer-name" {...form.register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-phone">Phone</Label>
          <Input id="customer-phone" {...form.register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-email">Email</Label>
          <Input id="customer-email" type="email" {...form.register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="customer-address">Address</Label>
          <Input id="customer-address" {...form.register("address")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(value) =>
              form.setValue("type", (value ?? "regular") as CustomerType, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((item) => (
                <SelectItem key={item} value={item}>
                  {customerTypeLabel[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.type?.message} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : customer ? "Save changes" : "Add customer"}
        </Button>
      </div>
    </form>
  );
}
