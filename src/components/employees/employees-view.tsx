"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { EmployeeDetail } from "@/components/employees/employee-detail";
import { EmployeeForm } from "@/components/employees/employee-form";
import { RoleBadge } from "@/components/employees/role-badge";
import { SalaryPayForm } from "@/components/employees/salary-pay-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEntityList } from "@/hooks/use-entity-list";
import { formatDisplayDate, formatPKR } from "@/lib/format";
import { todayKey } from "@/lib/sale-fields";
import * as employeesService from "@/lib/services/employees.service";
import type { Employee, SalaryPayment } from "@/lib/types";

interface StaffData {
  employees: Employee[];
  payments: SalaryPayment[];
}

function isActive(employee: Employee): boolean {
  return employee.status !== "inactive";
}

export function EmployeesView() {
  const { data, error, loading, reload } = useEntityList<StaffData>(async () => {
    const [employees, payments] = await Promise.all([
      employeesService.getAll(),
      employeesService.getSalaryPayments(),
    ]);
    return { employees, payments };
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [paying, setPaying] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const employees = (data?.employees ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  const payments = data?.payments ?? [];
  const month = todayKey().slice(0, 7);
  const active = employees.filter(isActive);
  const commitment = active.reduce((sum, employee) => sum + employee.monthlySalary, 0);
  const paidThisMonth = payments
    .filter((payment) => payment.month === month)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingThisMonth = active
    .filter((employee) => !payments.some((payment) => payment.employeeId === employee.id && payment.month === month))
    .reduce((sum, employee) => sum + employee.monthlySalary, 0);
  const detail = employees.find((employee) => employee.id === detailId) ?? null;
  const deletingPayments = deleting
    ? payments.filter((payment) => payment.employeeId === deleting.id).length
    : 0;

  async function setStatus(employee: Employee, activeStatus: boolean) {
    try {
      await employeesService.update(employee.id, { status: activeStatus ? "active" : "inactive" });
      toast.success(activeStatus ? "Employee marked active" : "Employee marked inactive");
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not update status.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await employeesService.removeEmployee(deleting.id);
      toast.success("Employee deleted");
      if (detailId === deleting.id) setDetailId(null);
      setDeleting(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete the employee.");
    } finally {
      setDeletePending(false);
    }
  }

  async function markInactive() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await employeesService.update(deleting.id, { status: "inactive" });
      toast.success("Employee marked inactive");
      setDeleting(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not update status.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Employees"
        description="Staff records and monthly salary payments."
        action={
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add employee
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Active employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{active.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly salary commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(commitment)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Salaries this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(paidThisMonth)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pending {formatPKR(pendingThisMonth)}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? <LoadingRows /> : null}
      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {!loading && !error && employees.length === 0 ? (
        <EmptyState title="No employees" description="Add a staff member to start tracking salaries." />
      ) : null}

      {!loading && !error && employees.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Monthly salary</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="cursor-pointer" onClick={() => setDetailId(employee.id)}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    <RoleBadge role={employee.role} />
                  </TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell>{formatPKR(employee.monthlySalary)}</TableCell>
                  <TableCell>{formatDisplayDate(employee.joinDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                      <Switch
                        checked={isActive(employee)}
                        aria-label={`${isActive(employee) ? "Active" : "Inactive"} ${employee.name}`}
                        onCheckedChange={(checked) => {
                          void setStatus(employee, checked === true);
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {isActive(employee) ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${employee.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditing(employee);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${employee.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleting(employee);
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

      <EmployeeDetail
        employee={detail}
        payments={payments}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        onPay={() => {
          if (detail) setPaying(detail);
        }}
      />

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit employee" : "Add employee"}</DialogTitle>
            <DialogDescription>
              {editing ? editing.name : "Add a staff member and their monthly salary."}
            </DialogDescription>
          </DialogHeader>
          {formOpen ? (
            <EmployeeForm
              key={editing?.id ?? "new"}
              employee={editing}
              onCancel={() => {
                setFormOpen(false);
                setEditing(null);
              }}
              onSaved={() => {
                setFormOpen(false);
                setEditing(null);
                reload();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={paying !== null} onOpenChange={(open) => { if (!open) setPaying(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pay salary</DialogTitle>
            <DialogDescription>
              {paying ? `${paying.name} · ${formatPKR(paying.monthlySalary)} / month` : "Record a salary payment."}
            </DialogDescription>
          </DialogHeader>
          {paying ? (
            <SalaryPayForm
              key={paying.id}
              employee={paying}
              onCancel={() => setPaying(null)}
              onSaved={() => {
                setPaying(null);
                reload();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name ?? "employee"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingPayments > 0
                ? "This employee has salary payment history. Mark them inactive to keep that history, or delete them and remove the linked salary expenses."
                : "This removes the employee. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            {deletingPayments > 0 ? (
              <AlertDialogAction
                disabled={deletePending}
                onClick={(event) => {
                  event.preventDefault();
                  void markInactive();
                }}
              >
                Mark inactive
              </AlertDialogAction>
            ) : null}
            <AlertDialogAction
              variant="destructive"
              disabled={deletePending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deletePending ? "Working…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
