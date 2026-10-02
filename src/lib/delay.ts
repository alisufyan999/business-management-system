const MIN_DELAY_MS = 250;
const MAX_DELAY_MS = 400;

export function delay(ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
