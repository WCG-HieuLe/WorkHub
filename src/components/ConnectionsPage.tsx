import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Plug, RefreshCw, AlertTriangle, Search,
    X, CheckCircle, XCircle, ChevronDown, ChevronRight,
    Zap, ExternalLink, Trash2,
} from 'lucide-react';
import type { ConnectionInfo } from '@/services/azure/connectionService';
import { fetchConnections, deleteConnection } from '@/services/azure/connectionService';
import { acquireToken } from '@/services/azure/tokenService';
import { powerAppsConfig, PP_ENV_ID } from '@/config/authConfig';
import { useApiData } from '@/hooks/useApiData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type FilterMode = 'all' | 'connected' | 'error';

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getConnectionUrl(connId: string): string {
    return `https://make.powerapps.com/environments/${PP_ENV_ID}/connections/${connId}/details`;
}

export const ConnectionsPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const CACHE_KEY = `connections_${accounts[0]?.homeAccountId || 'default'}`;
    const { data: apiData, loading, error, refresh: loadData, setData: setConnections } = useApiData({
        key: CACHE_KEY,
        fetcher: async () => {
            const token = await acquireToken(instance, accounts[0], powerAppsConfig.scopes);
            return await fetchConnections(token);
        },
        enabled: isAuthenticated && accounts.length > 0,
        initialData: [] as ConnectionInfo[]
    });

    const connections = apiData || [];

    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedItem, setSelectedItem] = useState<ConnectionInfo | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<ConnectionInfo | null>(null);

    // ─── Data Loading ───
    // Đã chuyển sang sử dụng hook `useApiData` (Quy chuẩn Wecare Pattern A)

    const handleDeleteClick = useCallback((conn: ConnectionInfo, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmTarget(conn);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!confirmTarget) return;
        try {
            setDeletingId(confirmTarget.id);
            const token = await acquireToken(instance, accounts[0], powerAppsConfig.scopes);
            await deleteConnection(token, confirmTarget.connectorName, confirmTarget.id);
            setConnections(prev => prev.filter(c => c.id !== confirmTarget.id));
            if (selectedItem?.id === confirmTarget.id) setSelectedItem(null);
            setConfirmTarget(null);
        } catch (err) {
            alert(`Xóa thất bại: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setDeletingId(null);
        }
    }, [confirmTarget, instance, accounts, selectedItem]);

    // Stats
    const connectedCount = connections.filter(c => c.overallStatus === 'Connected').length;
    const errorCount = connections.filter(c => c.overallStatus === 'Error').length;
    const uniqueConnectors = new Set(connections.map(c => c.connectorName)).size;

    // Filter + search
    const filteredConnections = useMemo(() => {
        let result = connections;
        if (filterMode === 'connected') result = result.filter(c => c.overallStatus === 'Connected');
        if (filterMode === 'error') result = result.filter(c => c.overallStatus === 'Error');
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                c.displayName.toLowerCase().includes(q) ||
                c.connectorDisplayName.toLowerCase().includes(q) ||
                c.createdBy.displayName.toLowerCase().includes(q) ||
                c.createdBy.email.toLowerCase().includes(q)
            );
        }
        return result;
    }, [connections, filterMode, search]);

    // Group by connector type
    const connectorGroups = useMemo(() => {
        const map = new Map<string, ConnectionInfo[]>();
        for (const conn of filteredConnections) {
            const key = conn.connectorDisplayName || 'Other';
            const list = map.get(key) || [];
            list.push(conn);
            map.set(key, list);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredConnections]);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Auto-expand groups with errors
    useEffect(() => {
        if ((connections.length > 0 || !loading) && Object.keys(expandedGroups).length === 0) {
            const initial: Record<string, boolean> = {};
            connectorGroups.forEach(([key, items]) => {
                initial[key] = items.some(c => c.overallStatus === 'Error');
            });
            // If none have errors, expand first group
            if (!Object.values(initial).some(v => v) && connectorGroups.length > 0) {
                initial[connectorGroups[0][0]] = true;
            }
            setExpandedGroups(initial);
        }
    }, [connectorGroups, loading, connections.length]);

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Total Connections</span>
                        <Plug size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <span className="billing-stat-value">{loading && connections.length === 0 ? '...' : connections.length}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Connected</span>
                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                    </div>
                    <span className="billing-stat-value">{loading && connections.length === 0 ? '...' : connectedCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Error / Expired</span>
                        <XCircle size={16} style={{ color: '#ef4444' }} />
                    </div>
                    <span className="billing-stat-value" style={errorCount > 0 ? { color: '#ef4444' } : {}}>{loading && connections.length === 0 ? '...' : errorCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Connector Types</span>
                        <Zap size={16} style={{ color: '#f59e0b' }} />
                    </div>
                    <span className="billing-stat-value">{loading && connections.length === 0 ? '...' : uniqueConnectors}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Không thể tải dữ liệu</strong><p>{error}</p></div>
                    <button onClick={() => loadData()} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            {/* Header: filter chips + search + refresh */}
            <div className="reports-header">
                <div className="logs-tabs" />
                <div className="reports-header-actions">
                    <div className="filter-chips">
                        <button
                            className={`filter-chip ${filterMode === 'all' ? 'filter-chip--active' : ''}`}
                            onClick={() => setFilterMode('all')}
                        >
                            All ({connections.length})
                        </button>
                        <button
                            className={`filter-chip ${filterMode === 'connected' ? 'filter-chip--active filter-chip--success' : ''}`}
                            onClick={() => setFilterMode('connected')}
                        >
                            <CheckCircle size={12} /> Connected ({connectedCount})
                        </button>
                        <button
                            className={`filter-chip ${filterMode === 'error' ? 'filter-chip--active filter-chip--danger' : ''}`}
                            onClick={() => setFilterMode('error')}
                        >
                            <XCircle size={12} /> Error ({errorCount})
                        </button>
                    </div>
                    <div className="reports-search" style={{ width: 220 }}>
                        <Search size={14} className="reports-search-icon" />
                        <input type="text" placeholder="Filter connections..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                    </div>
                    <button onClick={() => loadData()} className="billing-refresh-btn" disabled={loading} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && connections.length === 0 && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải connections...</p></div>
            )}

            {/* Connection list grouped by connector */}
            {(connections.length > 0 || (!loading && connections.length === 0)) && (
                <div className="billing-section">
                    <div className="reports-sidebar-list" style={{ maxHeight: 'none' }}>
                        {connectorGroups.map(([connector, items]) => {
                            const groupErrors = items.filter(c => c.overallStatus === 'Error').length;
                            return (
                                <div key={connector} className="reports-ws-group">
                                    <button className="reports-ws-header" onClick={() => toggleGroup(connector)}>
                                        {expandedGroups[connector] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        {items[0]?.iconUri && (
                                            <img src={items[0].iconUri} alt="" style={{ width: 16, height: 16, borderRadius: 3 }} />
                                        )}
                                        <span className="reports-ws-name">{connector}</span>
                                        <span className="reports-ws-count">{items.length}</span>
                                        {groupErrors > 0 && (
                                            <span className="status-badge" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', fontSize: '0.65rem', marginLeft: 4 }}>
                                                <XCircle size={10} /> {groupErrors}
                                            </span>
                                        )}
                                    </button>

                                    {expandedGroups[connector] && (
                                        <div className="billing-table-wrapper" style={{ marginLeft: 0 }}>
                                            <table className="billing-table">
                                                <thead>
                                                    <tr>
                                                        <th>Display Name</th>
                                                        <th>Status</th>
                                                        <th>Owner</th>
                                                        <th>Created</th>
                                                        <th>Last Modified</th>
                                                        <th style={{ width: 40, textAlign: 'center' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map(conn => (
                                                        <tr key={conn.id} className="clickable-row" onClick={() => setSelectedItem(conn)}>
                                                            <td className="billing-table-name">{conn.displayName}</td>
                                                            <td>
                                                                <span className="status-badge" style={{
                                                                    color: conn.overallStatus === 'Connected' ? '#10b981' : '#ef4444',
                                                                    background: conn.overallStatus === 'Connected' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                                }}>
                                                                    {conn.overallStatus === 'Connected' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                                    {conn.overallStatus}
                                                                </span>
                                                            </td>
                                                            <td className="billing-table-type">{conn.createdBy.displayName || conn.createdBy.email || '—'}</td>
                                                            <td className="billing-table-type">{formatDate(conn.createdTime)}</td>
                                                            <td className="billing-table-type">{formatDate(conn.lastModifiedTime)}</td>
                                                            <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                                                <button
                                                                    onClick={(e) => handleDeleteClick(conn, e)}
                                                                    disabled={deletingId === conn.id}
                                                                    title="Xóa connection"
                                                                    style={{
                                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                                        color: 'var(--text-secondary)', padding: 4, borderRadius: 4,
                                                                        opacity: deletingId === conn.id ? 0.3 : 0.5,
                                                                        transition: 'all 0.15s',
                                                                    }}
                                                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                                                >
                                                                    {deletingId === conn.id ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {connectorGroups.length === 0 && !loading && (
                            <div className="billing-loading" style={{ padding: '2rem' }}>
                                <Plug size={24} style={{ opacity: 0.3 }} />
                                <p>{search ? `Không tìm thấy "${search}"` : 'Không có connections nào'}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Detail sidebar */}
            {selectedItem && (
                <>
                    <div className="detail-sidebar-overlay" onClick={() => setSelectedItem(null)} />
                    <div className="detail-sidebar">
                        <div className="detail-sidebar-header">
                            <h3>{selectedItem.displayName}</h3>
                            <button className="detail-sidebar-close" onClick={() => setSelectedItem(null)} title="Close"><X size={16} /></button>
                        </div>
                        <div className="detail-sidebar-body">
                            <div className="detail-section">
                                <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    Connection Info
                                    <a href={getConnectionUrl(selectedItem.id)}
                                        target="_blank" rel="noopener noreferrer"
                                        title="Mở trong Power Apps Portal"
                                        style={{ color: '#a78bfa', lineHeight: 0 }}
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item"><div className="meta-label">Name</div><div className="meta-value">{selectedItem.displayName}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Connection ID</div><div className="meta-value" style={{ fontSize: '0.72rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>{selectedItem.id}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Connector</div><div className="meta-value">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {selectedItem.iconUri && <img src={selectedItem.iconUri} alt="" style={{ width: 14, height: 14, borderRadius: 2 }} />}
                                            {selectedItem.connectorDisplayName}
                                        </span>
                                    </div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Status</div><div className="meta-value">
                                        <span className="status-badge" style={{
                                            color: selectedItem.overallStatus === 'Connected' ? '#10b981' : '#ef4444',
                                            background: selectedItem.overallStatus === 'Connected' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        }}>
                                            {selectedItem.overallStatus === 'Connected' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {selectedItem.overallStatus}
                                        </span>
                                    </div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Created</div><div className="meta-value">{formatDate(selectedItem.createdTime)}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Last Modified</div><div className="meta-value">{formatDate(selectedItem.lastModifiedTime)}</div></div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <div className="detail-section-title">Owner</div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item"><div className="meta-label">Name</div><div className="meta-value">{selectedItem.createdBy.displayName || '—'}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Email</div><div className="meta-value">{selectedItem.createdBy.email || '—'}</div></div>
                                </div>
                            </div>

                            {/* Status details */}
                            {selectedItem.statuses.length > 0 && (
                                <div className="detail-section">
                                    <div className="detail-section-title">Status Details ({selectedItem.statuses.length})</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {selectedItem.statuses.map((s, i) => (
                                            <div key={i} style={{
                                                padding: '8px 10px', borderRadius: 6, fontSize: '0.75rem',
                                                background: s.status === 'Error' ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: s.error ? 4 : 0 }}>
                                                    {s.status === 'Connected' ? <CheckCircle size={12} style={{ color: '#10b981' }} /> : <XCircle size={12} style={{ color: '#ef4444' }} />}
                                                    <span style={{ color: 'var(--text-primary)' }}>{s.status}</span>
                                                </div>
                                                {s.error && (
                                                    <div style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                                                        <span style={{ color: '#ef4444' }}>{s.error.code}</span>: {s.error.message}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Confirm delete dialog */}
            <ConfirmDialog
                open={!!confirmTarget}
                title={`Xóa connection "${confirmTarget?.displayName || ''}"?`}
                confirmLabel="Xóa"
                variant="danger"
                loading={!!deletingId}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
};
