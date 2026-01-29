/**
 * Warehouse services - Inventory, Transactions, etc.
 * Note: This is a large service file. Consider further splitting if it grows.
 */

import { dataverseConfig } from '../../config/authConfig';
import { createFetchHeadersWithAnnotations } from './common';
import { cache } from '../../utils/cacheUtils';
import { measureApiCall } from '../../utils/performanceUtils';
import {
    TransactionSales,
    TransactionSalesPaginatedResponse,
    TransactionBuy,
    TransactionBuyPaginatedResponse,
    InventoryCheckItem,
    InventoryCheckPaginatedResponse,
    WarehouseLocationOption,
    InventoryProduct,
    InventoryProductsPaginatedResponse
} from './types';
import { escapeODataString } from './common';

// ============================================================================
// TRANSACTION SERVICES
// ============================================================================

/**
 * Fetch Transaction Sales
 */
export async function fetchTransactionSales(
    accessToken: string,
    page: number = 1,
    pageSize: number = 50,
    searchText?: string
): Promise<TransactionSalesPaginatedResponse> {
    const skip = (page - 1) * pageSize;
    const columns = [
        "crdfd_transactionsalesid",
        "crdfd_maphieuxuat",
        "_crdfd_idchitietonhang_value",
        "crdfd_tensanphamtex",
        "crdfd_soluonggiaotheokho",
        "crdfd_onvitheokho",
        "crdfd_ngaygiaothucte",
        "crdfd_warehouse",
        "crdfd_product",
        "crdfd_unit",
        "crdfd_purchasingemployee",
        "crdfd_urgentpurchasingemployee",
        "crdfd_stockbyuser",
        "crdfd_orderedstock",
        "crdfd_strangestock",
        "crdfd_warehousestrangestock",
        "crdfd_historyconfidence",
        "crdfd_confidencelevel"
    ];

    const select = columns.join(",");
    let filter = "statecode eq 0";

    if (searchText) {
        const escaped = escapeODataString(searchText);
        filter += ` and (contains(crdfd_tensanphamtex, '${escaped}') or contains(crdfd_maphieuxuat, '${escaped}'))`;
    }

    const query = `$filter=${encodeURIComponent(filter)}&$select=${select}&$top=${pageSize}&$count=true&$orderby=createdon desc`;
    const url = `${dataverseConfig.baseUrl}/crdfd_transactionsales?${query}`;

    try {
        const response = await fetch(url, {
            headers: createFetchHeadersWithAnnotations(accessToken),
        });

        if (!response.ok) {
            console.error("Error fetching Transaction Sales:", await response.text());
            return { data: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
        }

        const data = await response.json();
        const items = data.value || [];
        const totalCount = data['@odata.count'] || 0;

        const mappedItems: TransactionSales[] = items.map((item: TransactionSales & { [key: string]: unknown }) => ({
            ...item,
            crdfd_idchitietonhang_name: (item['_crdfd_idchitietonhang_value@OData.Community.Display.V1.FormattedValue'] as string),
        }));

        return {
            data: mappedItems,
            totalCount: totalCount,
            hasNextPage: (skip + pageSize) < totalCount,
            hasPreviousPage: page > 1
        };
    } catch (e) {
        console.error("Exception fetching Transaction Sales:", e);
        return { data: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
    }
}

/**
 * Fetch Transaction Buys
 */
export async function fetchTransactionBuys(
    accessToken: string,
    page: number = 1,
    pageSize: number = 50,
    searchText?: string
): Promise<TransactionBuyPaginatedResponse> {
    const skip = (page - 1) * pageSize;
    const columns = [
        "crdfd_transactionbuyid",
        "crdfd_name",
        "crdfd_masp",
        "crdfd_tensanpham",
        "crdfd_soluong",
        "createdon"
    ];

    const select = columns.join(",");
    let filter = "statecode eq 0";

    if (searchText) {
        const escaped = escapeODataString(searchText);
        filter += ` and (contains(crdfd_tensanpham, '${escaped}') or contains(crdfd_masp, '${escaped}'))`;
    }

    const query = `$filter=${encodeURIComponent(filter)}&$select=${select}&$top=${pageSize}&$count=true&$orderby=createdon desc`;
    const url = `${dataverseConfig.baseUrl}/crdfd_transactionbuys?${query}`;

    try {
        const response = await fetch(url, {
            headers: createFetchHeadersWithAnnotations(accessToken),
        });

        if (!response.ok) {
            console.error("Error fetching Transaction Buys:", await response.text());
            return { data: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
        }

        const data = await response.json();
        const items = data.value || [];
        const totalCount = data['@odata.count'] || 0;

        const mappedItems: TransactionBuy[] = items.map((item: TransactionBuy) => ({
            ...item,
        }));

        return {
            data: mappedItems,
            totalCount: totalCount,
            hasNextPage: (skip + pageSize) < totalCount,
            hasPreviousPage: page > 1
        };
    } catch (e) {
        console.error("Exception fetching Transaction Buys:", e);
        return { data: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
    }
}

/**
 * Fetch warehouse locations for filter dropdown
 */
export async function fetchWarehouseLocationsForFilter(
    accessToken: string
): Promise<WarehouseLocationOption[]> {
    const cacheKey = 'warehouse_locations';
    const cached = cache.get<WarehouseLocationOption[]>(cacheKey);

    if (cached) {
        return cached;
    }

    // OPTIMIZED: Reduced from 2000 to 1000 for better performance
    const url = `${dataverseConfig.baseUrl}/crdfd_kho_binh_dinhs?$select=_crdfd_vitrikho_value&$top=1000&$filter=statecode eq 0`;

    try {
        const locations = await measureApiCall('fetchWarehouseLocations', async () => {
            const response = await fetch(url, {
                headers: createFetchHeadersWithAnnotations(accessToken),
            });

            if (!response.ok) {
                console.error("Error fetching warehouse locations:", await response.text());
                return [];
            }

            const data = await response.json();
            const items = data.value || [];
            const locationMap = new Map<string, string>();

            items.forEach((item: { _crdfd_vitrikho_value?: string;[key: string]: unknown }) => {
                const id = item._crdfd_vitrikho_value;
                const name = (item['_crdfd_vitrikho_value@OData.Community.Display.V1.FormattedValue'] as string);

                if (id && name) {
                    locationMap.set(id, name);
                }
            });

            return Array.from(locationMap.entries()).map(([id, name]) => ({ id, name }));
        });

        cache.set(cacheKey, locations, 10 * 60 * 1000);
        return locations;
    } catch (e) {
        console.error("Exception fetching warehouse locations:", e);
        return [];
    }
}

/**
 * Fetch warehouse locations (alias for backward compatibility)
 */
export async function fetchWarehouseLocations(
    accessToken: string
): Promise<WarehouseLocationOption[]> {
    return fetchWarehouseLocationsForFilter(accessToken);
}

/**
 * Fetch Inventory Check data
 * OPTIMIZED: Reduced $top from 2000 to 500
 */
export async function fetchInventoryCheck(
    accessToken: string,
    _page: number = 1,
    _pageSize: number = 50,
    searchText?: string,
    warehouseLocationIds?: string[],
    stockFilter: 'all' | 'negative' | 'nonzero' = 'all'
): Promise<InventoryCheckPaginatedResponse> {
    const select = [
        "crdfd_kho_binh_dinhid",
        "_crdfd_vitrikho_value",
        "_crdfd_tensanphamlookup_value",
        "crdfd_tensptext",
        "crdfd_masp",
        "crdfd_onvi",
        "crdfd_tonkhothucte",
        "crdfd_tonkholythuyet",
        "cr1bb_tonkhadung",
        "cr1bb_slhangloisaukiem",
        "crdfd_ton_kho_theo_ke_hoach"
    ].join(",");

    let filter = "statecode eq 0";

    if (warehouseLocationIds && warehouseLocationIds.length > 0) {
        const locationFilters = warehouseLocationIds.map((id: string) => `_crdfd_vitrikho_value eq ${id}`);
        filter += ` and (${locationFilters.join(" or ")})`;
    }

    if (searchText) {
        const escapedSearch = escapeODataString(searchText);
        filter += ` and (contains(crdfd_masp, '${escapedSearch}') or contains(crdfd_tensptext, '${escapedSearch}'))`;
    }

    if (stockFilter === 'negative') {
        filter += ` and crdfd_tonkhothucte lt 0`;
    } else if (stockFilter === 'nonzero') {
        filter += ` and crdfd_tonkhothucte ne 0`;
    }

    // OPTIMIZED: Reduced from 2000 to 500
    const query = `$filter=${encodeURIComponent(filter)}&$select=${select}&$top=500&$count=true&$orderby=crdfd_masp asc`;
    const url = `${dataverseConfig.baseUrl}/crdfd_kho_binh_dinhs?${query}`;

    try {
        return await measureApiCall('fetchInventoryCheck', async () => {
            const response = await fetch(url, {
                headers: createFetchHeadersWithAnnotations(accessToken),
            });

            if (!response.ok) {
                console.error("Error fetching inventory check:", await response.text());
                return { data: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
            }

            const data = await response.json();
            const items = data.value || [];
            const totalCount = data['@odata.count'] || items.length;

            const mappedItems: InventoryCheckItem[] = items.map((item: InventoryCheckItem & { [key: string]: unknown }) => {
                const tonKhoThucTe = (item.crdfd_tonkhothucte as number) || 0;
                const hangLoiSauKiem = (item.cr1bb_slhangloisaukiem as number) || 0;

                const productName = (item['_crdfd_tensanphamlookup_value@OData.Community.Display.V1.FormattedValue'] as string)
                    || (item.crdfd_tensptext as string)
                    || (item.crdfd_masp as string)
                    || "Unknown";

                return {
                    crdfd_kho_binh_dinhid: item.crdfd_kho_binh_dinhid as string,
                    productName: productName,
                    productCode: (item.crdfd_masp as string) || "",
                    productId: (item._crdfd_tensanphamlookup_value as string) || "",
                    warehouseLocation: (item['_crdfd_vitrikho_value@OData.Community.Display.V1.FormattedValue'] as string) || "Unknown",
                    tonKhoThucTe: tonKhoThucTe,
                    tonKhoLyThuyet: (item.crdfd_tonkholythuyet as number) || 0,
                    tonKhaDung: (item.cr1bb_tonkhadung as number) || 0,
                    hangLoiSauKiem: hangLoiSauKiem,
                    tongTonKho: tonKhoThucTe + hangLoiSauKiem
                };
            });

            return {
                data: mappedItems,
                totalCount: totalCount,
                hasNextPage: false,
                hasPreviousPage: false
            };
        });
    } catch (e) {
        console.error("Exception fetching inventory check:", e);
        return { data: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
    }
}

/**
 * Fetch Inventory Products
 * OPTIMIZED: Reduced $top from 2000 to 100 for better performance
 */
export async function fetchInventoryProducts(
    accessToken: string,
    _page: number = 1,
    _pageSize: number = 50,
    searchText?: string,
    warehouseLocationIds?: string[],
    stockFilter: 'all' | 'negative' | 'nonzero' = 'all'
): Promise<InventoryProductsPaginatedResponse> {
    const select = [
        "crdfd_kho_binh_dinhid",
        "_crdfd_vitrikho_value",
        "_crdfd_tensanphamlookup_value",
        "crdfd_tensptext",
        "crdfd_masp",
        "crdfd_onvi",
        "crdfd_tonkhothucte",
        "crdfd_tonkholythuyet",
        "crdfd_ton_kho_theo_ke_hoach"
    ].join(",");

    let filter = "statecode eq 0";

    if (warehouseLocationIds && warehouseLocationIds.length > 0) {
        const locationFilters = warehouseLocationIds.map((id: string) => `_crdfd_vitrikho_value eq ${id}`);
        filter += ` and (${locationFilters.join(" or ")})`;
    }

    if (stockFilter === 'negative') {
        filter += ` and crdfd_tonkhothucte lt 0`;
    } else if (stockFilter === 'nonzero') {
        filter += ` and crdfd_tonkhothucte ne 0`;
    }

    if (searchText) {
        const escapedSearch = escapeODataString(searchText);
        filter += ` and (contains(crdfd_masp, '${escapedSearch}') or contains(crdfd_tensptext, '${escapedSearch}'))`;
    }

    // OPTIMIZED: Reduced from 2000 to 100
    const query = `$filter=${encodeURIComponent(filter)}&$select=${select}&$top=100&$count=true&$orderby=crdfd_masp asc`;
    const url = `${dataverseConfig.baseUrl}/crdfd_kho_binh_dinhs?${query}`;

    try {
        const response = await fetch(url, {
            headers: createFetchHeadersWithAnnotations(accessToken),
        });

        if (!response.ok) {
            console.error("Error fetching inventory products:", await response.text());
            return { data: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
        }

        const data = await response.json();
        const items = data.value || [];
        const totalCount = data['@odata.count'] || items.length;

        const mappedItems: InventoryProduct[] = items.map((item: InventoryProduct & { [key: string]: unknown }) => ({
            crdfd_kho_binh_dinhid: item.crdfd_kho_binh_dinhid as string,
            productName: (item['_crdfd_tensanphamlookup_value@OData.Community.Display.V1.FormattedValue'] as string)
                || (item.crdfd_tensptext as string)
                || (item.crdfd_masp as string)
                || "Unknown",
            productCode: (item.crdfd_masp as string) || "",
            crdfd_masp: item.crdfd_masp as string,
            crdfd_onvi: item.crdfd_onvi as string,
            locationName: (item['_crdfd_vitrikho_value@OData.Community.Display.V1.FormattedValue'] as string) || "Unknown",
            warehouseLocation: (item['_crdfd_vitrikho_value@OData.Community.Display.V1.FormattedValue'] as string) || "Unknown",
            currentStock: (item.crdfd_tonkhothucte as number) || 0,
            crdfd_tonkhothucte: (item.crdfd_tonkhothucte as number) || 0,
            crdfd_tonkholythuyet: (item.crdfd_tonkholythuyet as number) || 0,
            crdfd_ton_kho_theo_ke_hoach: (item.crdfd_ton_kho_theo_ke_hoach as number) || 0
        }));

        return {
            data: mappedItems,
            totalCount: totalCount,
            hasNextPage: false,
            hasPreviousPage: false
        };
    } catch (e) {
        console.error("Exception fetching inventory products:", e);
        return { data: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
    }
}



