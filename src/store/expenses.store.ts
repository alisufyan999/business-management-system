import { expenses } from "@/lib/mock-data";
import { createCollectionStore } from "@/store/create-collection-store";

export const useExpensesStore = createCollectionStore("expenses", expenses);
