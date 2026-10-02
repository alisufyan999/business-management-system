import { createCrudService } from "@/lib/services/crud";
import { usePaymentsStore } from "@/store/payments.store";

const api = createCrudService(usePaymentsStore, "Payment", "pay");

export const getAll = api.getAll;
export const getById = api.getById;
export const create = api.create;
export const update = api.update;
export const { delete: removePayment } = api;
export { removePayment as delete };
