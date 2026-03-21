/**
 * Backup Service — Power Platform Environment Backups
 * Fetches environment backup information from BAP Admin API
 */

import { powerPlatformAdminConfig } from "@/config/authConfig";

// ── Types ──

export interface EnvironmentBackup {
    id: string;
    name: string;
    displayName: string;
    type: string; // Production, Sandbox, Developer, Trial
    state: string; // Ready, Disabled, Preparing
    version: string;
    url: string;
    createdOn: string;
    lastModifiedOn: string;
    retentionPeriod: string;
    backupRetentionDays: number;
    databaseSize: string;
    organizationId: string;
}

export interface BackupData {
    environments: EnvironmentBackup[];
    totalEnvironments: number;
    productionCount: number;
    sandboxCount: number;
    lastFetched: string;
}

// ── API ──

export async function fetchEnvironmentBackups(token: string): Promise<BackupData> {
    const url = `${powerPlatformAdminConfig.baseUrl}/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments?api-version=2021-04-01&$expand=properties.capacity,properties.addons`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
        },
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`BAP API (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const environments: EnvironmentBackup[] = (data.value || []).map((env: Record<string, unknown>) => {
        const props = env.properties as Record<string, unknown> || {};
        const linked = props.linkedEnvironmentMetadata as Record<string, unknown> || {};
        const states = props.states as Record<string, unknown> || {};
        const runtimeState = states.runtime as Record<string, string> || {};

        return {
            id: (env.name as string) || '',
            name: (env.name as string) || '',
            displayName: (props.displayName as string) || '',
            type: (props.environmentSku as string) || 'Unknown',
            state: runtimeState.id || (props.provisioningState as string) || 'Unknown',
            version: (linked.version as string) || '',
            url: (linked.instanceUrl as string) || '',
            createdOn: (props.createdTime as string) || '',
            lastModifiedOn: (props.lastModifiedTime as string) || '',
            retentionPeriod: (props.retentionPeriod as string) || 'P28D',
            backupRetentionDays: parseInt((props.retentionPeriod as string || 'P28D').replace('P', '').replace('D', '')) || 28,
            databaseSize: (linked.platformSku as string) || '',
            organizationId: (linked.resourceId as string) || '',
        };
    });

    const productionCount = environments.filter(e => e.type === 'Production').length;
    const sandboxCount = environments.filter(e => e.type === 'Sandbox').length;

    return {
        environments,
        totalEnvironments: environments.length,
        productionCount,
        sandboxCount,
        lastFetched: new Date().toISOString(),
    };
}
