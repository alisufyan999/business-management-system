"use client";

import { format, parseISO } from "date-fns";
import { RoleBadge } from "@/components/employees/role-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDisplayDate, formatPaymentMethod, formatPKR } from "@/lib/format";
import { todayKey } from "@/lib/sale-fields";
import type { Employee, SalaryPayment } from "@/lib/types";

function formatMonth(month: string): string {
  return format(parseISO(`${month}-01`), "MMM yyyy");
}

interface SalaryHistoryRow {
  id: string;
  month: string;
  amount: number;
  paidOn?: string;
  method?: SalaryPayment["method"];
  status: "paid" | "pending";
}

function historyFor(employee: Employee, payments: SalaryPayment[]): SalaryHistoryRow[] {
  const month = todayKey().slice(0, 7);
  const rows: SalaryHistoryRow[] = payments
    .filter((payment) => payment.employeeId === employee.id)
    .map((payment) => ({
      id: payment.id,
      month: payment.month,
      amount: payment.amount,
      paidOn: payment.paidOn,
      method: payment.method,
      status: "paid",
    }));
  if (!rows.some((row) => row.month === month)) {
    rows.push({
      id: "pending",
      month,
      amount: employee.monthlySalary,
      status: "pending",
    });
  }
  return rows.sort((a, b) => b.month.localeCompare(a.month));
}

export function EmployeeDetail({
  employee,
  payments,
  onOpenChange,
  onPay,
}: {
  employee: Employee | null;
  payments: SalaryPayment[];
  onOpenChange: (open: boolean) => void;
  onPay: () => void;
}) {
  const month = todayKey().slice(0, 7);
  const paidThisMonth = employee
    ? payments.some((payment) => payment.employeeId === employee.id && payment.month === month)
    : false;
  const canPay = employee !== null && employee.status !== "inactive" && !paidThisMonth;
  const rows = employee ? historyFor(employee, payments) : [];

  return (
    <Sheet open={employee !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {employee ? (
          <>
            <SheetHeader>
              <SheetTitle>{employee.name}</SheetTitle>
              <SheetDescription>{employee.role}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={employee.role} />
                <Badge variant={employee.status === "inactive" ? "secondary" : "outline"}>
                  {employee.status === "inactive" ? "Inactive" : "Active"}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{employee.phone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{employee.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Monthly salary</dt>
                  <dd>{formatPKR(employee.monthlySalary)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Joined</dt>
                  <dd>{formatDisplayDate(employee.joinDate)}</dd>
                </div>
              </dl>
              {canPay ? (
                <Button type="button" onClick={onPay}>
                  Pay Salary
                </Button>
              ) : null}
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date paid</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatMonth(row.month)}</TableCell>
                        <TableCell>{formatPKR(row.amount)}</TableCell>
                        <TableCell>{row.paidOn ? formatDisplayDate(row.paidOn) : "—"}</TableCell>
                        <TableCell>{row.method ? formatPaymentMethod(row.method) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === "paid" ? "secondary" : "outline"}>
                            {row.status === "paid" ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
