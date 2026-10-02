import { Badge } from "@/components/ui/badge";
import { customerTypeLabel } from "@/lib/sale-fields";
import type { CustomerType } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<CustomerType, string> = {
  walk_in: "border-transparent bg-muted text-muted-foreground",
  regular: "border-transparent bg-primary/15 text-primary",
  credit: "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300",
};

export function CustomerTypeBadge({ type, className }: { type: CustomerType; className?: string }) {
  return (
    <Badge variant="outline" className={cn(styles[type], className)}>
      {customerTypeLabel[type]}
    </Badge>
  );
}
