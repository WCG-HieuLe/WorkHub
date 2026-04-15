/**
 * Audit Settings Service — Dataverse Metadata API
 * Fetches which custom tables/columns have auditing enabled
 * 
 * Optimized: List loads entity-level data only.
 * Detail (columns) loads on-demand when user clicks a row.
 */

import { dataverseConfig } from '@/config/authConfig';

// ── Types ──

export interface AuditedColumn {
    logicalName: string;
    displayName: string;
}

export interface AuditTableDetail {
    auditedColumns: AuditedColumn[];
    unauditedLookups: AuditedColumn[];
}

export interface AuditTableInfo {
    logicalName: string;
    displayName: string;
    isAuditEnabled: boolean;
    canChangeAudit: boolean;
    /** Populated on-demand via fetchTableAuditDetail */
    detail?: AuditTableDetail;
}

// ── Helpers ──

function extractLabel(obj: Record<string, unknown> | undefined): string {
    const labels = (obj?.LocalizedLabels as Array<Record<string, unknown>>) || [];
    return labels.length > 0 ? (labels[0].Label as string) || '' : '';
}

// ── Fetch Entity List (lightweight, no columns) ──

export async function fetchAuditSettings(accessToken: string): Promise<AuditTableInfo[]> {
    const url = `${dataverseConfig.orgUrl}/api/data/v9.2/EntityDefinitions`
        + `?$select=LogicalName,DisplayName,IsAuditEnabled`
        + `&$filter=IsCustomEntity eq true`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[AuditSettingsService] Fetch failed:', response.status, errorText);
        throw new Error(`Dataverse Metadata API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AuditSettingsService] Custom entities:', data.value?.length || 0);

    const CUSTOM_PREFIXES = ['cr44a_', 'cr1bb_', 'crdfd_'];

    return (data.value || []).map((entity: Record<string, unknown>) => {
        const displayLabel = extractLabel(entity.DisplayName as Record<string, unknown>);
        const auditEnabled = entity.IsAuditEnabled as Record<string, unknown> | undefined;

        return {
            logicalName: (entity.LogicalName as string) || '',
            displayName: displayLabel || (entity.LogicalName as string) || '',
            isAuditEnabled: (auditEnabled?.Value as boolean) || false,
            canChangeAudit: (auditEnabled?.CanBeChanged as boolean) ?? true,
        } as AuditTableInfo;
    })
    .filter((t: AuditTableInfo) => t.canChangeAudit && CUSTOM_PREFIXES.some(p => t.logicalName.startsWith(p)))
    .sort((a: AuditTableInfo, b: AuditTableInfo) => a.displayName.localeCompare(b.displayName));
}

// ── Fetch Detail for a Single Table (on-demand) ──

export async function fetchTableAuditDetail(
    accessToken: string,
    entityLogicalName: string,
    isAuditEnabled: boolean,
): Promise<AuditTableDetail> {
    const url = `${dataverseConfig.orgUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')`
        + `?$select=LogicalName`
        + `&$expand=Attributes($select=LogicalName,DisplayName,IsAuditEnabled,AttributeType,IsCustomAttribute)`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[AuditSettingsService] Detail fetch failed:', response.status, errorText);
        throw new Error(`Detail fetch error: ${response.status}`);
    }

    const entity = await response.json();
    const attributes = (entity.Attributes as Array<Record<string, unknown>>) || [];

    const auditedColumns: AuditedColumn[] = [];
    const unauditedLookups: AuditedColumn[] = [];

    for (const attr of attributes) {
        const attrAudit = attr.IsAuditEnabled as Record<string, unknown> | undefined;
        const isAttrAudited = (attrAudit?.Value as boolean) || false;
        const isCustom = attr.IsCustomAttribute as boolean;
        const attrType = attr.AttributeType as string;
        const logicalName = (attr.LogicalName as string) || '';
        const displayName = extractLabel(attr.DisplayName as Record<string, unknown>);

        if (isAttrAudited && isCustom) {
            auditedColumns.push({ logicalName, displayName });
        } else if (isCustom && attrType === 'Lookup' && isAuditEnabled) {
            unauditedLookups.push({ logicalName, displayName });
        }
    }

    return { auditedColumns, unauditedLookups };
}

// ── Toggle Audit ON/OFF ──

export async function updateTableAudit(
    accessToken: string,
    entityLogicalName: string,
    enableAudit: boolean,
): Promise<void> {
    const baseUrl = dataverseConfig.orgUrl;

    // Step 1: Update IsAuditEnabled on the entity
    const updateUrl = `${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')`;
    const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'MSCRM.MergeLabels': 'true',
        },
        body: JSON.stringify({
            LogicalName: entityLogicalName,
            IsAuditEnabled: {
                Value: enableAudit,
                CanBeChanged: true,
                ManagedPropertyLogicalName: 'canmodifyauditsettings',
            },
        }),
    });

    if (!updateRes.ok) {
        const errorText = await updateRes.text();
        console.error('[AuditSettingsService] Update failed:', updateRes.status, errorText);
        throw new Error(`Failed to update audit: ${updateRes.status}`);
    }

    // Step 2: Publish the entity to apply changes
    const publishUrl = `${baseUrl}/api/data/v9.2/PublishXml`;
    const publishRes = await fetch(publishUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
        },
        body: JSON.stringify({
            ParameterXml: `<importexportxml><entities><entity>${entityLogicalName}</entity></entities></importexportxml>`,
        }),
    });

    if (!publishRes.ok) {
        console.warn('[AuditSettingsService] Publish warning:', publishRes.status);
    }

    console.log(`[AuditSettingsService] Audit ${enableAudit ? 'enabled' : 'disabled'} for ${entityLogicalName}`);
}
