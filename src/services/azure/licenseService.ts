/**
 * MS Graph License Service
 * Fetches license/subscription data from MS Graph API
 */

import { graphConfig } from "@/config/authConfig";

export interface LicenseSku {
    skuId: string;
    skuPartNumber: string;
    displayName: string;
    appliesTo: string;
    totalUnits: number;
    assignedUnits: number;
    availableUnits: number;
    suspendedUnits: number;
    warningUnits: number;
    status: 'success' | 'warning' | 'suspended' | 'disabled';
}

export interface LicenseSummary {
    totalSkus: number;
    totalSeats: number;
    assignedSeats: number;
    availableSeats: number;
    usagePercent: number;
    skus: LicenseSku[];
    lastUpdated: string;
}

function getSkuDisplayName(skuPartNumber: string): string {
    const nameMap: Record<string, string> = {
        'ENTERPRISEPREMIUM': 'Office 365 E5',
        'ENTERPRISEPACK': 'Office 365 E3',
        'ENTERPRISEPACK_FACULTY': 'Office 365 A3 (Faculty)',
        'SPE_E3': 'Microsoft 365 E3',
        'SPE_E5': 'Microsoft 365 E5',
        'SPE_F1': 'Microsoft 365 F1',
        'FLOW_FREE': 'Power Automate Free',
        'FLOW_PER_USER': 'Power Automate per User',
        'POWERAPPS_PER_USER': 'Power Apps per User',
        'POWER_BI_PRO': 'Power BI Pro',
        'POWER_BI_STANDARD': 'Power BI (Free)',
        'PBI_PREMIUM_PER_USER': 'Power BI Premium per User',
        'EXCHANGESTANDARD': 'Exchange Online (Plan 1)',
        'EXCHANGEENTERPRISE': 'Exchange Online (Plan 2)',
        'VISIOCLIENT': 'Visio Plan 2',
        'PROJECTPREMIUM': 'Project Plan 5',
        'PROJECTPROFESSIONAL': 'Project Plan 3',
        'EMS_E5': 'Enterprise Mobility + Security E5',
        'EMSPREMIUM': 'Enterprise Mobility + Security E5',
        'AAD_PREMIUM': 'Microsoft Entra ID P1',
        'AAD_PREMIUM_P2': 'Microsoft Entra ID P2',
        'WIN_ENT_E5': 'Windows 10/11 Enterprise E5',
        'TEAMS_EXPLORATORY': 'Microsoft Teams Exploratory',
        'STREAM': 'Microsoft Stream',
        'DYN365_ENTERPRISE_P1_IW': 'Dynamics 365 P1',
        'POWERAPPS_VIRAL': 'Power Apps (Viral)',
        'CCIBOTS_PRIVPREV_VIRAL': 'Power Virtual Agents Viral',
        'MICROSOFT_BUSINESS_CENTER': 'Microsoft Business Center',
        'POWER_PAGES_VIRAL': 'Power Pages (Viral)',
        'POWERAUTOMATE_ATTENDED_RPA': 'Power Automate Attended RPA',
    };
    return nameMap[skuPartNumber] || skuPartNumber.replace(/_/g, ' ');
}

function getSkuStatus(sku: { capabilityStatus: string; prepaidUnits: { warning: number; suspended: number } }): LicenseSku['status'] {
    if (sku.capabilityStatus === 'Suspended') return 'suspended';
    if (sku.capabilityStatus === 'Deleted' || sku.capabilityStatus === 'LockedOut') return 'disabled';
    if (sku.prepaidUnits.warning > 0) return 'warning';
    return 'success';
}

/**
 * Fetch all subscribed SKUs from MS Graph
 */
export async function fetchLicenseSummary(accessToken: string): Promise<LicenseSummary> {
    const url = `${graphConfig.baseUrl}/subscribedSkus`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("MS Graph subscribedSkus error:", response.status, errorText);
        throw new Error(`MS Graph API (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    const skus: LicenseSku[] = (data.value || [])
        .filter((sku: { appliesTo: string }) => sku.appliesTo === 'User')
        .map((sku: {
            skuId: string;
            skuPartNumber: string;
            appliesTo: string;
            capabilityStatus: string;
            prepaidUnits: { enabled: number; warning: number; suspended: number };
            consumedUnits: number;
        }) => ({
            skuId: sku.skuId,
            skuPartNumber: sku.skuPartNumber,
            displayName: getSkuDisplayName(sku.skuPartNumber),
            appliesTo: sku.appliesTo,
            totalUnits: sku.prepaidUnits.enabled,
            assignedUnits: sku.consumedUnits,
            availableUnits: Math.max(0, sku.prepaidUnits.enabled - sku.consumedUnits),
            suspendedUnits: sku.prepaidUnits.suspended,
            warningUnits: sku.prepaidUnits.warning,
            status: getSkuStatus(sku),
        }))
        .sort((a: LicenseSku, b: LicenseSku) => b.assignedUnits - a.assignedUnits);

    const totalSeats = skus.reduce((sum: number, s: LicenseSku) => sum + s.totalUnits, 0);
    const assignedSeats = skus.reduce((sum: number, s: LicenseSku) => sum + s.assignedUnits, 0);

    return {
        totalSkus: skus.length,
        totalSeats,
        assignedSeats,
        availableSeats: totalSeats - assignedSeats,
        usagePercent: totalSeats > 0 ? (assignedSeats / totalSeats) * 100 : 0,
        skus,
        lastUpdated: new Date().toISOString(),
    };
}

// ===== Row Detail: License Detail =====

export interface ServicePlan {
    servicePlanId: string;
    servicePlanName: string;
    provisioningStatus: string;
}

export interface AssignedUser {
    displayName: string;
    userPrincipalName: string;
    mail: string | null;
}

export interface LicenseDetail {
    sku: LicenseSku;
    servicePlans: ServicePlan[];
    assignedUsers: AssignedUser[];
    rawCapabilityStatus: string;
}

/**
 * Fetch detail for a specific SKU: service plans + assigned users
 */
export async function fetchLicenseDetail(
    accessToken: string,
    skuId: string,
    skuData: LicenseSku
): Promise<LicenseDetail> {
    // 1. Fetch SKU metadata (service plans)
    const skuRes = await fetch(`${graphConfig.baseUrl}/subscribedSkus/${skuId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    let servicePlans: ServicePlan[] = [];
    let rawCapabilityStatus = '';

    if (skuRes.ok) {
        const skuDetail = await skuRes.json();
        rawCapabilityStatus = skuDetail.capabilityStatus || '';
        servicePlans = (skuDetail.servicePlans || []).map((sp: {
            servicePlanId: string;
            servicePlanName: string;
            provisioningStatus: string;
        }) => ({
            servicePlanId: sp.servicePlanId,
            servicePlanName: sp.servicePlanName,
            provisioningStatus: sp.provisioningStatus,
        }));
    }

    // 2. Fetch assigned users (top 50)
    const usersUrl = `${graphConfig.baseUrl}/users?$filter=assignedLicenses/any(x:x/skuId eq ${skuId})&$select=displayName,userPrincipalName,mail&$top=50&$orderby=displayName`;
    let assignedUsers: AssignedUser[] = [];

    try {
        const usersRes = await fetch(usersUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (usersRes.ok) {
            const usersData = await usersRes.json();
            assignedUsers = (usersData.value || []).map((u: {
                displayName: string;
                userPrincipalName: string;
                mail: string | null;
            }) => ({
                displayName: u.displayName,
                userPrincipalName: u.userPrincipalName,
                mail: u.mail,
            }));
        }
    } catch (e) {
        console.warn('Could not fetch assigned users:', e);
    }

    return {
        sku: skuData,
        servicePlans,
        assignedUsers,
        rawCapabilityStatus,
    };
}
