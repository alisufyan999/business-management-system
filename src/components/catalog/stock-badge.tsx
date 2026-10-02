import { Badge } from "@/components/ui/badge";
import { stockStatus, stockStatusLabel, type StockStatus } from "@/lib/stock";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<StockStatus, string> = {
  in_stock: "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  low_stock: "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300",
  out_of_stock: "border-transparent bg-destructive/15 text-destructive",
};

export function StockBadge({ product, className }: { product: Product; className?: string }) {
  const status = stockStatus(product);
  return (
    <Badge variant="outline" className={cn(styles[status], className)}>
      {stockStatusLabel(status)}
    </Badge>
  );
}
