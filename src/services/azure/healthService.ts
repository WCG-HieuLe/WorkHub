/**
 * MS Graph Service Health API
 * Fetches M365 service health overviews and issues
 */

import { graphConfig } from "@/config/authConfig";

export interface ServiceHealth {
    id: string;
    service: string;
    status: 'serviceOperational' | 'investigating' | 'restoringService' |
        'verifyingService' | 'serviceRestored' | 'postIncidentReviewPublished' |
        'serviceDegradation' | 'serviceInterruption' | 'extendedRecovery' |
        'falsePositive' | 'investigationSuspended';
}

export interface ServiceHealthIssue {
    id: string;
    title: string;
    service: string;
    status: string;
    startDateTime: string;
    lastModifiedDateTime: string;
    isResolved: boolean;
    classification: string;
    impactDescription: string;
}

export interface HealthData {
    services: ServiceHealth[];
    activeIssues: ServiceHealthIssue[];
    lastUpdated: string;
}

function mapStatus(status: string): 'healthy' | 'degraded' | 'outage' | 'unknown' {
    switch (status) {
        case 'serviceOperational':
        case 'serviceRestored':
        case 'postIncidentReviewPublished':
        case 'falsePositive':
            return 'healthy';
        case 'investigating':
        case 'verifyingService':
        case 'restoringService':
        case 'serviceDegradation':
        case 'investigationSuspended':
            return 'degraded';
        case 'serviceInterruption':
        case 'extendedRecovery':
            return 'outage';
        default:
            return 'unknown';
    }
}

/**
 * Fetch all M365 service health overviews
 */
export async function fetchServiceHealth(accessToken: string): Promise<ServiceHealth[]> {
    const url = `${graphConfig.baseUrl}/admin/serviceAnnouncement/healthOverviews`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Graph Service Health API (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return (data.value || []).map((s: { id: string; service: string; status: string }) => ({
        id: s.id,
        service: s.service,
        status: s.status,
    }));
}

/**
 * Fetch active service health issues  
 */
export async function fetchActiveIssues(accessToken: string): Promise<ServiceHealthIssue[]> {
    const url = `${graphConfig.baseUrl}/admin/serviceAnnouncement/issues?$filter=isResolved eq false&$top=20&$orderby=startDateTime desc`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        // May not have permission — return empty
        console.warn('Service health issues fetch failed:', response.status);
        return [];
    }

    const data = await response.json();
    return (data.value || []).map((issue: {
        id: string;
        title: string;
        service: string;
        status: string;
        startDateTime: string;
        lastModifiedDateTime: string;
        isResolved: boolean;
        classification: string;
        impactDescription: string;
    }) => ({
        id: issue.id,
        title: issue.title,
        service: issue.service,
        status: issue.status,
        startDateTime: issue.startDateTime,
        lastModifiedDateTime: issue.lastModifiedDateTime,
        isResolved: issue.isResolved,
        classification: issue.classification,
        impactDescription: issue.impactDescription,
    }));
}

/**
 * Fetch all health data
 */
export async function fetchHealthData(accessToken: string): Promise<HealthData> {
    const [services, issues] = await Promise.all([
        fetchServiceHealth(accessToken),
        fetchActiveIssues(accessToken),
    ]);

    return {
        services,
        activeIssues: issues,
        lastUpdated: new Date().toISOString(),
    };
}

export { mapStatus };
