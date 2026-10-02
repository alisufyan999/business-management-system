import { payments } from "@/lib/mock-data";
import { createCollectionStore } from "@/store/create-collection-store";

export const usePaymentsStore = createCollectionStore("payments", payments);
