/**
 * MS Graph Domains Service
 * Fetches verified domains for the tenant
 */

import { graphConfig } from "@/config/authConfig";

export interface Domain {
    id: string;
    authenticationType: string;
    isDefault: boolean;
    isInitial: boolean;
    isVerified: boolean;
    isRoot: boolean;
    isAdminManaged: boolean;
    supportedServices: string[];
}

/**
 * Fetch all domains in tenant
 */
export async function fetchDomains(accessToken: string): Promise<Domain[]> {
    const url = `${graphConfig.baseUrl}/domains`;

    const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Domains API (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return (data.value || []).map((d: Domain) => ({
        id: d.id,
        authenticationType: d.authenticationType,
        isDefault: d.isDefault,
        isInitial: d.isInitial,
        isVerified: d.isVerified,
        isRoot: d.isRoot,
        isAdminManaged: d.isAdminManaged,
        supportedServices: d.supportedServices || [],
    }));
}
