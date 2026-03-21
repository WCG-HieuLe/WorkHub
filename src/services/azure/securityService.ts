/**
 * MS Graph Security & Identity Protection Service
 * Fetches risky users, security alerts
 */

import { graphConfig } from "@/config/authConfig";

export interface RiskyUser {
    id: string;
    userDisplayName: string;
    userPrincipalName: string;
    riskState: string;
    riskLevel: string;
    riskDetail: string;
    riskLastUpdatedDateTime: string;
}

export interface SecurityAlert {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'unknown' | 'informational';
    status: string;
    category: string;
    createdDateTime: string;
    description: string;
}

export interface SecurityData {
    riskyUsers: RiskyUser[];
    alerts: SecurityAlert[];
}

/**
 * Fetch risky users from Identity Protection
 */
export async function fetchRiskyUsers(accessToken: string): Promise<RiskyUser[]> {
    const url = `${graphConfig.baseUrl}/identityProtection/riskyUsers?$top=20&$orderby=riskLastUpdatedDateTime desc`;

    const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        console.warn('Risky users fetch failed:', response.status);
        return [];
    }

    const data = await response.json();
    return (data.value || []).map((u: RiskyUser) => ({
        id: u.id,
        userDisplayName: u.userDisplayName,
        userPrincipalName: u.userPrincipalName,
        riskState: u.riskState,
        riskLevel: u.riskLevel,
        riskDetail: u.riskDetail,
        riskLastUpdatedDateTime: u.riskLastUpdatedDateTime,
    }));
}

/**
 * Fetch security alerts
 */
export async function fetchSecurityAlerts(accessToken: string): Promise<SecurityAlert[]> {
    const url = `${graphConfig.baseUrl}/security/alerts_v2?$top=20&$orderby=createdDateTime desc`;

    const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        console.warn('Security alerts fetch failed:', response.status);
        return [];
    }

    const data = await response.json();
    return (data.value || []).map((a: SecurityAlert) => ({
        id: a.id,
        title: a.title,
        severity: a.severity,
        status: a.status,
        category: a.category,
        createdDateTime: a.createdDateTime,
        description: a.description,
    }));
}

/**
 * Fetch all security data
 */
export async function fetchSecurityData(accessToken: string): Promise<SecurityData> {
    const [riskyUsers, alerts] = await Promise.all([
        fetchRiskyUsers(accessToken),
        fetchSecurityAlerts(accessToken),
    ]);

    return { riskyUsers, alerts };
}
