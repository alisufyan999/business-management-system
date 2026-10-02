import { createCrudService } from "@/lib/services/crud";
import { useExpensesStore } from "@/store/expenses.store";

const api = createCrudService(useExpensesStore, "Expense", "exp");

export const getAll = api.getAll;
export const getById = api.getById;
export const create = api.create;
export const update = api.update;
export const { delete: removeExpense } = api;
export { removeExpense as delete };
