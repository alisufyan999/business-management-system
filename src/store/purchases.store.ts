import { purchases } from "@/lib/mock-data";
import { createCollectionStore } from "@/store/create-collection-store";

export const usePurchasesStore = createCollectionStore("purchases", purchases);
