import { creditLedger } from "@/lib/mock-data";
import { createCollectionStore } from "@/store/create-collection-store";

export const useCreditStore = createCollectionStore("credit", creditLedger);
