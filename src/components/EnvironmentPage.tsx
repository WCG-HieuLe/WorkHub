import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Server, RefreshCw, AlertTriangle, Search, X,
    CheckCircle, Globe, Clock,
} from 'lucide-react';
import type { PPEnvironment } from '@/services/azure/powerPlatformService';
import { fetchEnvironments } from '@/services/azure/powerPlatformService';
import { acquireToken } from '@/services/azure/tokenService';
import { powerPlatformAdminConfig } from '@/config/authConfig';
import { getCache, setCache, clearCache } from '@/services/cache';

const CACHE_KEY = 'pp_environments';

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const EnvironmentPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const cached = getCache<PPEnvironment[]>(CACHE_KEY);
    const [envs, setEnvs] = useState<PPEnvironment[]>(cached || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedEnv, setSelectedEnv] = useState<PPEnvironment | null>(null);
    const loaded = cached !== null;

    const loadData = useCallback(async (force = false) => {
        if (!isAuthenticated || accounts.length === 0) return;
        if (!force && loaded) return;
        if (force) clearCache(CACHE_KEY);
        setLoading(true);
        setError(null);
        try {
            const token = await acquireToken(instance, accounts[0], powerPlatformAdminConfig.scopes);
            const result = await fetchEnvironments(token);
            setEnvs(result);
            setCache(CACHE_KEY, result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load environments');
        } finally {
            setLoading(false);
        }
    }, [instance, accounts, isAuthenticated, loaded]);

    useEffect(() => { loadData(); }, [loadData]);

    const filtered = useMemo(() => {
        if (!search) return envs;
        const q = search.toLowerCase();
        return envs.filter(e => e.name.toLowerCase().includes(q) || e.uniqueName.toLowerCase().includes(q));
    }, [envs, search]);

    const activeCount = envs.filter(e => e.state === 'Succeeded' || e.state === 'Ready').length;

    return (
        <div className="health-page">
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Environments</span>
                        <Server size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : envs.length}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Active</span>
                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                    </div>
                    <span className="billing-stat-value">{loading && !loaded ? '...' : activeCount}</span>
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
                        <input type="text" placeholder="Filter environments..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                    </div>
                    <button onClick={() => loadData(true)} className="billing-refresh-btn" disabled={loading} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {loading && !loaded && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải environments...</p></div>
            )}

            {(loaded || envs.length > 0) && (
                <div className="billing-section">
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Version</th>
                                    <th>URL</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(env => (
                                    <tr key={env.uniqueName || env.name} className="clickable-row" onClick={() => setSelectedEnv(env)}>
                                        <td className="billing-table-name">{env.name}</td>
                                        <td>
                                            <span className="status-badge" style={{
                                                color: (env.state === 'Succeeded' || env.state === 'Ready') ? '#10b981' : '#f59e0b',
                                                background: (env.state === 'Succeeded' || env.state === 'Ready') ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                            }}>
                                                {(env.state === 'Succeeded' || env.state === 'Ready') ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                {env.state}
                                            </span>
                                        </td>
                                        <td className="billing-table-type">{env.version || '—'}</td>
                                        <td className="billing-table-type">
                                            {env.urlName ? (
                                                <a href={`https://${env.urlName}.crm5.dynamics.com`} target="_blank" rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    style={{ color: '#a78bfa', fontSize: '12px' }}
                                                >
                                                    <Globe size={12} style={{ marginRight: 4 }} />
                                                    {env.urlName}
                                                </a>
                                            ) : '—'}
                                        </td>
                                        <td className="billing-table-type">{formatDate(env.createdOn)}</td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !loading && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        {search ? `Không tìm thấy "${search}"` : 'Chưa có environment nào'}
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail sidebar */}
            {selectedEnv && (
                <>
                    <div className="detail-sidebar-overlay" onClick={() => setSelectedEnv(null)} />
                    <div className="detail-sidebar">
                        <div className="detail-sidebar-header">
                            <h3>{selectedEnv.name}</h3>
                            <button className="detail-sidebar-close" onClick={() => setSelectedEnv(null)} title="Close"><X size={16} /></button>
                        </div>
                        <div className="detail-sidebar-body">
                            <div className="detail-section">
                                <div className="detail-section-title">Environment Info</div>
                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item"><div className="meta-label">Display Name</div><div className="meta-value">{selectedEnv.name}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Unique Name</div><div className="meta-value" style={{ fontSize: '11px' }}>{selectedEnv.uniqueName || '—'}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Status</div><div className="meta-value">
                                        <span className="status-badge" style={{
                                            color: (selectedEnv.state === 'Succeeded' || selectedEnv.state === 'Ready') ? '#10b981' : '#f59e0b',
                                            background: (selectedEnv.state === 'Succeeded' || selectedEnv.state === 'Ready') ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                        }}>
                                            {selectedEnv.state}
                                        </span>
                                    </div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Version</div><div className="meta-value">{selectedEnv.version || '—'}</div></div>
                                    <div className="detail-meta-item"><div className="meta-label">URL</div><div className="meta-value">
                                        {selectedEnv.urlName ? (
                                            <a href={`https://${selectedEnv.urlName}.crm5.dynamics.com`} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', fontSize: '11px' }}>
                                                {selectedEnv.urlName}.crm5.dynamics.com
                                            </a>
                                        ) : '—'}
                                    </div></div>
                                    <div className="detail-meta-item"><div className="meta-label">Created</div><div className="meta-value">{formatDate(selectedEnv.createdOn)}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
