import { apiCall, createId, notFound } from "@/lib/services/api";
import type { CollectionState } from "@/store/create-collection-store";
import type { HydratableStore } from "@/store/hydrate";

interface CollectionStore<T extends { id: string }> extends HydratableStore {
  getState: () => CollectionState<T>;
}

export function createCrudService<T extends { id: string }>(
  store: CollectionStore<T>,
  entity: string,
  prefix: string,
) {
  return {
    getAll(): Promise<T[]> {
      // TODO: replace with real API call
      return apiCall(store, () => store.getState().items);
    },
    getById(id: string): Promise<T | null> {
      // TODO: replace with real API call
      return apiCall(
        store,
        () => store.getState().items.find((item) => item.id === id) ?? null,
      );
    },
    create(input: Omit<T, "id">): Promise<T> {
      // TODO: replace with real API call
      return apiCall(store, () => {
        const item = { ...input, id: createId(prefix) } as T;
        store.getState().add(item);
        return item;
      });
    },
    update(id: string, patch: Partial<Omit<T, "id">>): Promise<T> {
      // TODO: replace with real API call
      return apiCall(store, () => {
        const current = store.getState().items.find((item) => item.id === id);
        if (!current) throw notFound(entity, id);
        store.getState().update(id, patch as Partial<T>);
        return { ...current, ...patch };
      });
    },
    delete(id: string): Promise<void> {
      // TODO: replace with real API call
      return apiCall(store, () => {
        const current = store.getState().items.find((item) => item.id === id);
        if (!current) throw notFound(entity, id);
        store.getState().remove(id);
      });
    },
  };
}
