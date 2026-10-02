import { suppliers } from "@/lib/mock-data";
import { createCollectionStore } from "@/store/create-collection-store";

export const useSuppliersStore = createCollectionStore("suppliers", suppliers);
