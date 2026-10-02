"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/catalog/field";
import { SearchableSelect } from "@/components/catalog/searchable-select";
import { ProductForm } from "@/components/inventory/product-form";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPaymentMethod, formatPKR } from "@/lib/format";
import { suggestUnitCost } from "@/lib/purchase-fields";
import { purchaseSchema, type PurchaseFormValues } from "@/lib/schemas/purchase";
import { createPurchase } from "@/lib/services/purchases.service";
import type { Product, Purchase, Supplier, SupplierPaymentMethod } from "@/lib/types";

const methods: SupplierPaymentMethod[] = ["cash", "online", "cheque", "pay_order"];

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export function PurchaseForm({
  suppliers,
  products,
  purchases,
  onCancel,
  onSaved,
}: {
  suppliers: Supplier[];
  products: Product[];
  purchases: Purchase[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [extraSuppliers, setExtraSuppliers] = useState<Supplier[]>([]);
  const [extraProducts, setExtraProducts] = useState<Product[]>([]);
  const [supplierDialog, setSupplierDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const supplierOptions = [
    ...extraSuppliers,
    ...suppliers.filter((supplier) => !extraSuppliers.some((item) => item.id === supplier.id)),
  ];
  const productOptions = [
    ...extraProducts,
    ...products.filter((product) => !extraProducts.some((item) => item.id === product.id)),
  ];

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    mode: "onChange",
    defaultValues: {
      supplierId: "",
      productId: "",
      quantity: 1,
      unitCost: 0,
      date: today(),
      paymentMethod: "cash",
      paymentStatus: "paid",
      dueDate: "",
      notes: "",
    },
  });

  const paymentStatus = useWatch({ control: form.control, name: "paymentStatus" });
  const paymentMethod = useWatch({ control: form.control, name: "paymentMethod" });
  const supplierId = useWatch({ control: form.control, name: "supplierId" });
  const productId = useWatch({ control: form.control, name: "productId" });
  const quantity = Number(useWatch({ control: form.control, name: "quantity" }));
  const unitCost = Number(useWatch({ control: form.control, name: "unitCost" }));
  const total = Number.isFinite(quantity) && Number.isFinite(unitCost) ? quantity * unitCost : 0;

  useEffect(() => {
    void form.trigger();
  }, [form]);

  function chooseProduct(productId: string, catalog = productOptions) {
    form.setValue("productId", productId, { shouldValidate: true });
    const product = catalog.find((item) => item.id === productId);
    if (!product) return;
    form.setValue("unitCost", suggestUnitCost(productId, purchases, product.purchaseCost), {
      shouldValidate: true,
    });
  }

  async function onSubmit(values: PurchaseFormValues) {
    try {
      await createPurchase({
        supplierId: values.supplierId,
        productId: values.productId,
        quantity: values.quantity,
        unitCost: values.unitCost,
        date: values.date,
        paymentMethod: values.paymentMethod,
        paymentStatus: values.paymentStatus,
        dueDate: values.dueDate,
        notes: values.notes,
      });
      toast.success("Purchase recorded and stock updated");
      onSaved();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the purchase.");
    }
  }

  const errors = form.formState.errors;

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Supplier</Label>
            <SearchableSelect
              value={supplierId}
              onChange={(value) => form.setValue("supplierId", value, { shouldValidate: true })}
              options={supplierOptions.map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
                description: supplier.contactName,
              }))}
              placeholder="Select supplier"
              searchPlaceholder="Search suppliers"
              emptyLabel="No suppliers found"
              action={{ label: "+ Add New Supplier", onSelect: () => setSupplierDialog(true) }}
            />
            <FieldError message={errors.supplierId?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Product</Label>
            <SearchableSelect
              value={productId}
              onChange={(value) => chooseProduct(value)}
              options={productOptions.map((product) => ({
                value: product.id,
                label: product.name,
                description: `${product.quantity} in stock`,
              }))}
              placeholder="Select product"
              searchPlaceholder="Search products"
              emptyLabel="No products found"
              action={{ label: "+ Add New Product", onSelect: () => setProductDialog(true) }}
            />
            <FieldError message={errors.productId?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase-qty">Quantity</Label>
            <Input id="purchase-qty" type="number" min={1} step={1} {...form.register("quantity", { valueAsNumber: true })} />
            <FieldError message={errors.quantity?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase-cost">Unit cost (Rs.)</Label>
            <Input id="purchase-cost" type="number" min={1} {...form.register("unitCost", { valueAsNumber: true })} />
            <FieldError message={errors.unitCost?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase-total">Total cost</Label>
            <Input id="purchase-total" readOnly value={formatPKR(total)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase-date">Purchase date</Label>
            <Input id="purchase-date" type="date" {...form.register("date")} />
            <FieldError message={errors.date?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Payment method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                form.setValue("paymentMethod", value as PurchaseFormValues["paymentMethod"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                {methods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {formatPaymentMethod(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.paymentMethod?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Payment status</Label>
            <Select
              value={paymentStatus}
              onValueChange={(value) =>
                form.setValue("paymentStatus", value as PurchaseFormValues["paymentStatus"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={errors.paymentStatus?.message} />
          </div>
          {paymentStatus === "pending" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchase-due">Due date</Label>
              <Input id="purchase-due" type="date" {...form.register("dueDate")} />
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="purchase-notes">Notes</Label>
            <Textarea id="purchase-notes" rows={2} {...form.register("notes")} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : "Record purchase"}
          </Button>
        </div>
      </form>

      <Dialog open={supplierDialog} onOpenChange={setSupplierDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add supplier</DialogTitle>
            <DialogDescription>The new supplier will be selected on this purchase.</DialogDescription>
          </DialogHeader>
          {supplierDialog ? (
            <SupplierForm
              onCancel={() => setSupplierDialog(false)}
              onSaved={(supplier) => {
                setExtraSuppliers((current) => [supplier, ...current]);
                form.setValue("supplierId", supplier.id, { shouldValidate: true });
                setSupplierDialog(false);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
            <DialogDescription>The new laptop will be selected on this purchase.</DialogDescription>
          </DialogHeader>
          {productDialog ? (
            <ProductForm
              onCancel={() => setProductDialog(false)}
              onSaved={(product) => {
                const next = [product, ...extraProducts];
                setExtraProducts(next);
                chooseProduct(product.id, [...next, ...products]);
                setProductDialog(false);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
