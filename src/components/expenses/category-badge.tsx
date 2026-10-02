import { Badge } from "@/components/ui/badge";
import type { ExpenseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels: Record<ExpenseCategory, string> = {
  rent: "Rent",
  electricity: "Utilities",
  internet: "Internet",
  misc: "Misc",
  salary: "Salary",
};

const styles: Record<ExpenseCategory, string> = {
  rent: "border-transparent bg-primary/15 text-primary",
  electricity: "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300",
  internet: "border-transparent bg-sky-500/15 text-sky-800 dark:text-sky-300",
  misc: "border-transparent bg-muted text-muted-foreground",
  salary: "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
};

export function expenseCategoryLabel(category: ExpenseCategory): string {
  return labels[category];
}

export function CategoryBadge({ category, className }: { category: ExpenseCategory; className?: string }) {
  return (
    <Badge variant="outline" className={cn(styles[category], className)}>
      {labels[category]}
    </Badge>
  );
}
