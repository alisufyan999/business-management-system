import { sales } from "@/lib/mock-data";
import { createCollectionStore } from "@/store/create-collection-store";

export const useSalesStore = createCollectionStore("sales", sales);
