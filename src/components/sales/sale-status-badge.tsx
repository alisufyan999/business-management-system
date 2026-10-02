import { Badge } from "@/components/ui/badge";
import { saleStatusLabel } from "@/lib/sale-fields";
import type { SaleStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<SaleStatus, string> = {
  paid: "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  partial: "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300",
  credit: "border-transparent bg-destructive/15 text-destructive",
};

export function SaleStatusBadge({ status, className }: { status: SaleStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(styles[status], className)}>
      {saleStatusLabel[status]}
    </Badge>
  );
}
