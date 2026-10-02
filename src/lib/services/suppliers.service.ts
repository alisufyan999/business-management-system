import { createCrudService } from "@/lib/services/crud";
import { useSuppliersStore } from "@/store/suppliers.store";

const api = createCrudService(useSuppliersStore, "Supplier", "sup");

export const getAll = api.getAll;
export const getById = api.getById;
export const create = api.create;
export const update = api.update;
export const { delete: removeSupplier } = api;
export { removeSupplier as delete };
