/**
 * Dataflow Service — Power Apps Admin API
 * Fetches dataflows from Production environment
 */

import { powerAppsConfig, PP_ENV_ID } from "@/config/authConfig";

// ── Types ──

// ── Types ──

export interface PADataflowOwner {
    displayName: string;
    email: string;
    id: string;
}

export interface PADataflow {
    id: string;
    name: string;
    description: string;
    owner: PADataflowOwner;
    createdTime: string;
    lastModifiedTime: string;
    status: string;
    configuredBy: string;
    environmentId: string;
}

// ── Helper ──

function parseOwner(raw: unknown): PADataflowOwner {
    const obj = (raw || {}) as Record<string, unknown>;
    return {
        displayName: (obj.displayName as string) || '',
        email: (obj.email as string) || (obj.userPrincipalName as string) || '',
        id: (obj.id as string) || '',
    };
}

// ── Fetch PA Dataflows ──

export async function fetchPADataflows(accessToken: string): Promise<PADataflow[]> {
    const url = `${powerAppsConfig.baseUrl}/providers/Microsoft.PowerApps/scopes/admin/environments/${PP_ENV_ID}/dataflows?api-version=2016-11-01`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[DataflowService] PA Dataflows fetch failed:', response.status, errorText);
        throw new Error(`Power Apps Dataflow API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[DataflowService] PA Dataflows:', data.value?.length || 0, 'items');

    // Debug: log first item structure
    if (data.value?.[0]) {
        const sample = data.value[0].properties;
        console.log('[DataflowService] Sample keys:', Object.keys(sample || {}));
    }

    return (data.value || []).map((item: Record<string, unknown>) => {
        const props = item.properties as Record<string, unknown> || {};
        const ownerRaw = props.owner || props.createdBy;

        return {
            id: item.name as string || item.id as string || '',
            name: props.displayName as string || props.name as string || '',
            description: props.description as string || '',
            owner: parseOwner(ownerRaw),
            createdTime: props.createdTime as string || '',
            lastModifiedTime: props.lastModifiedTime as string || '',
            status: props.status as string || props.lifeCycleId as string || 'Active',
            configuredBy: (props.configuredBy as string) || '',
            environmentId: PP_ENV_ID,
        } as PADataflow;
    });
}
