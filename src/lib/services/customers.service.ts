import { createCrudService } from "@/lib/services/crud";
import { useCustomersStore } from "@/store/customers.store";

const api = createCrudService(useCustomersStore, "Customer", "cus");

export const getAll = api.getAll;
export const getById = api.getById;
export const create = api.create;
export const update = api.update;
export const { delete: removeCustomer } = api;
export { removeCustomer as delete };
