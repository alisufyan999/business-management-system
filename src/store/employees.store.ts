import { create } from "zustand";
import { persist } from "zustand/middleware";
import { employees, salaryPayments } from "@/lib/mock-data";
import type { Employee, SalaryPayment } from "@/lib/types";
import { browserStorage } from "@/store/storage";

interface EmployeesState {
  employees: Employee[];
  salaryPayments: SalaryPayment[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  addSalaryPayment: (payment: SalaryPayment) => void;
  updateSalaryPayment: (id: string, patch: Partial<SalaryPayment>) => void;
  removeSalaryPayment: (id: string) => void;
}

export const useEmployeesStore = create<EmployeesState>()(
  persist(
    (set) => ({
      employees,
      salaryPayments,
      addEmployee: (employee) =>
        set((state) => ({ employees: [employee, ...state.employees] })),
      updateEmployee: (id, patch) =>
        set((state) => ({
          employees: state.employees.map((employee) =>
            employee.id === id ? { ...employee, ...patch } : employee,
          ),
        })),
      removeEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((employee) => employee.id !== id),
          salaryPayments: state.salaryPayments.filter(
            (payment) => payment.employeeId !== id,
          ),
        })),
      addSalaryPayment: (payment) =>
        set((state) => ({
          salaryPayments: [payment, ...state.salaryPayments],
        })),
      updateSalaryPayment: (id, patch) =>
        set((state) => ({
          salaryPayments: state.salaryPayments.map((payment) =>
            payment.id === id ? { ...payment, ...patch } : payment,
          ),
        })),
      removeSalaryPayment: (id) =>
        set((state) => ({
          salaryPayments: state.salaryPayments.filter(
            (payment) => payment.id !== id,
          ),
        })),
    }),
    {
      name: "evernew-employees",
      storage: browserStorage(),
      partialize: (state) => ({
        employees: state.employees,
        salaryPayments: state.salaryPayments,
      }),
    },
  ),
);
