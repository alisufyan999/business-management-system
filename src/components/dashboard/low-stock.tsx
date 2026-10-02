import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";

export function LowStockWidget({ products }: { products: Product[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Low stock</CardTitle>
        <CardDescription>At or below the reorder threshold</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Every laptop is above its stock threshold.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map((product) => (
              <li key={product.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.specs.ram} · {product.specs.storage}
                  </p>
                </div>
                <Badge variant={product.quantity === 0 ? "destructive" : "outline"}>
                  {product.quantity} / {product.lowStockThreshold}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
