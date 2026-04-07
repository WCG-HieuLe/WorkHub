/**
 * Connection Service — Power Platform Admin API
 * Fetches all connections for the environment, including expired/error status
 */

import { powerAppsConfig, PP_ENV_ID } from '@/config/authConfig';

// ── Types ──

export interface ConnectionStatus {
    status: string;  // 'Connected' | 'Error' | etc
    error?: {
        code: string;
        message: string;
    };
}

export interface ConnectionOwner {
    displayName: string;
    email: string;
    id: string;
}

export interface ConnectionInfo {
    id: string;
    displayName: string;
    connectorName: string;
    connectorDisplayName: string;
    iconUri: string;
    statuses: ConnectionStatus[];
    overallStatus: 'Connected' | 'Error';
    createdBy: ConnectionOwner;
    createdTime: string;
    lastModifiedTime: string;
    environment: string;
}

// ── Helper: parse owner ──

function parseOwner(raw: unknown): ConnectionOwner {
    const obj = (raw || {}) as Record<string, unknown>;
    return {
        displayName: (obj.displayName as string) || '',
        email: (obj.email as string) || (obj.userPrincipalName as string) || '',
        id: (obj.id as string) || '',
    };
}

// ── Fetch Connections ──

export async function fetchConnections(accessToken: string): Promise<ConnectionInfo[]> {
    const url = `${powerAppsConfig.baseUrl}/providers/Microsoft.PowerApps/scopes/admin/environments/${PP_ENV_ID}/connections?api-version=2016-11-01&$top=250`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[ConnectionService] Fetch failed:', response.status, errorText);
        throw new Error(`Power Apps API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ConnectionService] Connections:', data.value?.length || 0, 'items');

    return (data.value || []).map((conn: Record<string, unknown>) => {
        const props = (conn.properties || {}) as Record<string, unknown>;
        const statuses = ((props.statuses || []) as Array<Record<string, unknown>>).map(s => ({
            status: (s.status as string) || 'Unknown',
            error: s.error ? {
                code: ((s.error as Record<string, unknown>).code as string) || '',
                message: ((s.error as Record<string, unknown>).message as string) || '',
            } : undefined,
        }));

        const hasError = statuses.some(s => s.status === 'Error');

        // Extract connector info
        const connectorId = (props.apiId as string) || '';
        const connectorName = connectorId.split('/').pop() || '';

        // Display name from various sources
        const displayName = (props.displayName as string)
            || (props.authenticatedUser as Record<string, unknown>)?.name as string
            || connectorName
            || 'Unknown';

        // Connector display name
        const connectorDisplayName = connectorName
            .replace(/^shared_/i, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());

        // Icon
        const iconUri = (props.iconUri as string) || '';

        return {
            id: (conn.name as string) || '',
            displayName,
            connectorName,
            connectorDisplayName,
            iconUri,
            statuses,
            overallStatus: hasError ? 'Error' : 'Connected',
            createdBy: parseOwner(props.createdBy),
            createdTime: (props.createdTime as string) || '',
            lastModifiedTime: (props.lastModifiedTime as string) || '',
            environment: PP_ENV_ID,
        } as ConnectionInfo;
    });
}
