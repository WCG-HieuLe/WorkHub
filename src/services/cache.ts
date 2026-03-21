/**
 * Generic Memory Cache — 10 min TTL, used across Operations pages
 * Prevents re-fetching when navigating between sidebar items
 */

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CacheEntry<T> {
    data: T;
    fetchedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > CACHE_TTL) {
        store.delete(key);
        return null;
    }
    return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
    store.set(key, { data, fetchedAt: Date.now() });
}

export function clearCache(key: string): void {
    store.delete(key);
}

export function clearAllCache(): void {
    store.clear();
}
