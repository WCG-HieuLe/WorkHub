/**
 * License Data Cache Store
 * Persists license data across route navigations to avoid re-fetching MS Graph API
 */

import { LicenseSummary } from '@/services/azure/licenseService';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const cache: { data: LicenseSummary | null; lastFetched: number | null } = {
    data: null,
    lastFetched: null,
};

export function getCachedLicenseData(): LicenseSummary | null {
    if (!cache.data || !cache.lastFetched) return null;
    if (Date.now() - cache.lastFetched > CACHE_TTL) {
        cache.data = null;
        cache.lastFetched = null;
        return null;
    }
    return cache.data;
}

export function setCachedLicenseData(data: LicenseSummary): void {
    cache.data = data;
    cache.lastFetched = Date.now();
}

export function clearLicenseCache(): void {
    cache.data = null;
    cache.lastFetched = null;
}
