import React, { useState, useCallback, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import {
    Activity, AlertTriangle, CheckCircle, Shield, Loader2, Square,
    ExternalLink, Search, X, Trash2
} from 'lucide-react';
import {
    fetchFlowHealthCheck,
    stopScanning,
    clearRunsCache,
    type HealthCheckResult,
} from '@/services/azure/flowAnalyticsService';
import type { FlowDefinition } from '@/services/azure/powerPlatformService';
import { PP_ENV_ID } from '@/config/authConfig';

interface Props {
    flows: FlowDefinition[];
    onDeleteFlow?: (id: string, name: string) => void;
    deletingId?: string | null;
    healthResult: HealthCheckResult | null;
    onHealthResultChange: (res: HealthCheckResult | null) => void;
}

const DAYS_OPTIONS = [
    { value: 1, label: 'Today' },
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
];

export const FlowOverview: React.FC<Props> = ({ flows, onDeleteFlow, deletingId, healthResult, onHealthResultChange }) => {
    const { instance, accounts } = useMsal();

    const [daysRange, setDaysRange] = useState(1);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = React.useState<'failed' | 'stuck'>('failed');

    React.useEffect(() => {
        if (healthResult) {
            if (healthResult.failedFlows.length === 0 && healthResult.stuckFlows.length > 0) {
                setActiveTab('stuck');
            } else {
                setActiveTab('failed');
            }
        }
    }, [healthResult]);

    const activatedFlows = flows.filter(f => f.state === 'Activated');

    const startScan = useCallback(async () => {
        if (!accounts[0] || scanning) return;
        setScanning(true);
        setProgress(0);
        onHealthResultChange(null);
        setSearch('');
        clearRunsCache();

        try {
            const data = await fetchFlowHealthCheck(
                instance,
                accounts[0],
                activatedFlows.map(f => ({ id: f.id, name: f.name, owner: f.owner })),
                daysRange,
                (processed, total) => {
                    setProgress(Math.round((processed / total) * 100));
                },
            );
            onHealthResultChange(data);
        } catch (err) {
            console.error('[FlowOverview] scan error:', err);
        } finally {
            setScanning(false);
            setProgress(100);
        }
    }, [instance, accounts, activatedFlows, daysRange, scanning]);

    const handleStop = () => {
        stopScanning();
        setScanning(false);
    };

    /* ─── Filter logic ─── */
    const filteredFailed = useMemo(() => {
        if (!healthResult) return [];
        if (!search.trim()) return healthResult.failedFlows;
        const q = search.toLowerCase();
        return healthResult.failedFlows.filter(f =>
            f.name.toLowerCase().includes(q) ||
            f.owner.toLowerCase().includes(q) ||
            f.lastError.toLowerCase().includes(q)
        );
    }, [healthResult, search]);

    const filteredStuck = useMemo(() => {
        if (!healthResult) return [];
        if (!search.trim()) return healthResult.stuckFlows;
        const q = search.toLowerCase();
        return healthResult.stuckFlows.filter(f =>
            f.name.toLowerCase().includes(q) ||
            f.owner.toLowerCase().includes(q)
        );
    }, [healthResult, search]);

    const flowUrl = (flowId: string) =>
        `https://make.powerautomate.com/environments/${PP_ENV_ID}/flows/${flowId}/details`;

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in pb-10">
            {/* ── Scan Controls ── */}
            <div className="flex flex-wrap items-center gap-4 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    {DAYS_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { setDaysRange(opt.value); onHealthResultChange(null); }}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                daysRange === opt.value
                                    ? 'bg-[var(--accent-primary)] text-white shadow-md'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {scanning ? (
                    <button
                        onClick={handleStop}
                        className="flex items-center gap-2 px-5 py-1.5 rounded-xl text-sm font-semibold transition-all bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] text-[var(--danger)] border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--danger)_25%,transparent)]"
                    >
                        <Square size={16} /> Stop Monitor
                    </button>
                ) : (
                    <button
                        onClick={startScan}
                        className="flex items-center gap-2 px-5 py-1.5 rounded-xl text-sm font-semibold transition-all bg-[var(--accent-primary)] text-[var(--bg-primary)] hover:brightness-110 shadow-sm"
                    >
                        <Activity size={16} /> Health Scan
                    </button>
                )}
            </div>

            {/* ── Progress Bar ── */}
            {scanning && (
                <div className="space-y-2 bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)]">
                    <div className="flex flex-row items-center justify-between text-xs font-medium text-[var(--text-muted)]">
                        <span className="flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-[var(--accent-primary)]" />
                            Scanning flow run histories...
                        </span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-hover)]">
                        <div
                            className="h-full rounded-full transition-all duration-300 relative overflow-hidden bg-[var(--accent-primary)]"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {/* ── View Toggle & Search ── */}
            {healthResult && (healthResult.failedFlows.length > 0 || healthResult.stuckFlows.length > 0) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 mb-2">
                    <div className="sub-tabs">
                        <button className={`sub-tab ${activeTab === 'failed' ? 'active' : ''}`} onClick={() => setActiveTab('failed')}>
                            <AlertTriangle size={14} style={{ marginRight: 4 }} className={activeTab === 'failed' ? "text-[var(--danger)]" : ""} /> 
                            Flow Failures <span className="ml-1 opacity-70">({healthResult.failedFlows.length})</span>
                        </button>
                        <button className={`sub-tab ${activeTab === 'stuck' ? 'active' : ''}`} onClick={() => setActiveTab('stuck')}>
                            <Shield size={14} style={{ marginRight: 4 }} className={activeTab === 'stuck' ? "text-[var(--warning)]" : ""} />
                            Stuck Flows <span className="ml-1 opacity-70">({healthResult.stuckFlows.length})</span>
                        </button>
                    </div>

                    <div className="list-view-search" style={{ maxWidth: '300px', width: '100%', margin: 0 }}>
                        <Search size={14} className="list-view-search-icon" />
                        <input
                            type="text"
                            placeholder="Filter by name, error, or owner..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="list-view-search-clear">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Failed Flows Table ── */}
            {healthResult && activeTab === 'failed' && (
                filteredFailed.length > 0 ? (
                <div className="list-view-table-wrapper" style={{ overflow: 'visible', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                        <AlertTriangle size={16} className="text-[var(--danger)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                            Flows with Failures
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium ml-2 bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] text-[var(--danger)]">
                            {filteredFailed.length}
                        </span>
                    </div>
                    <table className="list-view-table w-full">
                        <thead>
                            <tr>
                                <th>Flow Name</th>
                                <th style={{ textAlign: 'center' }}>Fails</th>
                                <th style={{ textAlign: 'center' }}>Total Checked</th>
                                <th>Last Error Message</th>
                                <th>Owner</th>
                                <th style={{ width: 70 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFailed.map(f => (
                                <tr key={f.id} className="clickable-row">
                                    <td className="font-semibold">{f.name}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="status-badge status-rejected" style={{ fontWeight: 700 }}>
                                            {f.failCount}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }} className="text-[var(--text-muted)]">{f.totalRuns}</td>
                                    <td className="text-[var(--text-muted)] truncate max-w-[300px]" title={f.lastError}>
                                        {f.lastError || '—'}
                                    </td>
                                    <td className="text-[var(--text-muted)] truncate max-w-[150px]">{f.owner || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="flex items-center justify-center gap-1">
                                            <a
                                                href={flowUrl(f.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="action-icon-btn"
                                                onClick={e => e.stopPropagation()}
                                                title="Open in portal"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteFlow?.(f.id, f.name); }}
                                                disabled={deletingId === f.id}
                                                className="action-icon-btn hover:text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
                                                title="Delete flow"
                                            >
                                                {deletingId === f.id ? <Loader2 size={14} className="animate-spin text-[var(--danger)]" /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                ) : (
                    <div className="py-8 text-center text-[var(--text-muted)] text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl mt-2">
                        {healthResult.failedFlows.length === 0 ? 'No failed flows found.' : 'No failed flows match your search filter.'}
                    </div>
                )
            )}

            {/* ── Stuck Flows Table ── */}
            {healthResult && activeTab === 'stuck' && (
                filteredStuck.length > 0 ? (
                <div className="list-view-table-wrapper" style={{ overflow: 'visible', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                        <Shield size={16} className="text-[var(--warning)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                            Stuck Flows (Running &gt; 50)
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium ml-2 bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-[var(--warning)]">
                            {filteredStuck.length}
                        </span>
                    </div>
                    <table className="list-view-table w-full">
                        <thead>
                            <tr>
                                <th>Flow Name</th>
                                <th style={{ textAlign: 'center' }}>Running</th>
                                <th style={{ textAlign: 'center' }}>Total Checked</th>
                                <th>Owner</th>
                                <th style={{ width: 70 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStuck.map(f => (
                                <tr key={f.id} className="clickable-row">
                                    <td className="font-semibold">{f.name}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="status-badge status-warning" style={{ fontWeight: 700 }}>
                                            {f.runningCount}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }} className="text-[var(--text-muted)]">{f.totalRuns}</td>
                                    <td className="text-[var(--text-muted)] truncate max-w-[150px]">{f.owner || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="flex items-center justify-center gap-1">
                                            <a
                                                href={flowUrl(f.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="action-icon-btn"
                                                onClick={e => e.stopPropagation()}
                                                title="Open in portal"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteFlow?.(f.id, f.name); }}
                                                disabled={deletingId === f.id}
                                                className="action-icon-btn hover:text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
                                                title="Delete flow"
                                            >
                                                {deletingId === f.id ? <Loader2 size={14} className="animate-spin text-[var(--danger)]" /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                ) : (
                    <div className="py-8 text-center text-[var(--text-muted)] text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl mt-2">
                        {healthResult.stuckFlows.length === 0 ? 'No stuck flows found.' : 'No stuck flows match your search filter.'}
                    </div>
                )
            )}

            {/* ── No Issues ── */}
            {healthResult && healthResult.failedFlows.length === 0 && healthResult.stuckFlows.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] mt-4">
                    <div className="p-4 rounded-full bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]">
                        <CheckCircle size={48} />
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>System Healthy</p>
                        <p className="text-sm mt-2 text-[var(--text-muted)]">
                            Scanned {healthResult.scannedFlows} flows. No failures or stuck runs detected in the selected period.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Empty State ── */}
            {!scanning && !healthResult && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card)] mt-4 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="p-5 rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)]">
                        <Activity size={36} />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                        Select a timeframe and click "Run Health Check" to execute diagnostics.
                    </p>
                </div>
            )}
        </div>
    );
};

