/**
 * Billing Data Cache Store
 * Persists billing data across route navigations to avoid re-fetching expensive Azure Cost API
 */

import { BillingData } from '@/services/azure/costService';

interface BillingCacheState {
    data: BillingData | null;
    lastFetched: number | null; // timestamp
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Simple module-level cache (survives route navigations, clears on page reload)
const cache: BillingCacheState = {
    data: null,
    lastFetched: null,
};

export function getCachedBillingData(): BillingData | null {
    if (!cache.data || !cache.lastFetched) return null;
    const age = Date.now() - cache.lastFetched;
    if (age > CACHE_TTL) {
        cache.data = null;
        cache.lastFetched = null;
        return null;
    }
    return cache.data;
}

export function setCachedBillingData(data: BillingData): void {
    cache.data = data;
    cache.lastFetched = Date.now();
}

export function clearBillingCache(): void {
    cache.data = null;
    cache.lastFetched = null;
}
