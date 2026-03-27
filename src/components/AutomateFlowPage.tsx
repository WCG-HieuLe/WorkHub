import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Zap, RefreshCw, AlertTriangle, Search, X,
    CheckCircle, XCircle, User, Copy, Check,
    ChevronDown, ChevronRight, ExternalLink, Clock, History,
} from 'lucide-react';
import type { FlowDefinition, FlowRun } from '@/services/azure/powerPlatformService';
import { fetchFlows, fetchFlowRuns, fetchFlowRunTriggerOutput } from '@/services/azure/powerPlatformService';
import { acquireToken } from '@/services/azure/tokenService';
import { dataverseConfig, powerAutomateConfig } from '@/config/authConfig';
import { getCache, setCache, clearCache } from '@/services/cache';

const CACHE_KEY = 'automate_flows';

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* noop */ }
    };
    return (
        <button
            onClick={handleCopy}
            className="billing-refresh-btn"
            style={{ padding: '4px 6px', lineHeight: 0 }}
            title={copied ? 'Copied!' : `Copy ${label || ''}`}
        >
            {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
        </button>
    );
};

export const AutomateFlowPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const cached = getCache<{ flows: FlowDefinition[]; total: number }>(CACHE_KEY);
    const [flows, setFlows] = useState<FlowDefinition[]>(cached?.flows || []);
    const [total, setTotal] = useState(cached?.total || 0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedFlow, setSelectedFlow] = useState<FlowDefinition | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const loaded = cached !== null;

    // History popup state (center modal)
    const [historyName, setHistoryName] = useState('');
    const [historyRuns, setHistoryRuns] = useState<FlowRun[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historySearch, setHistorySearch] = useState('');

    // Trigger output expand state
    const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
    const [triggerOutput, setTriggerOutput] = useState<Record<string, unknown> | null>(null);
    const [triggerLoading, setTriggerLoading] = useState(false);

    // Open history popup (lazy load)
    const openHistory = useCallback(async (flow: FlowDefinition) => {
        setHistoryName(flow.name);
        setHistoryOpen(true);
        setHistoryRuns([]);
        setHistoryLoading(true);
        try {
            const token = await acquireToken(instance, accounts[0], powerAutomateConfig.scopes);
            const runs = await fetchFlowRuns(token, flow.id);
            setHistoryRuns(runs);
        } catch (err) {
            console.warn('Failed to load flow runs:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [instance, accounts]);

    // Toggle expand run → lazy load trigger output
    const toggleRunExpand = useCallback(async (run: FlowRun) => {
        if (expandedRunId === run.id) {
            setExpandedRunId(null);
            setTriggerOutput(null);
            return;
        }
        setExpandedRunId(run.id);
        setTriggerOutput(null);
        setTriggerLoading(true);
        try {
            const output = await fetchFlowRunTriggerOutput(run.triggerOutputsLink);
            setTriggerOutput(output);
        } catch {
            setTriggerOutput(null);
        } finally {
            setTriggerLoading(false);
        }
    }, [expandedRunId]);

    // Filter runs by search keyword
    const filteredRuns = useMemo(() => {
        if (!historySearch.trim()) return historyRuns;
        const q = historySearch.toLowerCase();
        return historyRuns.filter(r =>
            r.status.toLowerCase().includes(q) ||
            r.trigger.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q) ||
            r.startedOn.toLowerCase().includes(q)
        );
    }, [historyRuns, historySearch]);

    const loadData = useCallback(async (force = false) => {
        if (!isAuthenticated || accounts.length === 0) return;
        if (!force && loaded) return;
        if (force) clearCache(CACHE_KEY);
        setLoading(true);
        setError(null);
        try {
            const token = await acquireToken(instance, accounts[0], dataverseConfig.scopes);
            const result = await fetchFlows(token);
            setFlows(result.flows);
            setTotal(result.total);
            setCache(CACHE_KEY, result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load flows');
        } finally {
            setLoading(false);
        }
    }, [instance, accounts, isAuthenticated, loaded]);

    useEffect(() => { loadData(); }, [loadData]);

    // Group by owner
    const ownerGroups = useMemo(() => {
        const filtered = search
            ? flows.filter(f =>
                f.id.toLowerCase().includes(search.toLowerCase()) ||
                f.name.toLowerCase().includes(search.toLowerCase()) ||
                f.owner.toLowerCase().includes(search.toLowerCase()) ||
                f.description.toLowerCase().includes(search.toLowerCase())
            )
            : flows;
        const map = new Map<string, FlowDefinition[]>();
        for (const f of filtered) {
            const key = f.owner || 'Unknown';
            const list = map.get(key) || [];
            list.push(f);
            map.set(key, list);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [flows, search]);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => prev[key] ? {} : { [key]: true });
    };

    // Auto-open 'Operation' group by default
    useEffect(() => {
        if (Object.keys(expandedGroups).length > 0) return;
        if (ownerGroups.length === 0) return;
        const opGroup = ownerGroups.find(([name]) => name.toLowerCase().includes('operation'));
        if (opGroup) setExpandedGroups({ [opGroup[0]]: true });
        else setExpandedGroups({ [ownerGroups[0][0]]: true });
    }, [ownerGroups]);

    const activeCount = flows.filter(f => f.state === 'Activated').length;
    const draftCount = flows.filter(f => f.state !== 'Activated').length;
    const ownerCount = new Set(flows.map(f => f.owner).filter(Boolean)).size;

    return (
        <div className="health-page">
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Total Flows</span>
                        <Zap size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : total}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Active</span>
                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : activeCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Draft</span>
                        <XCircle size={16} style={{ color: '#f59e0b' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : draftCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Owners</span>
                        <User size={16} style={{ color: '#60a5fa' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : ownerCount}</span>
                </div>
            </div>

            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Không thể tải dữ liệu</strong><p>{error}</p></div>
                    <button onClick={() => loadData(true)} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            <div className="reports-header">
                <div className="logs-tabs" />
                <div className="reports-header-actions">
                    <div className="reports-search" style={{ width: 220 }}>
                        <Search size={14} className="reports-search-icon" />
                        <input type="text" placeholder="Filter flows..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                    </div>
                    <button onClick={() => loadData(true)} className="billing-refresh-btn" disabled={loading} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {loading && !loaded && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải flows...</p></div>
            )}

            {/* Flow list grouped by owner */}
            {(loaded || flows.length > 0) && (
                <div className="billing-section">
                    <div className="reports-sidebar-list" style={{ maxHeight: 'none' }}>
                        {ownerGroups.map(([owner, items]) => (
                            <div key={owner} className="reports-ws-group">
                                <button className="reports-ws-header" onClick={() => toggleGroup(owner)}>
                                    {expandedGroups[owner] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <span className="reports-ws-name">{owner}</span>
                                    <span className="reports-ws-count">{items.length}</span>
                                </button>

                                {expandedGroups[owner] && (
                                    <div className="billing-table-wrapper" style={{ marginLeft: 0 }}>
                                        <table className="billing-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Status</th>
                                                    <th>Created By</th>
                                                    <th>Modified By</th>
                                                    <th>Created On</th>
                                                    <th>Last Modified</th>
                                                    <th style={{ width: 36 }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map(flow => (
                                                    <tr key={flow.id} className="clickable-row" onClick={() => setSelectedFlow(flow)}>
                                                        <td className="billing-table-name">{flow.name}</td>
                                                        <td>
                                                            <span className="status-badge" style={{
                                                                color: flow.state === 'Activated' ? '#10b981' : '#f59e0b',
                                                                background: flow.state === 'Activated' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                                            }}>
                                                                {flow.state === 'Activated' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                                {flow.stateLabel}
                                                            </span>
                                                        </td>
                                                        <td className="billing-table-type">{flow.createdBy || '—'}</td>
                                                        <td className="billing-table-type">{flow.modifiedBy || '—'}</td>
                                                        <td className="billing-table-type">{formatDate(flow.createdOn)}</td>
                                                        <td className="billing-table-type">{formatDate(flow.lastModified)}</td>
                                                        <td>
                                                            <button
                                                                className="billing-refresh-btn"
                                                                style={{ padding: '4px', lineHeight: 0 }}
                                                                title="Xem Run History"
                                                                onClick={(e) => { e.stopPropagation(); openHistory(flow); }}
                                                            >
                                                                <History size={13} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                        {ownerGroups.length === 0 && !loading && (
                            <div className="billing-loading" style={{ padding: '2rem' }}>
                                <Zap size={24} style={{ opacity: 0.3 }} />
                                <p>{search ? `Không tìm thấy "${search}"` : 'Chưa có flow nào'}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Detail sidebar */}
            {selectedFlow && (
                <>
                    <div className="detail-sidebar-overlay" onClick={() => setSelectedFlow(null)} />
                    <div className="detail-sidebar">
                        <div className="detail-sidebar-header">
                            <h3>{selectedFlow.name}</h3>
                            <button className="detail-sidebar-close" onClick={() => setSelectedFlow(null)} title="Close"><X size={16} /></button>
                        </div>
                        <div className="detail-sidebar-body">
                            <div className="detail-section">
                                <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    Flow Info
                                    <a href={`https://make.powerautomate.com/manage/flows/${selectedFlow.id}/details`}
                                        target="_blank" rel="noopener noreferrer"
                                        title="Mở trong Power Automate"
                                        style={{ color: '#a78bfa', lineHeight: 0 }}
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item">
                                        <div className="meta-label">ID</div>
                                        <div className="meta-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{selectedFlow.id}</div>
                                    </div>
                                    {selectedFlow.solutionId && (
                                        <div className="detail-meta-item">
                                            <div className="meta-label">Solution ID</div>
                                            <div className="meta-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{selectedFlow.solutionId}</div>
                                        </div>
                                    )}
                                    {selectedFlow.description && (
                                        <div className="detail-meta-item">
                                            <div className="meta-label">Description</div>
                                            <div className="meta-value" style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>{selectedFlow.description}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="detail-section">
                                <div className="detail-section-title">People</div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item">
                                        <div className="meta-label">Created By</div>
                                        <div className="meta-value">{selectedFlow.createdBy || '—'}</div>
                                    </div>
                                    <div className="detail-meta-item">
                                        <div className="meta-label">Modified By</div>
                                        <div className="meta-value">{selectedFlow.modifiedBy || '—'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <div className="detail-section-title">Dates</div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item">
                                        <div className="meta-label">Created</div>
                                        <div className="meta-value">{formatDateTime(selectedFlow.createdOn)}</div>
                                    </div>
                                    <div className="detail-meta-item">
                                        <div className="meta-label">Last Modified</div>
                                        <div className="meta-value">{formatDateTime(selectedFlow.lastModified)}</div>
                                    </div>
                                </div>
                            </div>

                            {selectedFlow.clientData && (
                                <div className="detail-section">
                                    <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        Technical Data
                                        <CopyButton text={selectedFlow.clientData} label="JSON" />
                                    </div>
                                    <pre style={{
                                        fontSize: '11px',
                                        lineHeight: 1.4,
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 8,
                                        padding: '10px 12px',
                                        maxHeight: 300,
                                        overflow: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                        color: 'var(--text-secondary)',
                                        margin: 0,
                                    }}>
                                        {(() => { try { return JSON.stringify(JSON.parse(selectedFlow.clientData), null, 2); } catch { return selectedFlow.clientData; } })()}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* History Center Popup */}
            {historyOpen && (
                <>
                    <div className="detail-sidebar-overlay" onClick={() => setHistoryOpen(false)} />
                    <div className="history-modal">
                        <div className="history-modal-header">
                            <h3><History size={16} /> {historyName}</h3>
                            <button className="detail-sidebar-close" onClick={() => setHistoryOpen(false)} title="Close"><X size={16} /></button>
                        </div>
                        <div className="history-modal-body">
                            {/* Search bar */}
                            <div style={{ marginBottom: '0.75rem' }}>
                                <div className="reports-search" style={{ width: '100%' }}>
                                    <Search size={14} className="reports-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Filter by status, trigger, ID..."
                                        value={historySearch}
                                        onChange={e => setHistorySearch(e.target.value)}
                                        className="reports-search-input"
                                    />
                                    {historySearch && (
                                        <button onClick={() => setHistorySearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', lineHeight: 0 }}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {historyLoading ? (
                                <div className="billing-loading" style={{ padding: '2rem' }}>
                                    <RefreshCw size={16} className="spin" />
                                    <p>Đang tải lịch sử...</p>
                                </div>
                            ) : filteredRuns.length > 0 ? (
                                <div className="billing-table-wrapper">
                                    <table className="billing-table">
                                        <thead>
                                            <tr><th>Status</th><th>Trigger</th><th>Started</th><th>Duration</th><th style={{ width: 30 }}></th></tr>
                                        </thead>
                                        <tbody>
                                            {filteredRuns.map(run => {
                                                const isOk = run.status === 'Succeeded';
                                                const isFail = ['Failed', 'Faulted', 'TimedOut', 'Aborted'].includes(run.status);
                                                const duration = run.startedOn && run.completedOn
                                                    ? (() => {
                                                        const ms = new Date(run.completedOn).getTime() - new Date(run.startedOn).getTime();
                                                        if (ms < 1000) return `${ms}ms`;
                                                        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
                                                        return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
                                                    })()
                                                    : '—';
                                                const isExpanded = expandedRunId === run.id;
                                                return (
                                                    <React.Fragment key={run.id}>
                                                        <tr
                                                            className="clickable-row"
                                                            onClick={() => toggleRunExpand(run)}
                                                            title={run.errorMessage || 'Click to view trigger data'}
                                                            style={isExpanded ? { background: 'rgba(167,139,250,0.06)' } : undefined}
                                                        >
                                                            <td>
                                                                <span className="status-badge" style={{
                                                                    color: isOk ? '#10b981' : isFail ? '#ef4444' : '#f59e0b',
                                                                    background: isOk ? 'rgba(16,185,129,0.1)' : isFail ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                                }}>
                                                                    {isOk ? <CheckCircle size={11} /> : isFail ? <XCircle size={11} /> : <Clock size={11} />}
                                                                    {run.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ fontSize: '11px' }}>{run.trigger || '—'}</td>
                                                            <td style={{ fontSize: '11px' }}>{formatDateTime(run.startedOn)}</td>
                                                            <td style={{ fontSize: '11px' }}>{duration}</td>
                                                            <td>
                                                                {isExpanded ? <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />}
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={5} style={{ padding: 0 }}>
                                                                    <div style={{
                                                                        padding: '0.75rem 1rem',
                                                                        background: 'rgba(0,0,0,0.25)',
                                                                        borderTop: '1px solid rgba(255,255,255,0.04)',
                                                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                                    }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                                Trigger Output
                                                                            </span>
                                                                            {triggerOutput && <CopyButton text={JSON.stringify(triggerOutput, null, 2)} label="JSON" />}
                                                                        </div>
                                                                        {triggerLoading ? (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                                                <RefreshCw size={12} className="spin" /> Loading...
                                                                            </div>
                                                                        ) : triggerOutput ? (
                                                                            <pre style={{
                                                                                fontSize: '11px',
                                                                                lineHeight: 1.4,
                                                                                background: 'rgba(0,0,0,0.3)',
                                                                                border: '1px solid rgba(255,255,255,0.06)',
                                                                                borderRadius: 8,
                                                                                padding: '10px 12px',
                                                                                maxHeight: 360,
                                                                                overflow: 'auto',
                                                                                whiteSpace: 'pre-wrap',
                                                                                wordBreak: 'break-all',
                                                                                color: 'var(--text-secondary)',
                                                                                margin: 0,
                                                                            }}>
                                                                                {JSON.stringify(triggerOutput, null, 2)}
                                                                            </pre>
                                                                        ) : (
                                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No trigger output available</div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="billing-loading" style={{ padding: '2rem' }}>
                                    <Clock size={20} style={{ opacity: 0.3 }} />
                                    <p>Chưa có lịch sử chạy</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
