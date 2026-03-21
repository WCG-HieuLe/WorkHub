/**
 * MS Graph Audit Logs Service
 * Fetches sign-in logs and directory audit events
 */

import { graphConfig } from "@/config/authConfig";

export interface SignInLog {
    id: string;
    userDisplayName: string;
    userPrincipalName: string;
    appDisplayName: string;
    ipAddress: string;
    clientAppUsed: string;
    status: {
        errorCode: number;
        failureReason: string;
    };
    createdDateTime: string;
    location: {
        city: string;
        state: string;
        countryOrRegion: string;
    };
}

export interface AuditEvent {
    id: string;
    category: string;
    activityDisplayName: string;
    initiatedBy: {
        user?: { displayName: string; userPrincipalName: string };
        app?: { displayName: string };
    };
    result: string;
    activityDateTime: string;
    targetResources: Array<{
        displayName: string;
        type: string;
    }>;
}

export interface AuditData {
    signIns: SignInLog[];
    auditEvents: AuditEvent[];
}

/**
 * Fetch recent sign-in logs
 */
export async function fetchSignInLogs(accessToken: string, top = 30): Promise<SignInLog[]> {
    const url = `${graphConfig.baseUrl}/auditLogs/signIns?$top=${top}&$orderby=createdDateTime desc`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sign-in Logs API (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return (data.value || []).map((log: SignInLog) => ({
        id: log.id,
        userDisplayName: log.userDisplayName,
        userPrincipalName: log.userPrincipalName,
        appDisplayName: log.appDisplayName,
        ipAddress: log.ipAddress,
        clientAppUsed: log.clientAppUsed,
        status: log.status,
        createdDateTime: log.createdDateTime,
        location: log.location || { city: '', state: '', countryOrRegion: '' },
    }));
}

/**
 * Fetch recent directory audit events
 */
export async function fetchAuditEvents(accessToken: string, top = 20): Promise<AuditEvent[]> {
    const url = `${graphConfig.baseUrl}/auditLogs/directoryAudits?$top=${top}&$orderby=activityDateTime desc`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        console.warn('Audit events fetch failed:', response.status);
        return [];
    }

    const data = await response.json();
    return (data.value || []).map((event: AuditEvent) => ({
        id: event.id,
        category: event.category,
        activityDisplayName: event.activityDisplayName,
        initiatedBy: event.initiatedBy,
        result: event.result,
        activityDateTime: event.activityDateTime,
        targetResources: event.targetResources || [],
    }));
}

/**
 * Fetch all audit data
 */
export async function fetchAuditData(accessToken: string): Promise<AuditData> {
    const [signIns, auditEvents] = await Promise.all([
        fetchSignInLogs(accessToken),
        fetchAuditEvents(accessToken),
    ]);

    return { signIns, auditEvents };
}
