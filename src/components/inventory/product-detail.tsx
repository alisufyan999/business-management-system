"use client";

import { formatDisplayDate, formatPKR } from "@/lib/format";
import { specSummary } from "@/lib/stock";
import type { Product, Purchase, Sale } from "@/lib/types";
import { StockBadge } from "@/components/catalog/stock-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function ProductDetail({
  product,
  purchases,
  sales,
  onOpenChange,
}: {
  product: Product | null;
  purchases: Purchase[];
  sales: Sale[];
  onOpenChange: (open: boolean) => void;
}) {
  const productPurchases = product
    ? purchases
        .filter((purchase) => purchase.productId === product.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const productSales = product
    ? sales.flatMap((sale) =>
        sale.items
          .filter((item) => item.productId === product.id)
          .map((item) => ({ sale, item })),
      )
    : [];

  return (
    <Sheet open={product !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {product ? (
          <>
            <SheetHeader>
              <SheetTitle>{product.name}</SheetTitle>
              <SheetDescription>
                {product.brand} · {product.category}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              <div className="flex items-center justify-between gap-3">
                <StockBadge product={product} />
                <span className="text-sm text-muted-foreground">
                  {product.quantity} in stock
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Specs</dt>
                  <dd>{specSummary(product)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Other</dt>
                  <dd>{product.specs.other?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Purchase cost</dt>
                  <dd>{formatPKR(product.purchaseCost)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Selling price</dt>
                  <dd>{formatPKR(product.sellingPrice)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Low-stock threshold</dt>
                  <dd>{product.lowStockThreshold}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date added</dt>
                  <dd>{formatDisplayDate(product.dateAdded)}</dd>
                </div>
              </dl>
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Purchase history</h3>
                {productPurchases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No purchases for this laptop yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {productPurchases.map((purchase) => (
                      <li key={purchase.id} className="rounded-lg border px-3 py-2 text-sm">
                        <p className="font-medium">{purchase.supplierName}</p>
                        <p className="text-muted-foreground">
                          {formatDisplayDate(purchase.date)} · {purchase.quantity} × {formatPKR(purchase.unitCost)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Sales history</h3>
                {productSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales for this laptop yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {productSales.map(({ sale, item }) => (
                      <li key={`${sale.id}-${item.productId}`} className="rounded-lg border px-3 py-2 text-sm">
                        <p className="font-medium">{sale.customerName}</p>
                        <p className="text-muted-foreground">
                          {formatDisplayDate(sale.date)} · {item.quantity} × {formatPKR(item.unitPrice)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
