/**
 * Data Cache — persists Dataflows + Fabric data across route navigations
 */

import { DataSummary } from '@/services/azure/dataService';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const cache: { data: DataSummary | null; lastFetched: number | null } = {
    data: null,
    lastFetched: null,
};

export function getCachedDataSummary(): DataSummary | null {
    if (!cache.data || !cache.lastFetched) return null;
    if (Date.now() - cache.lastFetched > CACHE_TTL) {
        cache.data = null;
        cache.lastFetched = null;
        return null;
    }
    return cache.data;
}

export function setCachedDataSummary(data: DataSummary): void {
    cache.data = data;
    cache.lastFetched = Date.now();
}

export function clearDataCache(): void {
    cache.data = null;
    cache.lastFetched = null;
}
