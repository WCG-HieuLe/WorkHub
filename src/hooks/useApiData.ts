import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheGet, cacheSet, cacheClear } from '@/services/apiCache';

export interface UseApiDataOptions<T> {
    key: string; 
    fetcher: () => Promise<T>; 
    ttl?: number; 
    enabled?: boolean; 
    initialData?: T;
}

export function useApiData<T>(options: UseApiDataOptions<T>) {
    const { key, fetcher, ttl = 600000, enabled = true, initialData } = options;
    const cached = cacheGet<T>(key, ttl);
    const [data, setData] = useState<T>(cached ?? initialData as T);
    const [loading, setLoading] = useState(!cached);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isStale, setIsStale] = useState(!!cached);
    const m = useRef(true), f = useRef(!!cached);

    const doFetch = useCallback(async (force = false) => {
        if (!enabled) return;
        if (force) { 
            cacheClear(key); 
            setRefreshing(true); 
        }
        else if (f.current) return;
        else if (cacheGet(key, ttl)) { 
            setIsStale(true); 
            setRefreshing(true); 
        }
        else {
            setLoading(true);
        }

        try {
            const res = await fetcher();
            if (!m.current) return;
            setData(res); 
            cacheSet(key, res); 
            f.current = true; 
            setIsStale(false);
        } catch (err: any) {
            if (!m.current) return; 
            setError(err.message);
        } finally {
            if (m.current) { 
                setLoading(false); 
                setRefreshing(false); 
            }
        }
    }, [key, fetcher, ttl, enabled]);

    useEffect(() => { 
        m.current = true; 
        doFetch(); 
        return () => { m.current = false; }; 
    }, [doFetch]);
    
    return { data, loading, refreshing, error, refresh: () => doFetch(true), isStale, setData };
}
