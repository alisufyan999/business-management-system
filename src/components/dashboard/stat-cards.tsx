import { Banknote, BookOpen, Package, Users, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function StatCards({
  todaySales,
  stockValue,
  outstandingCredit,
  employeeCount,
}: {
  todaySales: number;
  stockValue: number;
  outstandingCredit: number;
  employeeCount: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Today's Sales"
        value={formatPKR(todaySales)}
        hint="Invoices dated today"
        icon={Banknote}
      />
      <StatCard
        label="Total Stock Value"
        value={formatPKR(stockValue)}
        hint="Cost × quantity on hand"
        icon={Package}
      />
      <StatCard
        label="Outstanding Credit"
        value={formatPKR(outstandingCredit)}
        hint="Unpaid and partial balances"
        icon={BookOpen}
      />
      <StatCard
        label="Total Employees"
        value={String(employeeCount)}
        hint="Active team members"
        icon={Users}
      />
    </div>
  );
}
