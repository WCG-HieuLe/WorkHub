import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Workflow, RefreshCw, AlertTriangle, Search, X,
    CheckCircle, XCircle, ChevronDown, ChevronRight,
    Layers, Factory, Clock, Users, ExternalLink, History, Database, CalendarClock, Copy, Trash2,
} from 'lucide-react';
import type { Dataflow, FabricItem, FabricWorkspace, FabricDataflowTransaction, FabricRefreshSchedule, DataflowRefreshRun } from '@/services/azure/dataService';
import { fetchDataflows, fetchFabricWorkspaces, fetchFabricItems, fetchDataflowTransactions, fetchDataflowRefreshSchedule, fetchDataflowRefreshHistory, deleteDataflow, deleteFabricDataflow } from '@/services/azure/dataService';
import { acquireToken } from '@/services/azure/tokenService';
import { dataverseConfig, powerBIConfig } from '@/config/authConfig';
import { useApiData } from '@/hooks/useApiData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type TabKey = 'pa' | 'fabric';

export const DataflowPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const [activeTab, setActiveTab] = useState<TabKey>('pa');

    // ── History popup state (center modal) ──
    const [historyName, setHistoryName] = useState('');
    const [historyRuns, setHistoryRuns] = useState<DataflowRefreshRun[]>([]);
    const [historyTransactions, setHistoryTransactions] = useState<FabricDataflowTransaction[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyType, setHistoryType] = useState<'pa' | 'fabric' | null>(null);

    // ── Fabric detail on-demand data ──
    const [fabricSchedule, setFabricSchedule] = useState<FabricRefreshSchedule | null>(null);

    // ── Delete state ──
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<{ type: 'pa'; item: Dataflow } | { type: 'fabric'; item: FabricItem } | null>(null);


    // ── PA state (Dataverse msdyn_dataflows) ──
    const PA_CACHE_KEY = `pa_dataflows_${accounts[0]?.homeAccountId || 'default'}`;
    const { data: paData, loading: paLoading, error: paError, refresh: loadPA, setData: setPaData } = useApiData({
        key: PA_CACHE_KEY,
        fetcher: async () => {
            const token = await acquireToken(instance, accounts[0], dataverseConfig.scopes);
            return await fetchDataflows(token);
        },
        enabled: isAuthenticated && accounts.length > 0 && activeTab === 'pa',
        initialData: { dataflows: [] as Dataflow[], total: 0 }
    });
    
    const paDataflows = paData?.dataflows || [];
    const paTotal = paData?.total || 0;
    const paLoaded = paDataflows.length > 0 || !paLoading;
    
    const [paSearch, setPaSearch] = useState('');
    const [paStatusFilter, setPaStatusFilter] = useState<string>('all');
    const [paScheduleFilter, setPaScheduleFilter] = useState<string>('all');

    // ── Fabric state ──
    const FABRIC_CACHE_KEY = `fabric_dataflows_${accounts[0]?.homeAccountId || 'default'}`;
    const { data: fabricData, loading: fabricLoading, error: fabricError, refresh: loadFabric, setData: setFabricData } = useApiData({
        key: FABRIC_CACHE_KEY,
        fetcher: async () => {
            const pbiToken = await acquireToken(instance, accounts[0], powerBIConfig.scopes);
            const ws = await fetchFabricWorkspaces(pbiToken);
            const allItems = await fetchFabricItems(pbiToken, ws);
            const dataflowsOnly = allItems.filter(item => item.type === 'Dataflow');
            return { workspaces: ws, dataflows: dataflowsOnly };
        },
        enabled: isAuthenticated && accounts.length > 0 && activeTab === 'fabric',
        initialData: { workspaces: [] as FabricWorkspace[], dataflows: [] as FabricItem[] }
    });
    
    const fabricWorkspaces = fabricData?.workspaces || [];
    const fabricDataflows = fabricData?.dataflows || [];
    const fabricLoaded = fabricDataflows.length > 0 || !fabricLoading;
    
    const [fabricSearch, setFabricSearch] = useState('');

    // ── Shared UI state ──
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedPA, setSelectedPA] = useState<Dataflow | null>(null);
    const [selectedFabric, setSelectedFabric] = useState<FabricItem | null>(null);

    // ── Data Loading ──
    // Đã chuyển sang sử dụng hook `useApiData` (Quy chuẩn Wecare Pattern A)

    // ── Open PA History popup (lazy load from Dataverse msdyn_refreshhistory) ──
    const openPAHistory = useCallback(async (df: Dataflow) => {
        setHistoryName(df.name);
        setHistoryType('pa');
        setHistoryRuns([]);
        setHistoryTransactions([]);
        setHistoryLoading(true);
        try {
            const token = await acquireToken(instance, accounts[0], dataverseConfig.scopes);
            const runs = await fetchDataflowRefreshHistory(token, df.id);
            setHistoryRuns(runs);
        } catch (e) {
            console.warn('Failed to load PA dataflow refresh history:', e);
        } finally {
            setHistoryLoading(false);
        }
    }, [instance, accounts]);

    // ── Open Fabric History popup (lazy load) ──
    const openFabricHistory = useCallback(async (item: FabricItem) => {
        setHistoryName(item.name);
        setHistoryType('fabric');
        setHistoryRuns([]);
        setHistoryTransactions([]);
        setHistoryLoading(true);
        try {
            const pbiToken = await acquireToken(instance, accounts[0], powerBIConfig.scopes);
            const txns = await fetchDataflowTransactions(pbiToken, item.workspaceId, item.id);
            setHistoryTransactions(txns);
        } catch (e) {
            console.warn('Failed to load fabric transactions:', e);
        } finally {
            setHistoryLoading(false);
        }
    }, [instance, accounts]);

    // ── Open Fabric detail sidebar (load schedule only) ──
    const openFabricDetail = useCallback(async (item: FabricItem) => {
        setSelectedFabric(item);
        setFabricSchedule(null);
        if (!isAuthenticated || accounts.length === 0) return;
        try {
            const pbiToken = await acquireToken(instance, accounts[0], powerBIConfig.scopes);
            const schedule = await fetchDataflowRefreshSchedule(pbiToken, item.workspaceId, item.id);
            setFabricSchedule(schedule);
        } catch (e) {
            console.warn('Failed to load schedule:', e);
        }
    }, [instance, accounts, isAuthenticated]);

    const closeHistory = () => { setHistoryType(null); };

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => prev[key] ? {} : { [key]: true });
    };

    // ── Delete handlers ──
    const handleDeleteClick = useCallback((type: 'pa' | 'fabric', item: Dataflow | FabricItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmTarget(type === 'pa' ? { type: 'pa', item: item as Dataflow } : { type: 'fabric', item: item as FabricItem });
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!confirmTarget) return;
        try {
            setDeletingId(confirmTarget.item.id);
            if (confirmTarget.type === 'pa') {
                const token = await acquireToken(instance, accounts[0], dataverseConfig.scopes);
                await deleteDataflow(token, confirmTarget.item.id);
                setPaData(prev => ({
                    dataflows: prev.dataflows.filter(d => d.id !== confirmTarget.item.id),
                    total: prev.total - 1
                }));
                if (selectedPA?.id === confirmTarget.item.id) setSelectedPA(null);
            } else {
                const fabricItem = confirmTarget.item as FabricItem;
                const token = await acquireToken(instance, accounts[0], powerBIConfig.scopes);
                await deleteFabricDataflow(token, fabricItem.workspaceId, fabricItem.id);
                setFabricData(prev => ({
                    workspaces: prev.workspaces,
                    dataflows: prev.dataflows.filter(d => d.id !== confirmTarget.item.id)
                }));
                if (selectedFabric?.id === confirmTarget.item.id) setSelectedFabric(null);
            }
            setConfirmTarget(null);
        } catch (err) {
            alert(`Xóa thất bại: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setDeletingId(null);
        }
    }, [confirmTarget, instance, accounts, selectedPA, selectedFabric]);



    // ── PA grouped by owner ──
    const paGroups = useMemo(() => {
        let filtered = paDataflows;
        // Text search
        if (paSearch) {
            const q = paSearch.toLowerCase();
            filtered = filtered.filter(df =>
                df.id.toLowerCase().includes(q) ||
                df.name.toLowerCase().includes(q) ||
                df.owner.toLowerCase().includes(q) ||
                df.entityNames.some(e => e.toLowerCase().includes(q))
            );
        }
        // Status filter
        if (paStatusFilter !== 'all') {
            filtered = filtered.filter(df => {
                if (paStatusFilter === 'none') return !df.lastRefreshStatus;
                return df.lastRefreshStatus?.toLowerCase() === paStatusFilter.toLowerCase();
            });
        }
        // Schedule filter
        if (paScheduleFilter !== 'all') {
            filtered = filtered.filter(df => paScheduleFilter === 'yes' ? df.hasSchedule : !df.hasSchedule);
        }
        const map = new Map<string, Dataflow[]>();
        for (const df of filtered) {
            const key = df.owner || 'Unknown';
            const list = map.get(key) || [];
            list.push(df);
            map.set(key, list);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [paDataflows, paSearch, paStatusFilter, paScheduleFilter]);

    // ── Fabric grouped by workspace ──
    const fabricGroups = useMemo(() => {
        const filtered = fabricSearch
            ? fabricDataflows.filter(df =>
                df.id.toLowerCase().includes(fabricSearch.toLowerCase()) ||
                df.name.toLowerCase().includes(fabricSearch.toLowerCase()) ||
                df.workspaceName.toLowerCase().includes(fabricSearch.toLowerCase())
            )
            : fabricDataflows;
        const map = new Map<string, FabricItem[]>();
        for (const df of filtered) {
            const key = df.workspaceName || 'Unknown';
            const list = map.get(key) || [];
            list.push(df);
            map.set(key, list);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [fabricDataflows, fabricSearch]);

    // ── Derived stats ──
    const paOwnerCount = new Set(paDataflows.map(d => d.owner).filter(Boolean)).size;
    const paScheduledCount = paDataflows.filter(df => df.hasSchedule).length;

    // ── Active tab helpers ──
    const isPA = activeTab === 'pa';

    // Auto-open 'Operation' group by default
    useEffect(() => {
        if (Object.keys(expandedGroups).length > 0) return;
        const groups = isPA ? paGroups : fabricGroups;
        if (groups.length === 0) return;
        const opGroup = groups.find(([name]) => name.toLowerCase().includes('operation'));
        if (opGroup) setExpandedGroups({ [opGroup[0]]: true });
        else setExpandedGroups({ [groups[0][0]]: true });
    }, [paGroups, fabricGroups, isPA]);

    const loading = isPA ? paLoading : fabricLoading;
    const loaded = isPA ? paLoaded || paDataflows.length > 0 : fabricLoaded || fabricDataflows.length > 0;
    const error = isPA ? paError : fabricError;
    const search = isPA ? paSearch : fabricSearch;
    const setSearch = isPA ? setPaSearch : setFabricSearch;
    const reload = isPA ? loadPA : loadFabric;

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Total Dataflows</span>
                        <Workflow size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : isPA ? paTotal : fabricDataflows.length}</span>
                </div>
                {isPA ? (
                    <div className="billing-stat-card">
                        <div className="billing-stat-header">
                            <span className="billing-stat-label">Owners</span>
                            <Workflow size={16} style={{ color: '#60a5fa' }} />
                        </div>
                        <span className="billing-stat-value">{paLoading && !paLoaded ? '...' : paOwnerCount}</span>
                    </div>
                ) : null}
                {isPA ? (
                    <div className="billing-stat-card">
                        <div className="billing-stat-header">
                            <span className="billing-stat-label">Scheduled</span>
                            <CalendarClock size={16} style={{ color: '#f59e0b' }} />
                        </div>
                        <span className="billing-stat-value">{paLoading && !paLoaded ? '...' : paScheduledCount}</span>
                    </div>
                ) : (
                    <div className="billing-stat-card">
                        <div className="billing-stat-header">
                            <span className="billing-stat-label">Workspaces</span>
                            <Factory size={16} style={{ color: '#60a5fa' }} />
                        </div>
                        <span className="billing-stat-value">{fabricLoading && !fabricLoaded ? '...' : fabricWorkspaces.length}</span>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Không thể tải dữ liệu</strong><p>{error}</p></div>
                    <button onClick={() => reload()} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            {/* Header: tabs + search + refresh */}
            <div className="reports-header">
                <div className="logs-tabs">
                    <button className={`logs-tab ${activeTab === 'pa' ? 'active' : ''}`} onClick={() => setActiveTab('pa')}>
                        <Workflow size={14} /> Power Apps
                    </button>
                    <button className={`logs-tab ${activeTab === 'fabric' ? 'active' : ''}`} onClick={() => setActiveTab('fabric')}>
                        <Layers size={14} /> Fabric
                    </button>
                </div>
                <div className="reports-header-actions">
                    {isPA && (
                        <div className="filter-chips">
                            <button className={`filter-chip ${paStatusFilter === 'Success' ? 'filter-chip--active filter-chip--success' : ''}`} onClick={() => setPaStatusFilter(v => v === 'Success' ? 'all' : 'Success')}>
                                <CheckCircle size={12} /> Success
                            </button>
                            <button className={`filter-chip ${paStatusFilter === 'Failed' ? 'filter-chip--active filter-chip--danger' : ''}`} onClick={() => setPaStatusFilter(v => v === 'Failed' ? 'all' : 'Failed')}>
                                <XCircle size={12} /> Failed
                            </button>
                            <button className={`filter-chip ${paScheduleFilter === 'yes' ? 'filter-chip--active filter-chip--warn' : ''}`} onClick={() => setPaScheduleFilter(v => v === 'yes' ? 'all' : 'yes')}>
                                <CalendarClock size={12} /> Scheduled
                            </button>
                        </div>
                    )}
                    <div className="reports-search" style={{ width: 220 }}>
                        <Search size={14} className="reports-search-icon" />
                        <input type="text" placeholder="Filter dataflows..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                    </div>
                    <button onClick={() => reload()} className="billing-refresh-btn" disabled={loading} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                    {isPA && paGroups.length > 0 && (
                        <button
                            className="billing-refresh-btn"
                            title="Copy danh sách đang filter"
                            onClick={() => {
                                const allDfs = paGroups.flatMap(([, items]) => items);
                                const sections = paGroups.map(([owner, items]) => {
                                    const lines = items.map(df =>
                                        `- ${df.name} | Last Refresh: ${df.lastRefreshTime ? formatDateTime(df.lastRefreshTime) : '—'} | Schedule: ${df.hasSchedule ? 'Yes' : 'No'}`
                                    );
                                    return `Owner: ${owner}\n${lines.join('\n')}`;
                                });
                                const text = `Dataflow Report (${allDfs.length} items)\n${'—'.repeat(40)}\n\n${sections.join('\n\n')}`;
                                navigator.clipboard.writeText(text);
                            }}
                        >
                            <Copy size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Loading */}
            {loading && !loaded && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải dataflows...</p></div>
            )}

            {/* ── PA Tab Content ── */}
            {isPA && (paLoaded || paDataflows.length > 0) && (
                <div className="billing-section">
                    <div className="reports-sidebar-list" style={{ maxHeight: 'none' }}>
                        {paGroups.map(([owner, items]) => (
                            <div key={owner} className="reports-ws-group">
                                <button className="reports-ws-header" onClick={() => toggleGroup(owner)}>
                                    {expandedGroups[owner] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <span className="reports-ws-name">{owner}</span>
                                    <span className="reports-ws-count">{items.length}</span>
                                </button>
                                {expandedGroups[owner] && (
                                    <div className="billing-table-wrapper" style={{ marginLeft: 0 }}>
                                        <table className="billing-table">
                                            <thead><tr><th>Name</th><th>Entities</th><th>Last Status</th><th>Last Refresh</th><th>Schedule</th><th>Modified By</th><th>Modified On</th><th style={{ width: 70 }}></th></tr></thead>
                                            <tbody>
                                                {items.map(df => (
                                                    <tr key={df.id} className="clickable-row" onClick={() => setSelectedPA(df)}>
                                                        <td className="billing-table-name">{df.name}</td>
                                                        <td style={{ fontSize: '11px', maxWidth: 200 }}>
                                                            {df.entityNames.length > 0 ? (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                                                    {df.entityNames.map(e => (
                                                                        <span key={e} style={{
                                                                            fontSize: '10px',
                                                                            padding: '1px 6px',
                                                                            borderRadius: '4px',
                                                                            background: 'rgba(167,139,250,0.1)',
                                                                            color: '#a78bfa',
                                                                            border: '1px solid rgba(167,139,250,0.15)',
                                                                            whiteSpace: 'nowrap',
                                                                        }}>{e}</span>
                                                                    ))}
                                                                </div>
                                                            ) : '—'}
                                                        </td>
                                                        <td>
                                                            {df.lastRefreshStatus ? (
                                                                <span className={`status-badge ${df.lastRefreshStatus === 'Success' ? 'status-badge--success' : df.lastRefreshStatus === 'Failed' ? 'status-badge--danger' : 'status-badge--warn'}`}>
                                                                    {df.lastRefreshStatus === 'Success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                                    {df.lastRefreshStatus}
                                                                </span>
                                                            ) : <span className="text-muted">—</span>}
                                                        </td>
                                                        <td className="billing-table-type">{df.lastRefreshTime ? formatDateTime(df.lastRefreshTime) : '—'}</td>
                                                        <td>
                                                            {df.hasSchedule ? (
                                                                <span className="status-badge" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
                                                                    <CalendarClock size={12} /> Yes
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                                                            )}
                                                        </td>
                                                        <td className="billing-table-type">{df.modifiedBy || '—'}</td>
                                                        <td className="billing-table-type">{formatDate(df.lastModified)}</td>
                                                        <td style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                            <button
                                                                className="billing-refresh-btn"
                                                                style={{ padding: '4px', lineHeight: 0 }}
                                                                title="Xem Run History"
                                                                onClick={(e) => { e.stopPropagation(); openPAHistory(df); }}
                                                            >
                                                                <History size={13} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteClick('pa', df, e)}
                                                                disabled={deletingId === df.id}
                                                                title="Xóa dataflow"
                                                                style={{
                                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                                    color: 'var(--text-secondary)', padding: 4, borderRadius: 4,
                                                                    opacity: deletingId === df.id ? 0.3 : 0.5,
                                                                    transition: 'all 0.15s',
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                                            >
                                                                {deletingId === df.id ? <RefreshCw size={13} className="spin" /> : <Trash2 size={13} />}
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
                        {paGroups.length === 0 && !paLoading && (
                            <div className="billing-loading" style={{ padding: '2rem' }}>
                                <Workflow size={24} style={{ opacity: 0.3 }} />
                                <p>{paSearch ? `Không tìm thấy "${paSearch}"` : 'Chưa có Dataflow nào'}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Fabric Tab Content ── */}
            {!isPA && (fabricLoaded || fabricDataflows.length > 0) && (
                <div className="billing-section">
                    <div className="reports-sidebar-list" style={{ maxHeight: 'none' }}>
                        {fabricGroups.map(([wsName, items]) => (
                            <div key={wsName} className="reports-ws-group">
                                <button className="reports-ws-header" onClick={() => toggleGroup(wsName)}>
                                    {expandedGroups[wsName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <span className="reports-ws-name">{wsName}</span>
                                    <span className="reports-ws-count">{items.length}</span>
                                </button>
                                {expandedGroups[wsName] && (
                                    <div className="billing-table-wrapper" style={{ marginLeft: 0 }}>
                                        <table className="billing-table">
                                            <thead><tr><th>Name</th><th>Configured By</th><th>Refreshable</th><th style={{ width: 70 }}></th></tr></thead>
                                            <tbody>
                                                {items.map(df => (
                                                    <tr key={df.id} className="clickable-row" onClick={() => openFabricDetail(df)}>
                                                        <td className="billing-table-name">{df.name}</td>
                                                        <td className="billing-table-type">{df.configuredBy || '—'}</td>
                                                        <td>{df.isRefreshable ? <CheckCircle size={14} style={{ color: '#10b981' }} /> : <XCircle size={14} style={{ color: '#71717a' }} />}</td>
                                                        <td style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                            <button
                                                                className="billing-refresh-btn"
                                                                style={{ padding: '4px', lineHeight: 0 }}
                                                                title="Xem Refresh History"
                                                                onClick={(e) => { e.stopPropagation(); openFabricHistory(df); }}
                                                            >
                                                                <History size={13} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteClick('fabric', df, e)}
                                                                disabled={deletingId === df.id}
                                                                title="Xóa dataflow"
                                                                style={{
                                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                                    color: 'var(--text-secondary)', padding: 4, borderRadius: 4,
                                                                    opacity: deletingId === df.id ? 0.3 : 0.5,
                                                                    transition: 'all 0.15s',
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                                            >
                                                                {deletingId === df.id ? <RefreshCw size={13} className="spin" /> : <Trash2 size={13} />}
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
                        {fabricGroups.length === 0 && !fabricLoading && (
                            <div className="billing-loading" style={{ padding: '2rem' }}>
                                <Layers size={24} style={{ opacity: 0.3 }} />
                                <p>{fabricSearch ? `Không tìm thấy "${fabricSearch}"` : 'Chưa có Dataflow nào'}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── PA Detail Sidebar ── */}
            {selectedPA && (
                <>
                    <div className="detail-sidebar-overlay" onClick={() => setSelectedPA(null)} />
                    <div className="detail-sidebar">
                        <div className="detail-sidebar-header">
                            <h3>{selectedPA.name}</h3>
                            <button className="detail-sidebar-close" onClick={() => setSelectedPA(null)} title="Close"><X size={16} /></button>
                        </div>
                        <div className="detail-sidebar-body">
                            {/* Basic Info */}
                            <div className="detail-section">
                                <div className="detail-section-title detail-section-title--flex">
                                    Dataflow Info
                                    <a href={`https://make.powerapps.com/environments/de210e4b-cd22-e605-91ca-8e841aad4b8e/dataflows/${selectedPA.id}/details`}
                                        target="_blank" rel="noopener noreferrer"
                                        title="Mở trong Power Apps"
                                        className="detail-ext-link"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item detail-meta-item--full"><div className="meta-label">ID</div><div className="meta-value meta-value--mono">{selectedPA.id}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Category</div><div className="meta-value">{selectedPA.category || 'Dataflow'}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Created By</div><div className="meta-value">{selectedPA.createdBy || '—'}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Created On</div><div className="meta-value">{formatDate(selectedPA.createdOn)}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Status</div><div className="meta-value">
                                        <span className={`status-badge ${(selectedPA.state === 'Activated' || selectedPA.state === 'Active') ? 'status-badge--success' : 'status-badge--warn'}`}>
                                            {(selectedPA.state === 'Activated' || selectedPA.state === 'Active') ? <CheckCircle size={11} /> : <XCircle size={11} />}
                                            {selectedPA.stateLabel}
                                        </span>
                                    </div></div>
                                </div>
                            </div>

                            {/* Entities */}
                            {selectedPA.entityNames.length > 0 && (
                                <div className="detail-section">
                                    <div className="detail-section-title"><Database size={12} className="detail-section-icon" />Entities ({selectedPA.entityNames.length})</div>
                                    <div className="detail-entity-tags">
                                        {selectedPA.entityNames.map(e => (
                                            <span key={e} className="detail-entity-tag">{e}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Refresh Schedule Info */}
                            <div className="detail-section">
                                <div className="detail-section-title"><CalendarClock size={12} className="detail-section-icon" />Refresh Schedule</div>
                                {selectedPA.hasSchedule ? (
                                    <div className="detail-schedule-info">
                                        <div className="detail-schedule-badge">
                                            <CalendarClock size={14} />
                                            <span>Scheduled — detected from history</span>
                                        </div>
                                        <div className="detail-meta-grid">
                                            {selectedPA.lastRefreshType && (
                                                <div className="detail-meta-item"><div className="meta-label">Refresh Type</div><div className="meta-value">{selectedPA.lastRefreshType}</div></div>
                                            )}
                                            {selectedPA.lastRefreshStatus && (
                                                <div className="detail-meta-item">
                                                    <div className="meta-label">Last Status</div>
                                                    <div className="meta-value">
                                                        <span className={`status-badge ${selectedPA.lastRefreshStatus === 'Success' ? 'status-badge--success' : selectedPA.lastRefreshStatus === 'Failed' ? 'status-badge--danger' : 'status-badge--warn'}`}>
                                                            {selectedPA.lastRefreshStatus === 'Success' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                                                            {selectedPA.lastRefreshStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedPA.lastRefreshTime && (
                                                <div className="detail-meta-item detail-meta-item--full"><div className="meta-label">Last Refresh</div><div className="meta-value">{formatDateTime(selectedPA.lastRefreshTime)}</div></div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="detail-empty-text">Không phát hiện lịch refresh (chỉ chạy thủ công)</p>
                                )}
                            </div>

                            {/* Description */}
                            {selectedPA.description && (
                                <div className="detail-section">
                                    <div className="detail-section-title">Description</div>
                                    <p className="detail-description">{selectedPA.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── Fabric Detail Sidebar ── */}
            {selectedFabric && (
                <>
                    <div className="detail-sidebar-overlay" onClick={() => setSelectedFabric(null)} />
                    <div className="detail-sidebar">
                        <div className="detail-sidebar-header">
                            <h3>{selectedFabric.name}</h3>
                            <button className="detail-sidebar-close" onClick={() => setSelectedFabric(null)} title="Close"><X size={16} /></button>
                        </div>
                        <div className="detail-sidebar-body">
                            {/* Basic Info */}
                            <div className="detail-section">
                                <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    Dataflow Info
                                    <a href={`https://app.fabric.microsoft.com/groups/${selectedFabric.workspaceId}/dataflows/${selectedFabric.id}`}
                                        target="_blank" rel="noopener noreferrer"
                                        title="Mở trong Fabric"
                                        style={{ color: '#a78bfa', lineHeight: 0 }}
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item"><div className="meta-label">ID</div><div className="meta-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{selectedFabric.id}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Workspace</div><div className="meta-value">{selectedFabric.workspaceName}</div></div>

                                    <div className="detail-meta-item"><div className="meta-label">Modified By</div><div className="meta-value">{selectedFabric.modifiedBy || '—'}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Modified</div><div className="meta-value">{formatDateTime(selectedFabric.modifiedDateTime)}</div></div>

                                    {selectedFabric.modelUrl && (
                                        <div className="detail-meta-item"><div className="meta-label">Model URL</div><div className="meta-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{selectedFabric.modelUrl}</div></div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {selectedFabric.description && (
                                <div className="detail-section">
                                    <div className="detail-section-title">Description</div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedFabric.description}</p>
                                </div>
                            )}

                            {/* Data Sources */}
                            {selectedFabric.datasourceUsages?.length > 0 && (
                                <div className="detail-section">
                                    <div className="detail-section-title"><Database size={12} style={{ display: 'inline', marginRight: 4 }} />Data Sources ({selectedFabric.datasourceUsages.length})</div>
                                    <div className="detail-meta-grid">
                                        {selectedFabric.datasourceUsages.map((ds, i) => (
                                            <div key={i} className="detail-meta-item" style={{ gridColumn: '1 / -1' }}>
                                                <div className="meta-label">{ds.datasourceType || 'Unknown'}</div>
                                                <div className="meta-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                                                    {Object.entries(ds.connectionDetails).map(([k, v]) => (
                                                        <div key={k}><span style={{ color: 'var(--text-muted)' }}>{k}:</span> {v}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upstream Dataflows */}
                            {selectedFabric.upstreamDataflows?.length > 0 && (
                                <div className="detail-section">
                                    <div className="detail-section-title"><Workflow size={12} style={{ display: 'inline', marginRight: 4 }} />Upstream Dataflows ({selectedFabric.upstreamDataflows.length})</div>
                                    <div className="detail-meta-grid">
                                        {selectedFabric.upstreamDataflows.map((ud, i) => {
                                            const upstream = fabricDataflows.find(df => df.id === ud.targetDataflowId);
                                            return (
                                                <div key={i} className="detail-meta-item" style={{ gridColumn: '1 / -1' }}>
                                                    <div className="meta-label">Depends on</div>
                                                    <div className="meta-value" style={{ fontSize: '11px' }}>
                                                        {upstream ? upstream.name : ud.targetDataflowId}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Users */}
                            {selectedFabric.users.length > 0 && (
                                <div className="detail-section">
                                    <div className="detail-section-title"><Users size={12} style={{ display: 'inline', marginRight: 4 }} />Users ({selectedFabric.users.length})</div>
                                    <div className="detail-user-list">
                                        {selectedFabric.users.map((u, i) => (
                                            <div key={i} className="detail-user-item">
                                                <div className="detail-user-avatar">{(u.displayName || u.emailAddress).charAt(0).toUpperCase()}</div>
                                                <div className="detail-user-info">
                                                    <div className="user-name">{u.displayName || u.emailAddress}</div>
                                                    <div className="user-email">{u.emailAddress} · {u.dataflowUserAccessRight}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Refresh Schedule */}
                            <div className="detail-section">
                                <div className="detail-section-title"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Refresh Schedule</div>
                                {fabricSchedule ? (
                                    <div className="detail-meta-grid">
                                        <div className="detail-meta-item"><div className="meta-label">Enabled</div><div className="meta-value">
                                            {fabricSchedule.enabled
                                                ? <span className="status-badge" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}><CheckCircle size={12} /> Yes</span>
                                                : <span className="status-badge" style={{ color: '#71717a', background: 'rgba(113,113,122,0.1)' }}><XCircle size={12} /> No</span>
                                            }
                                        </div></div>
                                        <div className="detail-meta-item"><div className="meta-label">Timezone</div><div className="meta-value" style={{ fontSize: '11px' }}>{fabricSchedule.localTimeZoneId || '—'}</div></div>
                                        {fabricSchedule.days.length > 0 && (
                                            <div className="detail-meta-item"><div className="meta-label">Days</div><div className="meta-value" style={{ fontSize: '11px' }}>{fabricSchedule.days.join(', ')}</div></div>
                                        )}
                                        {fabricSchedule.times.length > 0 && (
                                            <div className="detail-meta-item"><div className="meta-label">Times</div><div className="meta-value" style={{ fontSize: '11px' }}>{fabricSchedule.times.join(', ')}</div></div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Không có lịch refresh</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── History Center Popup ── */}
            {historyType && (
                <>
                    <div className="detail-sidebar-overlay" onClick={closeHistory} />
                    <div className="history-modal">
                        <div className="history-modal-header">
                            <h3><History size={16} /> {historyName}</h3>
                            <button className="detail-sidebar-close" onClick={closeHistory} title="Close"><X size={16} /></button>
                        </div>
                        <div className="history-modal-body">
                            {historyLoading ? (
                                <div className="billing-loading" style={{ padding: '2rem' }}>
                                    <RefreshCw size={16} className="spin" />
                                    <p>Đang tải lịch sử...</p>
                                </div>
                            ) : historyType === 'pa' ? (
                                historyRuns.length > 0 ? (
                                    <div className="billing-table-wrapper">
                                        <table className="billing-table">
                                            <thead>
                                                <tr><th>Status</th><th>Trigger</th><th>Entity</th><th>Started</th><th>Duration</th><th>Rows</th><th>Inserted</th></tr>
                                            </thead>
                                            <tbody>
                                                {historyRuns.map(run => {
                                                    const isOk = run.status === 'Success' || run.status === 'Succeeded';
                                                    const isFail = ['Failed', 'Faulted', 'TimedOut', 'Aborted'].includes(run.status);
                                                    const duration = run.startedOn && run.completedOn
                                                        ? (() => {
                                                            const ms = new Date(run.completedOn).getTime() - new Date(run.startedOn).getTime();
                                                            if (ms < 1000) return `${ms}ms`;
                                                            if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
                                                            return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
                                                        })()
                                                        : '—';
                                                    return (
                                                        <tr key={run.id} title={run.errorMessage || ''}>
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
                                                            <td style={{ fontSize: '11px' }}>{run.entityName || '—'}</td>
                                                            <td style={{ fontSize: '11px' }}>{formatDateTime(run.startedOn)}</td>
                                                            <td style={{ fontSize: '11px' }}>{duration}</td>
                                                            <td style={{ fontSize: '11px' }}>{run.rowsRead > 0 ? run.rowsRead.toLocaleString() : '—'}</td>
                                                            <td style={{ fontSize: '11px' }}>{run.insertCount > 0 ? run.insertCount.toLocaleString() : '—'}</td>
                                                        </tr>
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
                                )
                            ) : (
                                historyTransactions.length > 0 ? (
                                    <div className="billing-table-wrapper">
                                        <table className="billing-table">
                                            <thead>
                                                <tr><th>Type</th><th>Status</th><th>Start</th><th>End</th></tr>
                                            </thead>
                                            <tbody>
                                                {historyTransactions.map(t => (
                                                    <tr key={t.id}>
                                                        <td className="billing-table-type">{t.refreshType}</td>
                                                        <td>
                                                            <span className="status-badge" style={{
                                                                color: t.status === 'Success' ? '#10b981' : t.status === 'Failed' ? '#ef4444' : '#f59e0b',
                                                                background: t.status === 'Success' ? 'rgba(16,185,129,0.1)' : t.status === 'Failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                            }}>
                                                                {t.status === 'Success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                                {t.status}
                                                            </span>
                                                        </td>
                                                        <td className="billing-table-type">{formatDateTime(t.startTime)}</td>
                                                        <td className="billing-table-type">{formatDateTime(t.endTime)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="billing-loading" style={{ padding: '2rem' }}>
                                        <Clock size={20} style={{ opacity: 0.3 }} />
                                        <p>Chưa có lịch sử refresh</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Confirm delete dialog */}
            <ConfirmDialog
                open={!!confirmTarget}
                title={`Xóa dataflow "${confirmTarget?.item.name || ''}"?`}
                confirmLabel="Xóa"
                variant="danger"
                loading={!!deletingId}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
};
