import { useState, useMemo } from 'react';

export interface PaginationResult<T> {
    /** Current page items */
    items: T[];
    /** Current page (1-indexed) */
    page: number;
    /** Total pages */
    totalPages: number;
    /** Total items count */
    totalItems: number;
    /** Go to next page */
    next: () => void;
    /** Go to previous page */
    prev: () => void;
    /** Go to specific page */
    goTo: (page: number) => void;
    /** Has next page */
    hasNext: boolean;
    /** Has previous page */
    hasPrev: boolean;
}

/**
 * Client-side pagination hook
 * Use for data already in memory (< 200 items)
 */
export function usePagination<T>(allItems: T[], pageSize = 20): PaginationResult<T> {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    const safePage = Math.min(page, totalPages);

    const items = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return allItems.slice(start, start + pageSize);
    }, [allItems, safePage, pageSize]);

    return {
        items,
        page: safePage,
        totalPages,
        totalItems: allItems.length,
        next: () => setPage(p => Math.min(p + 1, totalPages)),
        prev: () => setPage(p => Math.max(p - 1, 1)),
        goTo: (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
    };
}
