"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FieldError, FieldWarning } from "@/components/catalog/field";
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
import { productSchema, type ProductFormValues } from "@/lib/schemas/product";
import * as productsService from "@/lib/services/products.service";
import { laptopBrands, productCategories } from "@/lib/stock";
import type { Product } from "@/lib/types";

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

function defaults(product?: Product | null): ProductFormValues {
  return {
    name: product?.name ?? "",
    brand: product?.brand ?? "Dell",
    category: productCategories.includes(product?.category as (typeof productCategories)[number])
      ? (product?.category as ProductFormValues["category"])
      : "Business",
    ram: product?.specs.ram ?? "",
    storage: product?.specs.storage ?? "",
    processor: product?.specs.processor ?? "",
    otherSpecs: product?.specs.other ?? "",
    purchaseCost: product?.purchaseCost ?? 0,
    sellingPrice: product?.sellingPrice ?? 0,
    quantity: product?.quantity ?? 1,
    lowStockThreshold: product?.lowStockThreshold ?? 5,
    dateAdded: product?.dateAdded ?? today(),
  };
}

export function ProductForm({
  product,
  onCancel,
  onSaved,
}: {
  product?: Product | null;
  onCancel: () => void;
  onSaved: (product: Product) => void;
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: defaults(product),
  });
  const purchaseCost = useWatch({ control: form.control, name: "purchaseCost" });
  const sellingPrice = useWatch({ control: form.control, name: "sellingPrice" });
  const brand = useWatch({ control: form.control, name: "brand" });
  const category = useWatch({ control: form.control, name: "category" });
  const belowCost =
    Number.isFinite(purchaseCost) &&
    Number.isFinite(sellingPrice) &&
    purchaseCost > 0 &&
    sellingPrice > 0 &&
    sellingPrice < purchaseCost;

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: ProductFormValues) {
    const payload: Omit<Product, "id"> = {
      name: values.name,
      brand: values.brand,
      model: product?.model ?? values.name,
      category: values.category,
      specs: {
        ram: values.ram,
        storage: values.storage,
        processor: values.processor,
        other: values.otherSpecs.trim() ? values.otherSpecs.trim() : undefined,
      },
      purchaseCost: values.purchaseCost,
      sellingPrice: values.sellingPrice,
      quantity: values.quantity,
      lowStockThreshold: values.lowStockThreshold,
      dateAdded: values.dateAdded,
    };
    try {
      const saved = product
        ? await productsService.update(product.id, payload)
        : await productsService.create(payload);
      toast.success(product ? "Product updated" : "Product added");
      onSaved(saved);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the product.");
    }
  }

  const errors = form.formState.errors;

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="product-name">Name</Label>
          <Input id="product-name" {...form.register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Brand</Label>
          <Select
            value={brand}
            onValueChange={(value) =>
              form.setValue("brand", value as ProductFormValues["brand"], { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              {laptopBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.brand?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(value) =>
              form.setValue("category", value as ProductFormValues["category"], { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {productCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.category?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-ram">RAM</Label>
          <Input id="product-ram" placeholder="16 GB" {...form.register("ram")} />
          <FieldError message={errors.ram?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-storage">Storage</Label>
          <Input id="product-storage" placeholder="512 GB SSD" {...form.register("storage")} />
          <FieldError message={errors.storage?.message} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="product-processor">Processor</Label>
          <Input id="product-processor" {...form.register("processor")} />
          <FieldError message={errors.processor?.message} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="product-other">Other specs</Label>
          <Textarea id="product-other" rows={2} {...form.register("otherSpecs")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-cost">Purchase cost (Rs.)</Label>
          <Input id="product-cost" type="number" min={1} {...form.register("purchaseCost", { valueAsNumber: true })} />
          <FieldError message={errors.purchaseCost?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-price">Selling price (Rs.)</Label>
          <Input id="product-price" type="number" min={1} {...form.register("sellingPrice", { valueAsNumber: true })} />
          <FieldError message={errors.sellingPrice?.message} />
          <FieldWarning message={belowCost ? "Selling price is below purchase cost." : undefined} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-qty">Quantity</Label>
          <Input id="product-qty" type="number" min={0} step={1} {...form.register("quantity", { valueAsNumber: true })} />
          <FieldError message={errors.quantity?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-threshold">Low-stock threshold</Label>
          <Input id="product-threshold" type="number" min={0} step={1} {...form.register("lowStockThreshold", { valueAsNumber: true })} />
          <FieldError message={errors.lowStockThreshold?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-date">Date added</Label>
          <Input id="product-date" type="date" {...form.register("dateAdded")} />
          <FieldError message={errors.dateAdded?.message} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : product ? "Save changes" : "Add product"}
        </Button>
      </div>
    </form>
  );
}
