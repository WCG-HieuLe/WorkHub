import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    AppWindow, RefreshCw, AlertTriangle, Search, X,
    CheckCircle, XCircle, ChevronDown, ChevronRight,
    ExternalLink, Play, Mail, Users,
} from 'lucide-react';
import type { CanvasApp } from '@/services/azure/canvasAppService';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchCanvasApps } from '@/services/azure/canvasAppService';
import { powerAppsConfig } from '@/config/authConfig';

const ENV_ID = 'de210e4b-cd22-e605-91ca-8e841aad4b8e';

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getAppMakerUrl(appId: string): string {
    return `https://make.powerapps.com/environments/${ENV_ID}/apps/${appId}/details`;
}

export const CanvasAppPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [apps, setApps] = useState<CanvasApp[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const loadedRef = useRef(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedItem, setSelectedItem] = useState<CanvasApp | null>(null);

    const loadData = useCallback(async (force = false) => {
        if (!isAuthenticated || accounts.length === 0) return;
        if (loadedRef.current && !force) return;
        setLoading(true);
        setError(null);
        try {
            const token = await acquireToken(instance, accounts[0], powerAppsConfig.scopes);
            const result = await fetchCanvasApps(token);
            setApps(result);
            loadedRef.current = true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load canvas apps');
        } finally {
            setLoading(false);
        }
    }, [instance, accounts, isAuthenticated]);

    useEffect(() => { loadData(); }, [loadData]);

    // Group apps by owner
    const ownerGroups = useMemo(() => {
        const filtered = search
            ? apps.filter(app =>
                app.displayName.toLowerCase().includes(search.toLowerCase()) ||
                app.owner.displayName.toLowerCase().includes(search.toLowerCase()) ||
                app.owner.email.toLowerCase().includes(search.toLowerCase())
            )
            : apps;
        const map = new Map<string, CanvasApp[]>();
        for (const app of filtered) {
            const key = app.owner.displayName || app.owner.email || 'Unknown';
            const list = map.get(key) || [];
            list.push(app);
            map.set(key, list);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [apps, search]);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const publishedCount = apps.filter(app => app.status === 'Published').length;
    const totalSharedUsers = apps.reduce((sum, app) => sum + app.sharedUsersCount, 0);

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Total Apps</span>
                        <AppWindow size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loadedRef.current ? '...' : apps.length}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Published</span>
                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loadedRef.current ? '...' : publishedCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Shared Users</span>
                        <Users size={16} style={{ color: '#60a5fa' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loadedRef.current ? '...' : totalSharedUsers}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Owners</span>
                        <Users size={16} style={{ color: '#f59e0b' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loadedRef.current ? '...' : new Set(apps.map(a => a.owner.displayName || a.owner.email)).size}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Không thể tải dữ liệu</strong><p>{error}</p></div>
                    <button onClick={() => loadData(true)} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            {/* Header: search + refresh */}
            <div className="reports-header">
                <div className="logs-tabs" />
                <div className="reports-header-actions">
                    <div className="reports-search" style={{ width: 220 }}>
                        <Search size={14} className="reports-search-icon" />
                        <input type="text" placeholder="Filter apps..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                    </div>
                    <button onClick={() => loadData(true)} className="billing-refresh-btn" disabled={loading} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && !loadedRef.current && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải canvas apps...</p></div>
            )}

            {/* App list grouped by owner */}
            {loadedRef.current && (
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
                                                    <th>Type</th>
                                                    <th>Status</th>
                                                    <th>Shared Users</th>
                                                    <th>Last Modified</th>
                                                    <th>Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map(app => (
                                                    <tr key={app.id} className="clickable-row" onClick={() => setSelectedItem(app)}>
                                                        <td className="billing-table-name">{app.displayName}</td>
                                                        <td>
                                                            <span className="status-badge" style={{
                                                                color: '#a78bfa',
                                                                background: 'rgba(167,139,250,0.1)',
                                                            }}>
                                                                {app.appType || 'Canvas App'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="status-badge" style={{
                                                                color: app.status === 'Published' ? '#10b981' : '#f59e0b',
                                                                background: app.status === 'Published' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                                            }}>
                                                                {app.status === 'Published' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                                {app.status || 'Published'}
                                                            </span>
                                                        </td>
                                                        <td className="billing-table-type">{app.sharedUsersCount || 0}</td>
                                                        <td className="billing-table-type">{formatDate(app.lastModifiedTime)}</td>
                                                        <td className="billing-table-type">{formatDate(app.createdTime)}</td>
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
                                <AppWindow size={24} style={{ opacity: 0.3 }} />
                                <p>{search ? `Không tìm thấy "${search}"` : 'Chưa có Canvas App nào'}</p>
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
                                    App Info
                                    <span style={{ display: 'flex', gap: 8 }}>
                                        <a href={getAppMakerUrl(selectedItem.id)}
                                            target="_blank" rel="noopener noreferrer"
                                            title="Mở trong Maker Portal"
                                            style={{ color: '#a78bfa', lineHeight: 0 }}
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                        {selectedItem.appPlayUri && (
                                            <a href={selectedItem.appPlayUri}
                                                target="_blank" rel="noopener noreferrer"
                                                title="Play App"
                                                style={{ color: '#10b981', lineHeight: 0 }}
                                            >
                                                <Play size={14} />
                                            </a>
                                        )}
                                    </span>
                                </div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item"><div className="meta-label">Name</div><div className="meta-value">{selectedItem.displayName}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">App ID</div><div className="meta-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{selectedItem.id}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Status</div><div className="meta-value">
                                        <span className="status-badge" style={{
                                            color: selectedItem.status === 'Published' ? '#10b981' : '#f59e0b',
                                            background: selectedItem.status === 'Published' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                        }}>
                                            {selectedItem.status === 'Published' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {selectedItem.status || 'Published'}
                                        </span>
                                    </div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Type</div><div className="meta-value">{selectedItem.appType || 'Canvas App'}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Last Modified</div><div className="meta-value">{formatDate(selectedItem.lastModifiedTime)}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Created</div><div className="meta-value">{formatDate(selectedItem.createdTime)}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Shared Users</div><div className="meta-value">{selectedItem.sharedUsersCount}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Shared Groups</div><div className="meta-value">{selectedItem.sharedGroupsCount}</div></div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <div className="detail-section-title">Owner</div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item"><div className="meta-label">Name</div><div className="meta-value">{selectedItem.owner.displayName || '—'}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Email</div><div className="meta-value">
                                        {selectedItem.owner.email ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Mail size={12} style={{ opacity: 0.5 }} />
                                                {selectedItem.owner.email}
                                            </span>
                                        ) : '—'}
                                    </div></div>
                                </div>
                            </div>

                            {(selectedItem.createdBy.displayName || selectedItem.lastModifiedBy.displayName) && (
                                <div className="detail-section">
                                    <div className="detail-section-title">Activity</div>
                                    <div className="detail-meta-grid">
                                        {selectedItem.createdBy.displayName && (
                                            <div className="detail-meta-item"><div className="meta-label">Created By</div><div className="meta-value">{selectedItem.createdBy.displayName}</div></div>
                                        )}
                                        {selectedItem.lastModifiedBy.displayName && (
                                            <div className="detail-meta-item"><div className="meta-label">Modified By</div><div className="meta-value">{selectedItem.lastModifiedBy.displayName}</div></div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedItem.description && (
                                <div className="detail-section">
                                    <div className="detail-section-title">Description</div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{selectedItem.description}</p>
                                </div>
                            )}


                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
