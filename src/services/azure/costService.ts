/**
 * Azure Cost Management API Service
 * Fetches billing data: current spend, forecast, top resources
 */

import { azureManagementConfig } from "@/config/authConfig";

/**
 * Fetch with retry for 429 rate limiting
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    for (let attempt = 0; attempt < retries; attempt++) {
        const response = await fetch(url, options);
        if (response.status === 429 && attempt < retries - 1) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
            const waitMs = Math.max(retryAfter * 1000, 3000);
            console.warn(`Azure Cost API 429 — waiting ${waitMs}ms before retry ${attempt + 2}/${retries}`);
            await new Promise(resolve => setTimeout(resolve, waitMs));
            continue;
        }
        return response;
    }
    return fetch(url, options); // fallback
}

// Azure Subscription ID
const SUBSCRIPTION_ID = "b230aef2-52a0-4800-8a8d-91a6880c86a2";

interface CostRow {
    cost: number;
    date: string;
    currency: string;
}

interface TopResource {
    name: string;
    resourceType: string;
    cost: number;
    currency: string;
}

interface CostForecast {
    totalCost: number;
    forecastCost: number;
    currency: string;
}

export interface BillingData {
    currentMonthCost: number;
    dailyCosts: CostRow[];
    topResources: TopResource[];
    forecast: CostForecast | null;
    currency: string;
    lastUpdated: string;
}

/**
 * Fetch current month cost (aggregated daily)
 */
export async function fetchCurrentMonthCost(accessToken: string): Promise<{ total: number; daily: CostRow[]; currency: string }> {
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const url = `${azureManagementConfig.baseUrl}/subscriptions/${SUBSCRIPTION_ID}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;

    const body = {
        type: "ActualCost",
        timeframe: "Custom",
        timePeriod: { from: firstDay, to: today },
        dataset: {
            granularity: "Daily",
            aggregation: {
                totalCost: { name: "Cost", function: "Sum" },
            },
            grouping: [],
        },
    };

    const response = await fetchWithRetry(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Azure Cost API error:", response.status, errorText);
        throw new Error(`Azure Cost API (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const rows: CostRow[] = (data.properties?.rows || []).map((row: [number, number, string]) => ({
        cost: row[0],
        date: String(row[1]),
        currency: row[2],
    }));

    const total = rows.reduce((sum, r) => sum + r.cost, 0);
    const currency = rows[0]?.currency || "USD";

    return { total, daily: rows, currency };
}

/**
 * Fetch top N most expensive resources this month
 */
export async function fetchTopResources(accessToken: string, top = 10): Promise<TopResource[]> {
    const url = `${azureManagementConfig.baseUrl}/subscriptions/${SUBSCRIPTION_ID}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;

    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const body = {
        type: "ActualCost",
        timeframe: "Custom",
        timePeriod: { from: firstDay, to: today },
        dataset: {
            granularity: "None",
            aggregation: {
                totalCost: { name: "Cost", function: "Sum" },
            },
            grouping: [
                { type: "Dimension", name: "ResourceId" },
                { type: "Dimension", name: "ResourceType" },
            ],
        },
    };

    const response = await fetchWithRetry(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Azure Cost API (${response.status})`);
    }

    const data = await response.json();
    const rows: TopResource[] = (data.properties?.rows || [])
        .map((row: [number, string, string, string]) => ({
            cost: row[0],
            name: row[1]?.split("/").pop() || row[1] || "Unknown",
            resourceType: row[2]?.split("/").pop() || row[2] || "Unknown",
            currency: row[3],
        }))
        .sort((a: TopResource, b: TopResource) => b.cost - a.cost)
        .slice(0, top);

    return rows;
}

/**
 * Fetch cost forecast for end of current month
 */
export async function fetchCostForecast(accessToken: string): Promise<CostForecast | null> {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    const url = `${azureManagementConfig.baseUrl}/subscriptions/${SUBSCRIPTION_ID}/providers/Microsoft.CostManagement/forecast?api-version=2023-11-01`;

    const body = {
        type: "ActualCost",
        timeframe: "Custom",
        timePeriod: { from: today, to: lastDayStr },
        dataset: {
            granularity: "Daily",
            aggregation: {
                totalCost: { name: "Cost", function: "Sum" },
            },
        },
    };

    try {
        const response = await fetchWithRetry(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const rows = data.properties?.rows || [];
        const forecastCost = rows.reduce((sum: number, row: [number]) => sum + row[0], 0);

        return {
            totalCost: 0, // Will be summed with current
            forecastCost,
            currency: rows[0]?.[2] || "USD",
        };
    } catch {
        return null;
    }
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch all billing data — sequential to avoid 429 rate limiting
 */
export async function fetchBillingData(accessToken: string): Promise<BillingData> {
    // Sequential calls with delay to avoid Azure Cost API 429
    const costData = await fetchCurrentMonthCost(accessToken);
    await delay(1500);

    const resources = await fetchTopResources(accessToken);
    await delay(1500);

    const forecast = await fetchCostForecast(accessToken);

    return {
        currentMonthCost: costData.total,
        dailyCosts: costData.daily,
        topResources: resources,
        forecast: forecast ? { ...forecast, totalCost: costData.total } : null,
        currency: costData.currency,
        lastUpdated: new Date().toISOString(),
    };
}
