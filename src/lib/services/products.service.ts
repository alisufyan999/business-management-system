import { createCrudService } from "@/lib/services/crud";
import { useProductsStore } from "@/store/products.store";

const api = createCrudService(useProductsStore, "Product", "prd");

export const getAll = api.getAll;
export const getById = api.getById;
export const create = api.create;
export const update = api.update;
export const { delete: removeProduct } = api;
export { removeProduct as delete };
