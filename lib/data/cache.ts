const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

/** Round from/to to day boundary so warmup offset doesn't bust the cache */
export function makeCacheKey(
  symbol: string,
  timeframe: string,
  fromMs: number,
  toMs: number,
): string {
  const fromDay = Math.floor(fromMs / 86_400_000);
  const toDay = Math.floor(toMs / 86_400_000);
  return `${symbol}:${timeframe}:${fromDay}:${toDay}`;
}
