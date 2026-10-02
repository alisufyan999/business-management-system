"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FieldError } from "@/components/catalog/field";
import { PageHeader } from "@/components/catalog/page-states";
import { SearchableSelect } from "@/components/catalog/searchable-select";
import { CustomerForm } from "@/components/customers/customer-form";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEntityList } from "@/hooks/use-entity-list";
import { formatPaymentMethod, formatPKR } from "@/lib/format";
import { saleSchema, type SaleFormValues } from "@/lib/schemas/sale";
import { walkInSchema, type WalkInFormValues } from "@/lib/schemas/customer";
import { discountAmount, grandTotal, lineTotal, saleBalance, saleSubtotal } from "@/lib/sale-fields";
import * as customersService from "@/lib/services/customers.service";
import * as productsService from "@/lib/services/products.service";
import { createSale } from "@/lib/services/sales.service";
import type { Customer, PaymentMethod, Product } from "@/lib/types";

const methods: PaymentMethod[] = ["cash", "online", "cheque", "pay_order", "credit"];

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export function PosView() {
  const router = useRouter();
  const { data, error, loading, reload } = useEntityList(async () => {
    const [customers, products] = await Promise.all([
      customersService.getAll(),
      productsService.getAll(),
    ]);
    return { customers, products };
  });
  const [extraCustomers, setExtraCustomers] = useState<Customer[]>([]);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [receivedTouched, setReceivedTouched] = useState(false);

  const customers = useMemo(() => {
    const loaded = data?.customers ?? [];
    return [
      ...extraCustomers,
      ...loaded.filter((customer) => !extraCustomers.some((item) => item.id === customer.id)),
    ];
  }, [data, extraCustomers]);
  const products = useMemo(() => data?.products ?? [], [data]);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    mode: "onChange",
    defaultValues: {
      customerId: "",
      lines: [],
      discountType: "fixed",
      discountValue: 0,
      date: today(),
      paymentMethod: "cash",
      amountReceived: 0,
      dueDate: "",
      notes: "",
    },
  });
  const { fields, append, remove, update } = useFieldArray({ control: form.control, name: "lines" });
  const lines = useWatch({ control: form.control, name: "lines" });
  const discountType = useWatch({ control: form.control, name: "discountType" });
  const discountValue = Number(useWatch({ control: form.control, name: "discountValue" }) || 0);
  const paymentMethod = useWatch({ control: form.control, name: "paymentMethod" });
  const amountReceived = Number(useWatch({ control: form.control, name: "amountReceived" }) || 0);
  const customerId = useWatch({ control: form.control, name: "customerId" });

  const walkIn = useForm<WalkInFormValues>({
    resolver: zodResolver(walkInSchema),
    mode: "onChange",
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  const safeLines = (lines ?? []).map((line) => ({
    productId: line.productId,
    quantity: Number(line.quantity) || 0,
    unitPrice: Number(line.unitPrice) || 0,
  }));
  const subtotal = saleSubtotal(safeLines);
  const discount = discountAmount(subtotal, discountType, discountValue);
  const total = grandTotal(subtotal, discountType, discountValue);
  const balance = saleBalance(total, Number.isFinite(amountReceived) ? amountReceived : 0);
  const errors = form.formState.errors;

  function cartQty(productId: string, exceptIndex?: number) {
    return safeLines.reduce((sum, line, index) => {
      if (line.productId !== productId || index === exceptIndex) return sum;
      return sum + line.quantity;
    }, 0);
  }

  function syncReceived(nextTotal: number, method: PaymentMethod = paymentMethod) {
    if (receivedTouched) {
      const current = Number(form.getValues("amountReceived")) || 0;
      if (current > nextTotal) {
        form.setValue("amountReceived", nextTotal, { shouldValidate: true });
      }
      return;
    }
    form.setValue("amountReceived", method === "credit" ? 0 : nextTotal, { shouldValidate: true });
  }

  function addProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const index = (lines ?? []).findIndex((line) => line.productId === productId);
    if (product.quantity - cartQty(productId) < 1) {
      toast.error(`${product.name} only has ${product.quantity} in stock.`);
      return;
    }
    if (index >= 0) {
      const nextQty = (Number(lines[index]?.quantity) || 0) + 1;
      form.setValue(`lines.${index}.quantity`, nextQty, { shouldValidate: true });
    } else {
      append({ productId, quantity: 1, unitPrice: product.sellingPrice });
    }
    const nextLines = index >= 0
      ? safeLines.map((line, lineIndex) =>
          lineIndex === index ? { ...line, quantity: line.quantity + 1 } : line,
        )
      : [...safeLines, { productId, quantity: 1, unitPrice: product.sellingPrice }];
    syncReceived(grandTotal(saleSubtotal(nextLines), discountType, discountValue));
    void form.trigger();
  }

  function changeQty(index: number, product: Product, quantity: number) {
    const others = cartQty(product.id, index);
    const capped = Math.min(Math.max(1, quantity), Math.max(1, product.quantity - others));
    if (quantity > product.quantity - others) {
      toast.error(`${product.name} only has ${product.quantity} in stock.`);
    }
    update(index, {
      productId: product.id,
      quantity: capped,
      unitPrice: Number(lines[index]?.unitPrice) || product.sellingPrice,
    });
    const nextLines = safeLines.map((line, lineIndex) =>
      lineIndex === index ? { ...line, quantity: capped } : line,
    );
    syncReceived(grandTotal(saleSubtotal(nextLines), discountType, discountValue));
    void form.trigger();
  }

  async function saveWalkIn(values: WalkInFormValues) {
    try {
      const saved = await customersService.create({
        name: values.name,
        phone: values.phone.trim() ? values.phone.trim() : undefined,
        type: "walk_in",
      });
      setExtraCustomers((current) => [saved, ...current]);
      form.setValue("customerId", saved.id, { shouldValidate: true });
      walkIn.reset();
      setWalkInOpen(false);
      toast.success("Walk-in customer added");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the customer.");
    }
  }

  async function onSubmit(values: SaleFormValues) {
    try {
      const sale = await createSale({
        customerId: values.customerId,
        lines: values.lines,
        discountType: values.discountType,
        discountValue: values.discountValue,
        date: values.date,
        paymentMethod: values.paymentMethod,
        amountReceived: values.amountReceived,
        dueDate: values.dueDate,
        notes: values.notes,
      });
      toast.success("Sale completed");
      router.push(`/sales/${sale.id}/invoice`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not complete the sale.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="New sale"
        description="Pick a customer, add laptops, and take payment."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading products and customers…</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <SearchableSelect
                value={customerId}
                onChange={(value) => form.setValue("customerId", value, { shouldValidate: true })}
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                  description: customer.phone,
                }))}
                placeholder="Select customer"
                searchPlaceholder="Search customers"
                emptyLabel="No customers found"
                action={{ label: "+ Add New Customer", onSelect: () => setCustomerDialog(true) }}
              />
              <FieldError message={errors.customerId?.message} />
              <Button type="button" variant="outline" onClick={() => setWalkInOpen((open) => !open)}>
                Walk-in customer
              </Button>
              {walkInOpen ? (
                <form className="grid gap-3 rounded-lg border p-3" onSubmit={walkIn.handleSubmit(saveWalkIn)}>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="walkin-name">Name</Label>
                    <Input id="walkin-name" {...walkIn.register("name")} />
                    <FieldError message={walkIn.formState.errors.name?.message} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="walkin-phone">Phone</Label>
                    <Input id="walkin-phone" {...walkIn.register("phone")} />
                    <FieldError message={walkIn.formState.errors.phone?.message} />
                  </div>
                  <Button type="submit" disabled={!walkIn.formState.isValid || walkIn.formState.isSubmitting}>
                    {walkIn.formState.isSubmitting ? "Saving…" : "Save walk-in"}
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add product</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchableSelect
                value=""
                onChange={addProduct}
                options={products.map((product) => {
                  const left = product.quantity - cartQty(product.id);
                  return {
                    value: product.id,
                    label: product.name,
                    description: left > 0 ? `${left} in stock` : "Out of stock",
                  };
                })}
                placeholder="Search a laptop"
                searchPlaceholder="Search products"
                emptyLabel="No products found"
              />
            </CardContent>
          </Card>
        </div>

        <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Cart</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items yet. Search a product to start the cart.</p>
              ) : (
                fields.map((field, index) => {
                  const product = products.find((item) => item.id === lines[index]?.productId);
                  const qty = Number(lines[index]?.quantity) || 0;
                  const price = Number(lines[index]?.unitPrice) || 0;
                  return (
                    <div key={field.id} className="grid gap-3 rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{product?.name ?? "Product"}</p>
                          <p className="text-xs text-muted-foreground">
                            {product ? `${product.quantity} in stock` : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Remove item"
                          onClick={() => {
                            const nextLines = safeLines.filter((_, lineIndex) => lineIndex !== index);
                            remove(index);
                            syncReceived(grandTotal(saleSubtotal(nextLines), discountType, discountValue));
                            void form.trigger();
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`qty-${field.id}`}>Quantity</Label>
                          <Input
                            id={`qty-${field.id}`}
                            type="number"
                            min={1}
                            step={1}
                            value={qty}
                            onChange={(event) => {
                              if (!product) return;
                              changeQty(index, product, Number(event.target.value));
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`price-${field.id}`}>Unit price</Label>
                          <Input
                            id={`price-${field.id}`}
                            type="number"
                            min={1}
                            {...form.register(`lines.${index}.unitPrice`, {
                              valueAsNumber: true,
                              onChange: (event) => {
                                const nextPrice = Number(event.target.value) || 0;
                                const nextLines = safeLines.map((line, lineIndex) =>
                                  lineIndex === index ? { ...line, unitPrice: nextPrice } : line,
                                );
                                syncReceived(grandTotal(saleSubtotal(nextLines), discountType, discountValue));
                              },
                            })}
                          />
                        </div>
                      </div>
                      <p className="text-sm">Line total {formatPKR(lineTotal({ quantity: qty, unitPrice: price }))}</p>
                    </div>
                  );
                })
              )}
              <FieldError message={errors.lines?.message ?? errors.lines?.root?.message} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPKR(subtotal)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discount and payment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Discount</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={discountType === "percent" ? "default" : "outline"}
                    onClick={() => {
                      form.setValue("discountType", "percent", { shouldValidate: true });
                      syncReceived(grandTotal(subtotal, "percent", discountValue));
                    }}
                  >
                    Percentage
                  </Button>
                  <Button
                    type="button"
                    variant={discountType === "fixed" ? "default" : "outline"}
                    onClick={() => {
                      form.setValue("discountType", "fixed", { shouldValidate: true });
                      syncReceived(grandTotal(subtotal, "fixed", discountValue));
                    }}
                  >
                    Fixed Rs.
                  </Button>
                </div>
                <Input
                  type="number"
                  min={0}
                  aria-label="Discount value"
                  {...form.register("discountValue", {
                    valueAsNumber: true,
                    onChange: (event) => {
                      const next = Number(event.target.value) || 0;
                      syncReceived(grandTotal(subtotal, discountType, next));
                    },
                  })}
                />
                <FieldError message={errors.discountValue?.message} />
                <p className="text-sm text-muted-foreground">Discount {formatPKR(discount)}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Grand total</span>
                <span className="text-lg font-semibold">{formatPKR(total)}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Payment method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => {
                      const method = (value ?? "cash") as PaymentMethod;
                      setReceivedTouched(false);
                      form.setValue("paymentMethod", method, { shouldValidate: true });
                      form.setValue("amountReceived", method === "credit" ? 0 : total, { shouldValidate: true });
                    }}
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
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="amount-received">Amount received now</Label>
                  <Input
                    id="amount-received"
                    type="number"
                    min={0}
                    {...form.register("amountReceived", {
                      valueAsNumber: true,
                      onChange: () => {
                        setReceivedTouched(true);
                      },
                    })}
                  />
                  <FieldError message={errors.amountReceived?.message} />
                </div>
              </div>

              {balance > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="balance-due">Remaining balance</Label>
                    <Input id="balance-due" readOnly value={formatPKR(balance)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="due-date">Due date</Label>
                    <Input id="due-date" type="date" {...form.register("dueDate")} />
                    <FieldError message={errors.dueDate?.message} />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="sale-notes">Reference / notes</Label>
                <Textarea id="sale-notes" rows={2} {...form.register("notes")} />
              </div>

              <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting || fields.length === 0}>
                {form.formState.isSubmitting ? "Saving…" : "Complete sale"}
              </Button>
            </CardContent>
          </Card>
          <input type="hidden" {...form.register("date")} />
        </form>
      </div>

      <Dialog open={customerDialog} onOpenChange={setCustomerDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add customer</DialogTitle>
            <DialogDescription>The new customer will be selected on this sale.</DialogDescription>
          </DialogHeader>
          {customerDialog ? (
            <CustomerForm
              onCancel={() => setCustomerDialog(false)}
              onSaved={(customer) => {
                setExtraCustomers((current) => [customer, ...current]);
                form.setValue("customerId", customer.id, { shouldValidate: true });
                setCustomerDialog(false);
                reload();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
