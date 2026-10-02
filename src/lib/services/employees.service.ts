import { apiCall, createId, notFound } from "@/lib/services/api";
import type { Employee, SalaryPayment, SupplierPaymentMethod } from "@/lib/types";
import { useEmployeesStore } from "@/store/employees.store";
import { useExpensesStore } from "@/store/expenses.store";
import { waitForHydration } from "@/store/hydrate";

export function getAll(): Promise<Employee[]> {
  // TODO: replace with real API call
  return apiCall(useEmployeesStore, () => useEmployeesStore.getState().employees);
}

export function getById(id: string): Promise<Employee | null> {
  // TODO: replace with real API call
  return apiCall(
    useEmployeesStore,
    () => useEmployeesStore.getState().employees.find((employee) => employee.id === id) ?? null,
  );
}

export function create(input: Omit<Employee, "id">): Promise<Employee> {
  // TODO: replace with real API call
  return apiCall(useEmployeesStore, () => {
    const employee: Employee = { ...input, id: createId("emp") };
    useEmployeesStore.getState().addEmployee(employee);
    return employee;
  });
}

export function update(id: string, patch: Partial<Omit<Employee, "id">>): Promise<Employee> {
  // TODO: replace with real API call
  return apiCall(useEmployeesStore, () => {
    const current = useEmployeesStore.getState().employees.find((employee) => employee.id === id);
    if (!current) throw notFound("Employee", id);
    useEmployeesStore.getState().updateEmployee(id, patch);
    return { ...current, ...patch };
  });
}

export async function removeEmployee(id: string): Promise<void> {
  // TODO: replace with real API call
  await waitForHydration(useExpensesStore);

  return apiCall(useEmployeesStore, () => {
    const current = useEmployeesStore.getState().employees.find((employee) => employee.id === id);
    if (!current) throw notFound("Employee", id);
    const salaryIds = new Set(
      useEmployeesStore
        .getState()
        .salaryPayments.filter((payment) => payment.employeeId === id)
        .map((payment) => payment.id),
    );
    useEmployeesStore.getState().removeEmployee(id);
    for (const expense of useExpensesStore.getState().items) {
      if (expense.salaryPaymentId && salaryIds.has(expense.salaryPaymentId)) {
        useExpensesStore.getState().remove(expense.id);
      }
    }
  });
}

export { removeEmployee as delete };

export function getSalaryPayments(): Promise<SalaryPayment[]> {
  // TODO: replace with real API call
  return apiCall(useEmployeesStore, () => useEmployeesStore.getState().salaryPayments);
}

export interface PaySalaryInput {
  employeeId: string;
  month: string;
  amount: number;
  date: string;
  method: SupplierPaymentMethod;
  notes?: string;
}

export async function paySalary(input: PaySalaryInput): Promise<SalaryPayment> {
  // TODO: replace with real API call
  await waitForHydration(useExpensesStore);

  return apiCall(useEmployeesStore, () => {
    const employee = useEmployeesStore.getState().employees.find((item) => item.id === input.employeeId);
    if (!employee) throw notFound("Employee", input.employeeId);
    if (employee.status === "inactive") throw new Error("Inactive employees cannot be paid.");

    const amount = Math.round(input.amount);
    if (amount <= 0) throw new Error("Amount must be greater than 0.");

    const duplicate = useEmployeesStore
      .getState()
      .salaryPayments.some((payment) => payment.employeeId === employee.id && payment.month === input.month);
    if (duplicate) throw new Error("Salary for this month is already paid.");

    const notes = input.notes?.trim();
    const payment: SalaryPayment = {
      id: createId("slr"),
      employeeId: employee.id,
      employeeName: employee.name,
      month: input.month,
      amount,
      paidOn: input.date,
      method: input.method,
      notes: notes ? notes : undefined,
    };
    useEmployeesStore.getState().addSalaryPayment(payment);
    useExpensesStore.getState().add({
      id: createId("exp"),
      date: input.date,
      category: "salary",
      description: `Salary — ${employee.name} (${input.month})`,
      amount,
      paymentMethod: input.method,
      salaryPaymentId: payment.id,
    });
    return payment;
  });
}
