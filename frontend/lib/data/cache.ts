type CacheEntry<T> = {
  data: T
  updatedAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string, maxAgeMs: number): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (Date.now() - entry.updatedAt > maxAgeMs) return undefined
  return entry.data
}

export function setCached<T>(key: string, data: T) {
  cache.set(key, { data, updatedAt: Date.now() })
}

export function invalidate(keyPrefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) cache.delete(key)
  }
}

