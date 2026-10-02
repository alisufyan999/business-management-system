import { customers } from "@/lib/mock-data";
import { createCollectionStore } from "@/store/create-collection-store";

export const useCustomersStore = createCollectionStore("customers", customers);
