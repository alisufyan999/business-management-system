import { Badge } from "@/components/ui/badge";
import type { EmployeeRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<EmployeeRole, string> = {
  Manager: "border-transparent bg-primary/15 text-primary",
  Accountant: "border-transparent bg-secondary text-secondary-foreground",
  "Sales Staff": "border-transparent bg-sky-500/15 text-sky-800 dark:text-sky-300",
  Technician: "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
};

export function RoleBadge({ role, className }: { role: EmployeeRole; className?: string }) {
  return (
    <Badge variant="outline" className={cn(styles[role], className)}>
      {role}
    </Badge>
  );
}
