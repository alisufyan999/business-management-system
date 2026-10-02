"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/catalog/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supplierSchema, type SupplierFormValues } from "@/lib/schemas/supplier";
import * as suppliersService from "@/lib/services/suppliers.service";
import type { Supplier } from "@/lib/types";

function defaults(supplier?: Supplier | null): SupplierFormValues {
  return {
    name: supplier?.name ?? "",
    contactName: supplier?.contactName ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    address: supplier?.address ?? "",
    city: supplier?.city ?? "",
  };
}

export function SupplierForm({
  supplier,
  onCancel,
  onSaved,
}: {
  supplier?: Supplier | null;
  onCancel: () => void;
  onSaved: (supplier: Supplier) => void;
}) {
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    mode: "onChange",
    defaultValues: defaults(supplier),
  });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: SupplierFormValues) {
    const payload: Omit<Supplier, "id"> = {
      name: values.name,
      contactName: values.contactName,
      phone: values.phone,
      email: values.email.trim() ? values.email.trim() : undefined,
      address: values.address.trim() ? values.address.trim() : undefined,
      city: values.city,
    };
    try {
      const saved = supplier
        ? await suppliersService.update(supplier.id, payload)
        : await suppliersService.create(payload);
      toast.success(supplier ? "Supplier updated" : "Supplier added");
      onSaved(saved);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the supplier.");
    }
  }

  const errors = form.formState.errors;

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="supplier-name">Supplier name</Label>
          <Input id="supplier-name" {...form.register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="supplier-contact">Contact person</Label>
          <Input id="supplier-contact" {...form.register("contactName")} />
          <FieldError message={errors.contactName?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="supplier-phone">Phone</Label>
          <Input id="supplier-phone" {...form.register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="supplier-email">Email</Label>
          <Input id="supplier-email" type="email" {...form.register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="supplier-address">Address</Label>
          <Input id="supplier-address" {...form.register("address")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="supplier-city">City</Label>
          <Input id="supplier-city" {...form.register("city")} />
          <FieldError message={errors.city?.message} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : supplier ? "Save changes" : "Add supplier"}
        </Button>
      </div>
    </form>
  );
}
