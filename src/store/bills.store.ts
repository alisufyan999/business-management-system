import { createCollectionStore } from "@/store/create-collection-store";
import type { Bill } from "@/lib/types";

export const useBillsStore = createCollectionStore<Bill>("bills", []);
