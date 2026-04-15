/**
 * Canvas App Service — Power Apps Management Admin API
 * Fetches all canvas apps from Production environment
 */

import { powerAppsConfig, PP_ENV_ID } from "@/config/authConfig";

// ── Types ──

// ── Types ──

export interface CanvasAppOwner {
    displayName: string;
    email: string;
    id: string;
    type: string;
}

export interface CanvasAppUser {
    displayName: string;
    email: string;
    id: string;
}

export interface CanvasApp {
    id: string;
    displayName: string;
    appType: string;
    createdTime: string;
    lastModifiedTime: string;
    status: string;
    owner: CanvasAppOwner;
    createdBy: CanvasAppUser;
    lastModifiedBy: CanvasAppUser;
    description: string;
    appOpenUri: string;
    appPlayUri: string;
    sharedUsersCount: number;
    sharedGroupsCount: number;
}

// ── Helper: parse user-like object from API ──

function parseUser(raw: unknown): CanvasAppUser {
    const obj = (raw || {}) as Record<string, unknown>;
    return {
        displayName: (obj.displayName as string) || '',
        email: (obj.email as string) || (obj.userPrincipalName as string) || '',
        id: (obj.id as string) || '',
    };
}

// ── Fetch Canvas Apps ──

export async function fetchCanvasApps(accessToken: string): Promise<CanvasApp[]> {
    const url = `${powerAppsConfig.baseUrl}/providers/Microsoft.PowerApps/scopes/admin/environments/${PP_ENV_ID}/apps?api-version=2016-11-01`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[CanvasAppService] Fetch failed:', response.status, errorText);
        throw new Error(`Power Apps API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[CanvasAppService] Canvas apps:', data.value?.length || 0, 'items');

    // Debug: log first app structure
    if (data.value?.[0]) {
        const sample = data.value[0].properties;
        console.log('[CanvasAppService] Sample owner:', JSON.stringify(sample?.owner));
        console.log('[CanvasAppService] Sample createdBy:', JSON.stringify(sample?.createdBy));
        console.log('[CanvasAppService] Sample keys:', Object.keys(sample || {}));
    }

    return (data.value || []).map((app: Record<string, unknown>) => {
        const props = app.properties as Record<string, unknown> || {};
        const ownerRaw = props.owner as Record<string, unknown> || {};

        return {
            id: app.name as string || '',
            displayName: props.displayName as string || '',
            appType: props.appType as string || '',
            createdTime: props.createdTime as string || '',
            lastModifiedTime: props.lastModifiedTime as string || '',
            status: props.lifeCycleId as string || 'Published',
            owner: {
                displayName: (ownerRaw.displayName as string) || '',
                email: (ownerRaw.email as string) || (ownerRaw.userPrincipalName as string) || '',
                id: (ownerRaw.id as string) || '',
                type: (ownerRaw.type as string) || '',
            },
            createdBy: parseUser(props.createdBy),
            lastModifiedBy: parseUser(props.lastModifiedBy),
            description: props.description as string || '',
            appOpenUri: props.appOpenUri as string || '',
            appPlayUri: props.appPlayUri as string || '',
            sharedUsersCount: (props.sharedUsersCount as number) || 0,
            sharedGroupsCount: (props.sharedGroupsCount as number) || 0,
        } as CanvasApp;
    });
}

// ── Delete Canvas App ──

export async function deleteCanvasApp(accessToken: string, appId: string): Promise<void> {
    const url = `${powerAppsConfig.baseUrl}/providers/Microsoft.PowerApps/scopes/admin/environments/${PP_ENV_ID}/apps/${appId}?api-version=2016-11-01`;

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        },
    });

    if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        console.error('[CanvasAppService] Delete failed:', response.status, errorText);
        throw new Error(`Delete app failed: ${response.status} — ${errorText}`);
    }

    console.log('[CanvasAppService] Deleted app:', appId);
}
