export interface VendorCost {
    id: string;
    name: string;
    totalCost: number;
    trendPercent: number;
    currency: string;
}

export interface DailyCost {
    date: string;
    cost: number;
}

export interface ServiceCost {
    serviceName: string;
    cost: number;
}

export interface ResourceCost {
    name: string;
    type: string;
    cost: number;
}

export interface BillingDashboardData {
    vendors: VendorCost[];
    dailyTrend: DailyCost[];
    azureServices: ServiceCost[];
    topResources: ResourceCost[];
    total30dVelocity: number;
    forecast: number;
    currency: string;
    lastUpdated: string;
    m365Breakdown: {name: string, cost: number, color: string}[];
}

const BILLING_DATA_URL = 'https://wecare-i.github.io/-R-D---Billing-Management/data.json';

/**
 * Fetch pre-compiled, static JSON from Billing Management's scheduled workflow.
 */
export async function fetchBillingDashboardData(): Promise<BillingDashboardData> {
    try {
        const response = await fetch(`${BILLING_DATA_URL}?t=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();

        // Ensure we handle missing fields gracefully
        const azureTotal = data.forecastBreakdown?.azure || 0; 
        const googleTotal = data.google?.total || 0;
        const m365Total = data.m365?.total || 0;

        const vendors: VendorCost[] = [
            {
                id: 'azure',
                name: 'Azure Cloud',
                totalCost: azureTotal,
                trendPercent: 0, 
                currency: 'USD'
            },
            {
                id: 'gcp',
                name: 'Google Cloud & Workspace',
                totalCost: googleTotal,
                trendPercent: 0,
                currency: 'USD'
            },
            {
                id: 'm365',
                name: 'Microsoft 365',
                totalCost: m365Total,
                trendPercent: 0,
                currency: 'USD'
            }
        ];

        // Format daily trend
        const dailyTrend: DailyCost[] = ((data.daily as number[]) || []).map((val: number, idx: number) => ({
            date: `Day ${idx + 1}`,
            cost: val
        }));

        // Format azure services
        const azureServices: ServiceCost[] = (data.services || []).map((s: any) => ({
            serviceName: s.name,
            cost: s.total
        }));
        
        // Format top resources
        const topResources: ResourceCost[] = (data.resources || []).map((r: any) => ({
            name: r.n,
            type: r.t,
            cost: r.c
        }));

        const totalVelocity = (azureTotal + googleTotal + m365Total) / 30;

        return {
            vendors,
            dailyTrend,
            azureServices: azureServices.sort((a, b) => b.cost - a.cost),
            topResources: topResources.sort((a, b) => b.cost - a.cost),
            total30dVelocity: totalVelocity,
            forecast: data.forecast || ((azureTotal + googleTotal + m365Total) * 1.5),
            currency: 'USD',
            lastUpdated: data.buildTime || new Date().toISOString(),
            m365Breakdown: data.m365?.items || []
        };
    } catch (error) {
        console.error("Error fetching billing dashboard data:", error);
        throw error;
    }
}
