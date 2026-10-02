"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/catalog/delete-dialog";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { StockBadge } from "@/components/catalog/stock-badge";
import { ProductDetail } from "@/components/inventory/product-detail";
import { ProductForm } from "@/components/inventory/product-form";
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
import * as productsService from "@/lib/services/products.service";
import * as purchasesService from "@/lib/services/purchases.service";
import * as salesService from "@/lib/services/sales.service";
import { laptopBrands, productCategories, specSummary, stockStatus } from "@/lib/stock";
import type { Product, Purchase, Sale } from "@/lib/types";

interface InventoryData {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
}

export function InventoryView() {
  const { data, error, loading, reload } = useEntityList<InventoryData>(async () => {
    const [products, purchases, sales] = await Promise.all([
      productsService.getAll(),
      purchasesService.getAll(),
      salesService.getAll(),
    ]);
    return { products, purchases, sales };
  });
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const products = useMemo(() => data?.products ?? [], [data]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        needle.length === 0 ||
        product.name.toLowerCase().includes(needle) ||
        product.brand.toLowerCase().includes(needle);
      const matchesBrand = brand === "all" || product.brand === brand;
      const matchesCategory = category === "all" || product.category === category;
      const matchesStatus = status === "all" || stockStatus(product) === status;
      return matchesQuery && matchesBrand && matchesCategory && matchesStatus;
    });
  }, [products, query, brand, category, status]);

  const salesLinked = deleting
    ? (data?.sales ?? []).some((sale) => sale.items.some((item) => item.productId === deleting.id))
    : false;

  async function confirmDelete() {
    if (!deleting || salesLinked) return;
    setDeletePending(true);
    try {
      await productsService.removeProduct(deleting.id);
      toast.success("Product deleted");
      setDeleting(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete the product.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Inventory"
        description="Laptops in stock, cost, and selling price."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add Product
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or brand"
          aria-label="Search products"
        />
        <Select value={brand} onValueChange={(value) => setBrand(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by brand">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {laptopBrands.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {productCategories.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by stock status">
            <SelectValue placeholder="Stock status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock statuses</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading && !data ? <LoadingRows /> : null}
      {error && !data ? <LoadError message={error} onRetry={reload} /> : null}
      {data && products.length === 0 ? (
        <EmptyState title="No products yet" description="Add your first product to start tracking stock." />
      ) : null}
      {data && products.length > 0 && filtered.length === 0 ? (
        <EmptyState title="No matching products" description="Try a different search or filter." />
      ) : null}
      {data && filtered.length > 0 ? (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead className="text-right">Purchase cost</TableHead>
                <TableHead className="text-right">Selling price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id} className="cursor-pointer" onClick={() => setDetail(product)}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="max-w-56 truncate">{specSummary(product)}</TableCell>
                  <TableCell className="text-right">{formatPKR(product.purchaseCost)}</TableCell>
                  <TableCell className="text-right">{formatPKR(product.sellingPrice)}</TableCell>
                  <TableCell className="text-right">{product.quantity}</TableCell>
                  <TableCell>
                    <StockBadge product={product} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Edit ${product.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditing(product);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete ${product.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleting(product);
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update stock, pricing, and specs." : "Add a laptop to the inventory."}
            </DialogDescription>
          </DialogHeader>
          {formOpen ? (
            <ProductForm
              key={editing?.id ?? "new"}
              product={editing}
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

      <ProductDetail
        product={detail}
        purchases={data?.purchases ?? []}
        sales={data?.sales ?? []}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />

      <DeleteDialog
        open={deleting !== null}
        title="Delete product"
        description={deleting ? `Remove ${deleting.name} from inventory?` : ""}
        blockedReason={
          salesLinked
            ? "This product has sales history and cannot be deleted."
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
