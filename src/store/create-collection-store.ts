import { create } from "zustand";
import { persist } from "zustand/middleware";
import { browserStorage } from "@/store/storage";

export interface CollectionState<T extends { id: string }> {
  items: T[];
  add: (item: T) => void;
  update: (id: string, patch: Partial<T>) => void;
  remove: (id: string) => void;
}

export function createCollectionStore<T extends { id: string }>(
  key: string,
  seed: T[],
) {
  return create<CollectionState<T>>()(
    persist(
      (set) => ({
        items: seed,
        add: (item) => set((state) => ({ items: [item, ...state.items] })),
        update: (id, patch) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          })),
        remove: (id) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          })),
      }),
      {
        name: `evernew-${key}`,
        storage: browserStorage(),
        partialize: (state) => ({ items: state.items }),
      },
    ),
  );
}
