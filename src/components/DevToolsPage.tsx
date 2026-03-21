import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Zap, Layers, Workflow, RefreshCw, AlertTriangle, Server,
    ExternalLink, Clock, CheckCircle, XCircle, Search, X, Play, Maximize2,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { acquireToken } from '@/services/azure/tokenService';
import {
    fetchCanvasApps, fetchFlows, fetchEnvironments,
    CanvasApp, FlowDefinition, PPEnvironment,
} from '@/services/azure/powerPlatformService';
import { dataverseConfig, powerPlatformAdminConfig } from '@/config/authConfig';
import { usePagination } from '@/hooks/usePagination';

type Tab = 'env' | 'apps' | 'flows' | 'portals';
const PAGE_SIZE = 20;

export const DevToolsPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    // Tab state
    const [tab, setTab] = useState<Tab>('env');
    const [search, setSearch] = useState('');
    const [embedApp, setEmbedApp] = useState<CanvasApp | null>(null);

    // Lazy-loaded data per tab
    const [envs, setEnvs] = useState<PPEnvironment[]>([]);
    const [apps, setApps] = useState<CanvasApp[]>([]);
    const [flows, setFlows] = useState<FlowDefinition[]>([]);
    const [totalFlows, setTotalFlows] = useState(0);

    // Loading/error per tab
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track which tabs have been loaded
    const loadedTabs = useRef<Set<Tab>>(new Set());

    // Get tokens
    const getTokens = useCallback(async () => {
        const account = accounts[0];
        const dvToken = await acquireToken(instance, account, dataverseConfig.scopes);
        const envToken = await acquireToken(instance, account, powerPlatformAdminConfig.scopes);
        return { dvToken, envToken };
    }, [instance, accounts]);

    // Load data for specific tab (lazy)
    const loadTab = useCallback(async (targetTab: Tab, force = false) => {
        if (!isAuthenticated || accounts.length === 0) return;
        if (!force && loadedTabs.current.has(targetTab)) return; // Already loaded

        setLoading(true);
        setError(null);
        try {
            const { dvToken, envToken } = await getTokens();

            switch (targetTab) {
                case 'env': {
                    const data = await fetchEnvironments(envToken);
                    setEnvs(data);
                    break;
                }
                case 'apps': {
                    const data = await fetchCanvasApps(dvToken);
                    setApps(data);
                    break;
                }
                case 'flows': {
                    const result = await fetchFlows(dvToken);
                    setFlows(result.flows);
                    setTotalFlows(result.total);
                    break;
                }
            }
            loadedTabs.current.add(targetTab);
        } catch (e) {
            console.error(`PP ${targetTab} error:`, e);
            setError(e instanceof Error ? e.message : `Cannot load ${targetTab} data.`);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, accounts, getTokens]);

    // Load current tab on mount / tab change
    useEffect(() => {
        loadTab(tab);
    }, [tab, loadTab]);

    // Filtered data
    const filteredApps = apps.filter(app => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return app.displayName.toLowerCase().includes(q) || app.owner?.toLowerCase().includes(q);
    });

    const filteredFlows = flows.filter(flow => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return flow.name.toLowerCase().includes(q);
    });

    // Pagination
    const appsPagination = usePagination(filteredApps, PAGE_SIZE);
    const flowsPagination = usePagination(filteredFlows, PAGE_SIZE);

    const activatedFlows = flows.filter(f => f.state === 'Activated').length;

    // Tab counts (show loaded count or dash)
    const envCount = loadedTabs.current.has('env') ? envs.length : '—';
    const appCount = loadedTabs.current.has('apps') ? apps.length : '—';
    const flowCount = loadedTabs.current.has('flows') ? totalFlows : '—';

    // Current active pagination
    const activePagination = tab === 'apps' ? appsPagination : tab === 'flows' ? flowsPagination : null;
    const showToolbar = tab === 'apps' || tab === 'flows';

    return (
        <div className="health-page">
            {/* Iframe Embed Overlay */}
            {embedApp && embedApp.playUrl && (
                <div className="embed-overlay">
                    <div className="embed-panel">
                        <div className="embed-panel-header">
                            <div className="embed-panel-title">
                                <Layers size={16} />
                                <span>{embedApp.displayName}</span>
                            </div>
                            <div className="embed-panel-actions">
                                <a href={embedApp.playUrl} target="_blank" rel="noopener noreferrer" className="embed-panel-btn" title="Open in new tab">
                                    <Maximize2 size={14} />
                                </a>
                                <button onClick={() => setEmbedApp(null)} className="embed-panel-btn" title="Close">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                        <iframe src={embedApp.playUrl} className="embed-iframe" title={embedApp.displayName} allow="camera; microphone; geolocation" />
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Environments</span>
                        <div className="billing-stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
                            <Server size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading && tab === 'env' ? '...' : envCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Canvas Apps</span>
                        <div className="billing-stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                            <Layers size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading && tab === 'apps' ? '...' : appCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Cloud Flows</span>
                        <div className="billing-stat-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                            <Workflow size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading && tab === 'flows' ? '...' : flowCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Activated Flows</span>
                        <div className="billing-stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                            <Zap size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading && tab === 'flows' ? '...' : loadedTabs.current.has('flows') ? activatedFlows : '—'}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Cannot load data</strong><p>{error}</p></div>
                    <button onClick={() => loadTab(tab, true)} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            {/* Tabs + Search */}
            <div className="reports-header">
                <div className="logs-tabs">
                    <button className={`logs-tab ${tab === 'env' ? 'active' : ''}`} onClick={() => setTab('env')}>
                        <Server size={14} /> Environments ({envCount})
                    </button>
                    <button className={`logs-tab ${tab === 'apps' ? 'active' : ''}`} onClick={() => setTab('apps')}>
                        <Layers size={14} /> Canvas Apps ({appCount})
                    </button>
                    <button className={`logs-tab ${tab === 'flows' ? 'active' : ''}`} onClick={() => setTab('flows')}>
                        <Workflow size={14} /> Flows ({flowCount})
                    </button>
                    <button className={`logs-tab ${tab === 'portals' ? 'active' : ''}`} onClick={() => setTab('portals')}>
                        <ExternalLink size={14} /> Portals
                    </button>
                </div>
                <div className="reports-header-actions">
                    {showToolbar && activePagination && activePagination.totalPages > 1 && (
                        <div className="pagination-bar">
                            <button onClick={activePagination.prev} disabled={!activePagination.hasPrev} title="Previous page"><ChevronLeft size={14} /></button>
                            <span className="pagination-info">{activePagination.page}/{activePagination.totalPages}</span>
                            <button onClick={activePagination.next} disabled={!activePagination.hasNext} title="Next page"><ChevronRight size={14} /></button>
                        </div>
                    )}
                    {showToolbar && (
                        <div className="reports-search" style={{ width: 200 }}>
                            <Search size={14} className="reports-search-icon" />
                            <input type="text" placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                        </div>
                    )}
                    {tab !== 'portals' && (
                        <button onClick={() => loadTab(tab, true)} className="billing-refresh-btn" disabled={loading} title="Refresh">
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        </button>
                    )}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải {tab === 'env' ? 'environments' : tab === 'apps' ? 'canvas apps' : 'flows'}...</p></div>
            )}

            {/* Environments Tab */}
            {tab === 'env' && !loading && envs.length > 0 && (
                <div className="billing-section">
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Unique Name</th>
                                    <th>Version</th>
                                    <th>State</th>
                                    <th>URL</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {envs.map((env, i) => (
                                    <tr key={i}>
                                        <td className="billing-table-name"><Server size={14} style={{ marginRight: '0.35rem', opacity: 0.5 }} /> {env.name}</td>
                                        <td>{env.uniqueName}</td>
                                        <td><span className="license-status-badge" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>{env.version}</span></td>
                                        <td><span className="license-status-badge" style={{ color: env.state === 'Active' || env.state === 'Succeeded' ? '#10b981' : '#ef4444', background: env.state === 'Active' || env.state === 'Succeeded' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}><CheckCircle size={10} /> {env.state}</span></td>
                                        <td>{env.urlName || '—'}</td>
                                        <td className="billing-table-type"><Clock size={12} /> {env.createdOn ? new Date(env.createdOn).toLocaleDateString('vi-VN') : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {tab === 'env' && !loading && envs.length === 0 && loadedTabs.current.has('env') && (
                <div className="billing-loading" style={{ padding: '2rem' }}><Server size={24} style={{ opacity: 0.3 }} /><p>Không có environment data</p></div>
            )}

            {/* Canvas Apps Tab */}
            {tab === 'apps' && !loading && loadedTabs.current.has('apps') && (
                <div className="billing-section">
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>App Name</th>
                                    <th>Type</th>
                                    <th>Owner</th>
                                    <th>Status</th>
                                    <th>Modified</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {appsPagination.items.map(app => (
                                    <tr key={app.id} className={app.playUrl ? 'clickable-row' : ''} onClick={() => app.playUrl && setEmbedApp(app)}>
                                        <td className="billing-table-name">
                                            <Layers size={14} style={{ marginRight: '0.35rem', opacity: 0.5 }} />
                                            {app.displayName}
                                        </td>
                                        <td><span className="license-status-badge" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>{app.appType}</span></td>
                                        <td>{app.owner || '—'}</td>
                                        <td>
                                            <span className="license-status-badge" style={{
                                                color: app.status === 'Ready' ? '#10b981' : '#f59e0b',
                                                background: app.status === 'Ready' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            }}>
                                                {app.status === 'Ready' ? <><CheckCircle size={10} /> Ready</> : app.status}
                                            </span>
                                        </td>
                                        <td className="billing-table-type"><Clock size={12} /> {app.lastModified ? new Date(app.lastModified).toLocaleDateString('vi-VN') : '—'}</td>
                                        <td style={{ width: '2rem', textAlign: 'center' }}>{app.playUrl && <Play size={14} style={{ opacity: 0.4 }} />}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredApps.length === 0 && (
                        <div className="billing-loading" style={{ padding: '2rem' }}><Layers size={24} style={{ opacity: 0.3 }} /><p>{search ? `Không tìm thấy "${search}"` : 'Không có canvas apps'}</p></div>
                    )}
                </div>
            )}

            {/* Flows Tab */}
            {tab === 'flows' && !loading && loadedTabs.current.has('flows') && (
                <div className="billing-section">
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Flow Name</th>
                                    <th>State</th>
                                    <th>Modified</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flowsPagination.items.map(flow => {
                                    const isActive = flow.state === 'Activated';
                                    return (
                                        <tr key={flow.id}>
                                            <td className="billing-table-name">{flow.name}</td>
                                            <td>
                                                <span className="license-status-badge" style={{
                                                    color: isActive ? '#10b981' : '#f59e0b',
                                                    background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                }}>
                                                    {isActive ? <><CheckCircle size={10} /> Activated</> : <><XCircle size={10} /> Draft</>}
                                                </span>
                                            </td>
                                            <td className="billing-table-type"><Clock size={12} /> {flow.lastModified ? new Date(flow.lastModified).toLocaleDateString('vi-VN') : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredFlows.length === 0 && (
                        <div className="billing-loading" style={{ padding: '2rem' }}><Workflow size={24} style={{ opacity: 0.3 }} /><p>{search ? `Không tìm thấy "${search}"` : 'Không có flows'}</p></div>
                    )}
                </div>
            )}

            {/* Portals Tab */}
            {tab === 'portals' && (
                <div className="billing-section">
                    <div className="management-grid">
                        {[
                            { icon: <Zap size={18} />, title: 'PP Admin Center', url: 'https://admin.powerplatform.microsoft.com/environments', description: 'Environments & capacity' },
                            { icon: <Layers size={18} />, title: 'Power Apps Maker', url: 'https://make.powerapps.com', description: 'Canvas & Model-driven apps' },
                            { icon: <Workflow size={18} />, title: 'Power Automate', url: 'https://make.powerautomate.com/manage/flows', description: 'Cloud & desktop flows' },
                        ].map(link => (
                            <a key={link.title} href={link.url} target="_blank" rel="noopener noreferrer" className="management-card">
                                <div className="management-card-content">
                                    <span className="management-card-icon">{link.icon}</span>
                                    <div><h3>{link.title}</h3><p>{link.description}</p></div>
                                </div>
                                <span className="management-card-arrow-container">
                                    <ExternalLink size={14} className="management-card-arrow" />
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
