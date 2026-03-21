/**
 * Power BI REST API Service
 * Fetches workspaces and reports from Power BI
 */

import { powerBIConfig } from "@/config/authConfig";

export interface PBIWorkspace {
    id: string;
    name: string;
    type: string;
    isReadOnly: boolean;
}

export interface PBIReport {
    id: string;
    name: string;
    webUrl: string;
    embedUrl: string;
    datasetId: string;
    workspaceId: string;
    workspaceName: string;
}

/**
 * Fetch all workspaces the user has access to
 */
export async function fetchWorkspaces(accessToken: string): Promise<PBIWorkspace[]> {
    const url = `${powerBIConfig.baseUrl}/groups?$top=100`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Power BI workspaces error:", response.status, errorText);
        throw new Error(`Power BI API (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return (data.value || []).map((ws: { id: string; name: string; type: string; isReadOnly: boolean }) => ({
        id: ws.id,
        name: ws.name,
        type: ws.type,
        isReadOnly: ws.isReadOnly,
    }));
}

/**
 * Fetch reports in a specific workspace
 */
export async function fetchReportsInWorkspace(accessToken: string, workspaceId: string): Promise<PBIReport[]> {
    const url = `${powerBIConfig.baseUrl}/groups/${workspaceId}/reports`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        // Some workspaces may not have permission — skip
        console.warn(`PBI reports fetch failed for workspace ${workspaceId}:`, response.status);
        return [];
    }

    const data = await response.json();
    return (data.value || []).map((r: { id: string; name: string; webUrl: string; embedUrl: string; datasetId: string }) => ({
        id: r.id,
        name: r.name,
        webUrl: r.webUrl,
        embedUrl: r.embedUrl,
        datasetId: r.datasetId,
        workspaceId,
        workspaceName: '', // Will be filled by caller
    }));
}

/**
 * Fetch all reports across all workspaces
 */
export async function fetchAllReports(accessToken: string): Promise<PBIReport[]> {
    const workspaces = await fetchWorkspaces(accessToken);

    const reportPromises = workspaces.map(async (ws) => {
        const reports = await fetchReportsInWorkspace(accessToken, ws.id);
        return reports.map(r => ({ ...r, workspaceName: ws.name }));
    });

    const results = await Promise.allSettled(reportPromises);
    const allReports: PBIReport[] = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allReports.push(...result.value);
        }
    }

    return allReports;
}
