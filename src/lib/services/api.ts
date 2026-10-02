import { delay } from "@/lib/delay";
import { ensureDemoDay } from "@/store/reseed";
import { waitForHydration, type HydratableStore } from "@/store/hydrate";

export async function apiCall<T>(store: HydratableStore, work: () => T): Promise<T> {
  // TODO: replace with real API call
  await ensureDemoDay();
  await waitForHydration(store);
  await delay();
  return work();
}

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function notFound(entity: string, id: string): Error {
  return new Error(`${entity} ${id} was not found`);
}
