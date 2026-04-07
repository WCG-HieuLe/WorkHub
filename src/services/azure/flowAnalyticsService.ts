/**
 * Flow Analytics Service — Batch scanning, error analysis, aggregation
 * Ported & enhanced from Quan-ly-flow repo for WorkHub
 */

import { acquireToken } from '@/services/azure/tokenService';
import { PP_ENV_ID, powerAutomateConfig } from '@/config/authConfig';
import type { IPublicClientApplication, AccountInfo } from '@azure/msal-browser';

// ── Types ──

export interface FlowRun {
    id: string;
    name: string;
    status: string;
    startedOn: string;
    completedOn: string;
    trigger: string;
    triggerOutputsLink: string;
    errorCode: string;
    errorMessage: string;
    duration: number; // ms
}

export interface FlowStructure {
    trigger: { name: string; type: string } | null;
    actions: { name: string; type: string }[];
}

export interface RunAnalysis {
    failureRate: string;
    total: number;
    failedCount: number;
    succeededCount: number;
    commonErrors: { code: string; count: number }[];
}

export interface AggregatedStats {
    totalRuns: number;
    failedRuns: number;
    successfulRuns: number;
    runsByDate: Record<string, { passes: number; fails: number }>;
    topFlows: { id: string; name: string; count: number }[];
    recentFailures: FailureEntry[];
    unsharedFlows: { id: string; name: string }[];
}

export interface FailureEntry {
    flowName: string;
    runId: string;
    flowUrl: string;
    runUrl: string;
    startTime: string;
    status: string;
    errorCode: string;
    errorMessage: string;
    failedAction: string;
    triggerType: string;
}

// ── LRU Cache ──

const MAX_CACHE_SIZE = 500;
const runsCache = new Map<string, FlowRun[]>();
const metadataCache = new Map<string, Record<string, unknown>>();

function limitCacheSize<T>(cache: Map<string, T>, maxSize = MAX_CACHE_SIZE) {
    if (cache.size > maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
    }
}

// ── Abort Controller ──

let scanAbortController: AbortController | null = null;
let isScanningAborted = false;

export function stopScanning() {
    isScanningAborted = true;
    if (scanAbortController) {
        scanAbortController.abort();
        scanAbortController = null;
    }
}

export function clearRunsCache() {
    runsCache.clear();
}

// ── API Functions ──

/**
 * Fetch flow runs with time range filter + pagination support
 */
export async function fetchFlowRunsWithRange(
    instance: IPublicClientApplication,
    account: AccountInfo,
    flowId: string,
    daysRange: number = 1,
    top: number = 50,
): Promise<FlowRun[]> {
    const token = await acquireToken(instance, account, powerAutomateConfig.scopes);

    // Check cache
    const cacheKey = `${flowId}_${daysRange}`;
    if (runsCache.has(cacheKey)) {
        return runsCache.get(cacheKey)!;
    }

    // Build filter date
    const now = new Date();
    let filterDate: string;
    if (daysRange === 1) {
        const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
        filterDate = new Date(`${dateStr}T00:00:00+07:00`).toISOString().split('.')[0] + 'Z';
    } else {
        filterDate = new Date(now.getTime() - daysRange * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';
    }

    const allRuns: FlowRun[] = [];
    let url: string | null = `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/scopes/admin/environments/${PP_ENV_ID}/flows/${flowId}/runs?api-version=2016-11-01&$top=${top}&$filter=startTime ge ${filterDate}`;

    let depth = 0;
    while (url && depth < 100) {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            signal: scanAbortController?.signal,
        });

        if (!response.ok) {
            if (response.status === 403) {
                return []; // Permission error — skip
            }
            console.warn(`[FlowRuns] fetch failed: ${response.status}`);
            break;
        }

        const data = await response.json();
        const runs = (data.value || []).map(parseRunData);
        allRuns.push(...runs);

        url = data['@odata.nextLink'] || null;
        depth++;

        if (url) await new Promise(r => setTimeout(r, 150));
    }

    runsCache.set(cacheKey, allRuns);
    limitCacheSize(runsCache);
    return allRuns;
}

/**
 * Fetch flow metadata (definition, connections, triggers, actions)
 */
export async function fetchFlowMetadata(
    instance: IPublicClientApplication,
    account: AccountInfo,
    flowId: string,
): Promise<Record<string, unknown> | null> {
    if (metadataCache.has(flowId)) {
        return metadataCache.get(flowId)!;
    }

    try {
        const token = await acquireToken(instance, account, powerAutomateConfig.scopes);
        const url = `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/scopes/admin/environments/${PP_ENV_ID}/flows/${flowId}?api-version=2016-11-01`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });

        if (!response.ok) return null;

        const data = await response.json();
        metadataCache.set(flowId, data);
        limitCacheSize(metadataCache);
        return data;
    } catch {
        return null;
    }
}

// ── Parse Helpers ──

function parseRunData(run: Record<string, unknown>): FlowRun {
    const props = (run.properties as Record<string, unknown>) || {};
    const trigger = (props.trigger as Record<string, unknown>) || {};
    const error = (props.error as Record<string, string>) || {};
    const outputsLink = ((trigger.outputsLink as Record<string, unknown>)?.uri as string) || '';
    const startTime = (props.startTime as string) || '';
    const endTime = (props.endTime as string) || '';

    const durationMs = startTime && endTime
        ? new Date(endTime).getTime() - new Date(startTime).getTime()
        : 0;

    return {
        id: (run.name as string) || '',
        name: (run.name as string) || '',
        status: (props.status as string) || '',
        startedOn: startTime,
        completedOn: endTime,
        trigger: (trigger.name as string) || '',
        triggerOutputsLink: outputsLink,
        errorCode: error?.code || '',
        errorMessage: error?.message || '',
        duration: durationMs,
    };
}

/**
 * Parse flow structure from metadata
 */
export function parseFlowStructure(metadata: Record<string, unknown> | null): FlowStructure {
    if (!metadata) return { trigger: null, actions: [] };

    const props = (metadata.properties as Record<string, unknown>) || {};
    const definition = (props.definition as Record<string, unknown>) || {};

    // Parse trigger
    const triggers = (definition.triggers as Record<string, Record<string, unknown>>) || {};
    const triggerKey = Object.keys(triggers)[0];
    const trigger = triggerKey
        ? { name: triggerKey, type: (triggers[triggerKey]?.type as string) || 'Unknown' }
        : null;

    // Parse actions
    const actionsObj = (definition.actions as Record<string, Record<string, unknown>>) || {};
    const actions = Object.keys(actionsObj).map(key => ({
        name: key,
        type: (actionsObj[key]?.type as string) || 'Unknown',
    }));

    return { trigger, actions };
}

/**
 * Parse error details from a failed run
 */
export function parseRunError(run: FlowRun): { code: string; message: string; action: string } {
    let failedAction = 'Unknown';

    if (run.errorMessage) {
        const match = run.errorMessage.match(/action ['"](.+?)['"]/i);
        if (match) failedAction = match[1];
    }

    return {
        code: run.errorCode || 'Unknown',
        message: run.errorMessage || 'No error message',
        action: failedAction,
    };
}

/**
 * Analyze a set of runs — failure rate, common errors
 */
export function analyzeRuns(runs: FlowRun[]): RunAnalysis {
    if (!runs || runs.length === 0) {
        return { failureRate: '0.0', total: 0, failedCount: 0, succeededCount: 0, commonErrors: [] };
    }

    const total = runs.length;
    const failedRuns = runs.filter(r => r.status === 'Failed');
    const succeededCount = runs.filter(r => r.status === 'Succeeded').length;
    const failureRate = ((failedRuns.length / total) * 100).toFixed(1);

    const errors = failedRuns.map(r => r.errorCode || r.errorMessage || 'Unknown');
    const errorCounts: Record<string, number> = {};
    for (const err of errors) {
        errorCounts[err] = (errorCounts[err] || 0) + 1;
    }

    const commonErrors = Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([code, count]) => ({ code, count }));

    return { failureRate, total, failedCount: failedRuns.length, succeededCount, commonErrors };
}

// ── Batch Processing ──

/**
 * Batch fetch runs for multiple flows with progress callback
 */
export async function fetchAllFlowsRunsBatched(
    instance: IPublicClientApplication,
    account: AccountInfo,
    flows: { id: string; name: string }[],
    daysRange: number,
    onProgress?: (processed: number, stats: AggregatedStats) => void,
): Promise<AggregatedStats> {
    const BATCH_SIZE = 5;
    isScanningAborted = false;
    scanAbortController = new AbortController();

    const stats: AggregatedStats = {
        totalRuns: 0,
        failedRuns: 0,
        successfulRuns: 0,
        runsByDate: {},
        topFlows: [],
        recentFailures: [],
        unsharedFlows: [],
    };

    for (let i = 0; i < flows.length; i += BATCH_SIZE) {
        if (isScanningAborted) break;

        const batch = flows.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
            batch.map(async (flow) => {
                if (isScanningAborted) return { flow, runs: [] as FlowRun[], permError: false };
                try {
                    const runs = await fetchFlowRunsWithRange(instance, account, flow.id, daysRange);
                    return { flow, runs, permError: false };
                } catch (err: unknown) {
                    const status = (err as { response?: { status?: number } })?.response?.status;
                    if (status === 403) return { flow, runs: [] as FlowRun[], permError: true };
                    return { flow, runs: [] as FlowRun[], permError: false };
                }
            }),
        );

        for (const { flow, runs, permError } of results) {
            if (permError) {
                stats.unsharedFlows.push({ id: flow.id, name: flow.name });
                continue;
            }

            if (runs.length === 0) continue;

            stats.totalRuns += runs.length;
            const failed = runs.filter(r => r.status === 'Failed');
            stats.failedRuns += failed.length;
            stats.successfulRuns += runs.length - failed.length;

            // Runs by date
            for (const run of runs) {
                const date = run.startedOn.split('T')[0];
                if (!date) continue;
                if (!stats.runsByDate[date]) stats.runsByDate[date] = { passes: 0, fails: 0 };
                if (run.status === 'Failed') stats.runsByDate[date].fails++;
                else stats.runsByDate[date].passes++;
            }

            // Top flows
            stats.topFlows.push({ id: flow.id, name: flow.name, count: runs.length });

            // Recent failures
            for (const run of failed) {
                const error = parseRunError(run);
                stats.recentFailures.push({
                    flowName: flow.name,
                    runId: run.id,
                    flowUrl: `https://make.powerautomate.com/environments/${PP_ENV_ID}/flows/${flow.id}/details`,
                    runUrl: `https://make.powerautomate.com/environments/${PP_ENV_ID}/flows/${flow.id}/runs/${run.id}`,
                    startTime: run.startedOn,
                    status: 'Failed',
                    errorCode: error.code,
                    errorMessage: error.message,
                    failedAction: error.action,
                    triggerType: run.trigger || 'Automated',
                });
            }
        }

        // Sort & report progress
        stats.topFlows.sort((a, b) => b.count - a.count);
        if (onProgress) {
            onProgress(Math.min(i + batch.length, flows.length), JSON.parse(JSON.stringify(stats)));
        }

        // Rate limit protection
        if (i + BATCH_SIZE < flows.length) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Final cleanup
    stats.topFlows = stats.topFlows.slice(0, 10);
    stats.recentFailures = stats.recentFailures
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 20);

    return stats;
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
    if (ms <= 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}
