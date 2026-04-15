import React, { useState, useMemo } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Factory, Database, Layers, RefreshCw, AlertTriangle, Search, X,
    CheckCircle, XCircle, ChevronDown, ChevronRight, BarChart3, GitBranch,
} from 'lucide-react';
import type { FabricItem } from '@/services/azure/dataService';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchFabricWorkspaces, fetchFabricItems } from '@/services/azure/dataService';
import { powerBIConfig } from '@/config/authConfig';
import { useApiData } from '@/hooks/useApiData';

export const FabricPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const { data: apiData, loading, error, refresh: loadData } = useApiData({
        key: `fabric_items_${accounts[0]?.homeAccountId || 'default'}`,
        fetcher: async () => {
            const pbiToken = await acquireToken(instance, accounts[0], powerBIConfig.scopes);
            const ws = await fetchFabricWorkspaces(pbiToken);
            const fabricItems = await fetchFabricItems(pbiToken, ws);
            return { workspaces: ws, items: fabricItems };
        },
        enabled: isAuthenticated && accounts.length > 0,
        initialData: { workspaces: [], items: [] }
    });

    const workspaces = apiData?.workspaces || [];
    const items = apiData?.items || [];
    const loaded = workspaces.length > 0 || items.length > 0;

    const [search, setSearch] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedItem, setSelectedItem] = useState<FabricItem | null>(null);

    const wsGroups = useMemo(() => {
        const filtered = search
            ? items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.workspaceName.toLowerCase().includes(search.toLowerCase()))
            : items;
        const map = new Map<string, FabricItem[]>();
        for (const item of filtered) {
            const key = item.workspaceName || 'Unknown';
            const list = map.get(key) || [];
            list.push(item);
            map.set(key, list);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [items, search]);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const reportCount = items.filter(i => i.type === 'Report').length;
    const dataflowCount = items.filter(i => i.type === 'Dataflow').length;
    const pipelineCount = items.filter(i => i.type === 'Pipeline').length;
    const lakehouseCount = items.filter(i => i.type === 'Lakehouse').length;

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Workspaces</span>
                        <Factory size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : workspaces.length}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Reports</span>
                        <BarChart3 size={16} style={{ color: '#60a5fa' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : reportCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Dataflows</span>
                        <Layers size={16} style={{ color: '#10b981' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : dataflowCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Pipelines</span>
                        <GitBranch size={16} style={{ color: '#f59e0b' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : pipelineCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Lakehouses</span>
                        <Database size={16} style={{ color: '#06b6d4' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : lakehouseCount}</span>
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

            {/* Header */}
            <div className="reports-header">
                <div className="logs-tabs" />
                <div className="reports-header-actions">
                    <div className="reports-search" style={{ width: 220 }}>
                        <Search size={14} className="reports-search-icon" />
                        <input type="text" placeholder="Filter items..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                    </div>
                    <button onClick={() => loadData()} className="billing-refresh-btn" disabled={loading} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && !loaded && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải Fabric data...</p></div>
            )}

            {/* Fabric items grouped by workspace */}
            {(loaded || items.length > 0) && (
                <div className="billing-section">
                    <div className="reports-sidebar-list" style={{ maxHeight: 'none' }}>
                        {wsGroups.map(([wsName, wsItems]) => (
                            <div key={wsName} className="reports-ws-group">
                                <button className="reports-ws-header" onClick={() => toggleGroup(wsName)}>
                                    {expandedGroups[wsName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <span className="reports-ws-name">{wsName}</span>
                                    <span className="reports-ws-count">{wsItems.length}</span>
                                </button>

                                {expandedGroups[wsName] && (
                                    <div className="billing-table-wrapper" style={{ marginLeft: 0 }}>
                                        <table className="billing-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Type</th>
                                                    <th>Configured By</th>
                                                    <th>Refreshable</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {wsItems.map(item => (
                                                    <tr key={item.id} className="clickable-row" onClick={() => setSelectedItem(item)}>
                                                        <td className="billing-table-name">{item.name}</td>
                                                        <td>
                                                            <span className="status-badge" style={{
                                                                color: item.type === 'Dataset' ? '#60a5fa' : '#a78bfa',
                                                                background: item.type === 'Dataset' ? 'rgba(96,165,250,0.1)' : 'rgba(167,139,250,0.1)',
                                                            }}>
                                                                {item.type === 'Dataset' ? <Database size={12} /> : <Layers size={12} />}
                                                                {item.type}
                                                            </span>
                                                        </td>
                                                        <td className="billing-table-type">{item.configuredBy || '—'}</td>
                                                        <td>{item.isRefreshable ? <CheckCircle size={14} style={{ color: '#10b981' }} /> : <XCircle size={14} style={{ color: '#71717a' }} />}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                        {wsGroups.length === 0 && !loading && (
                            <div className="billing-loading" style={{ padding: '2rem' }}>
                                <Factory size={24} style={{ opacity: 0.3 }} />
                                <p>{search ? `Không tìm thấy "${search}"` : 'Chưa có Fabric item nào'}</p>
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
                            <h3>{selectedItem.name}</h3>
                            <button className="detail-sidebar-close" onClick={() => setSelectedItem(null)} title="Close"><X size={16} /></button>
                        </div>
                        <div className="detail-sidebar-body">
                            <div className="detail-section">
                                <div className="detail-section-title">Fabric Item Info</div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item"><div className="meta-label">Name</div><div className="meta-value">{selectedItem.name}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">ID</div><div className="meta-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{selectedItem.id}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Type</div><div className="meta-value">
                                        <span className="status-badge" style={{
                                            color: selectedItem.type === 'Dataset' ? '#60a5fa' : '#a78bfa',
                                            background: selectedItem.type === 'Dataset' ? 'rgba(96,165,250,0.1)' : 'rgba(167,139,250,0.1)',
                                        }}>
                                            {selectedItem.type === 'Dataset' ? <Database size={12} /> : <Layers size={12} />}
                                            {selectedItem.type}
                                        </span>
                                    </div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Workspace</div><div className="meta-value">{selectedItem.workspaceName}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Configured By</div><div className="meta-value">{selectedItem.configuredBy || '—'}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Refreshable</div><div className="meta-value">
                                        {selectedItem.isRefreshable
                                            ? <span className="status-badge" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}><CheckCircle size={12} /> Yes</span>
                                            : <span className="status-badge" style={{ color: '#71717a', background: 'rgba(113,113,122,0.1)' }}><XCircle size={12} /> No</span>
                                        }
                                    </div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
