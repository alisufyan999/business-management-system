"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/catalog/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employeeSchema, type EmployeeFormValues } from "@/lib/schemas/employee";
import * as employeesService from "@/lib/services/employees.service";
import type { Employee, EmployeeRole, EmployeeStatus } from "@/lib/types";

const roles: EmployeeRole[] = ["Manager", "Accountant", "Sales Staff", "Technician"];

export function EmployeeForm({
  employee,
  onCancel,
  onSaved,
}: {
  employee?: Employee | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    mode: "onChange",
    defaultValues: {
      name: employee?.name ?? "",
      role: employee?.role ?? "Sales Staff",
      phone: employee?.phone ?? "",
      email: employee?.email ?? "",
      monthlySalary: employee?.monthlySalary ?? 0,
      joinDate: employee?.joinDate ?? "",
      status: employee?.status ?? "active",
    },
  });
  const role = useWatch({ control: form.control, name: "role" });
  const status = useWatch({ control: form.control, name: "status" });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: EmployeeFormValues) {
    const email = values.email.trim();
    const payload = {
      name: values.name,
      role: values.role,
      phone: values.phone,
      monthlySalary: Math.round(values.monthlySalary),
      joinDate: values.joinDate,
      status: values.status,
      ...(email ? { email } : { email: undefined }),
    };
    try {
      if (employee) {
        await employeesService.update(employee.id, payload);
        toast.success("Employee updated");
      } else {
        await employeesService.create(payload);
        toast.success("Employee added");
      }
      onSaved();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the employee.");
    }
  }

  const errors = form.formState.errors;

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="employee-name">Name</Label>
          <Input id="employee-name" {...form.register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(value) =>
              form.setValue("role", (value ?? "Sales Staff") as EmployeeRole, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.role?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              form.setValue("status", (value ?? "active") as EmployeeStatus, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={errors.status?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="employee-phone">Phone</Label>
          <Input id="employee-phone" {...form.register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="employee-email">Email</Label>
          <Input id="employee-email" type="email" {...form.register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="employee-salary">Monthly salary (Rs.)</Label>
          <Input
            id="employee-salary"
            type="number"
            min={1}
            {...form.register("monthlySalary", { valueAsNumber: true })}
          />
          <FieldError message={errors.monthlySalary?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="employee-join">Join date</Label>
          <Input id="employee-join" type="date" {...form.register("joinDate")} />
          <FieldError message={errors.joinDate?.message} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : employee ? "Save changes" : "Add employee"}
        </Button>
      </div>
    </form>
  );
}
