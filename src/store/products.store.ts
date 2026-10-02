import { products } from "@/lib/mock-data";
import { createCollectionStore } from "@/store/create-collection-store";

export const useProductsStore = createCollectionStore("products", products);
