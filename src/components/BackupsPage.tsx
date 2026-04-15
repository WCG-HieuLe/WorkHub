import React, { useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    HardDrive, Server, Database, RefreshCw,
    AlertTriangle, CheckCircle, ExternalLink, Cloud,
} from 'lucide-react';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchEnvironmentBackups, BackupData, EnvironmentBackup } from '@/services/azure/backupService';
import { powerPlatformAdminConfig } from '@/config/authConfig';
import { useApiData } from '@/hooks/useApiData';

const envTypeColors: Record<string, { color: string; bg: string }> = {
    Production: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    Sandbox: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    Developer: { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' },
    Trial: { color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)' },
    Default: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
};

const stateIcons: Record<string, React.ReactNode> = {
    Enabled: <CheckCircle size={14} style={{ color: '#10b981' }} />,
    Ready: <CheckCircle size={14} style={{ color: '#10b981' }} />,
    Disabled: <AlertTriangle size={14} style={{ color: '#ef4444' }} />,
};

const portalLinks = [
    { icon: <Database size={18} />, title: 'PP Admin Center', url: 'https://admin.powerplatform.microsoft.com/environments', description: 'Manage environments & backups' },
    { icon: <Cloud size={18} />, title: 'Azure Portal', url: 'https://portal.azure.com/', description: 'Azure resource management' },
];

// ── Detail Sidebar ──
const BackupDetailSidebar: React.FC<{
    env: EnvironmentBackup | null;
    onClose: () => void;
}> = ({ env, onClose }) => {
    if (!env) return null;
    const typeStyle = envTypeColors[env.type] || envTypeColors.Default;

    return (
        <div className="detail-sidebar open">
            <div className="detail-sidebar-header">
                <h3>{env.displayName}</h3>
                <button onClick={onClose} className="detail-sidebar-close">&times;</button>
            </div>
            <div className="detail-sidebar-content">
                <div className="detail-sidebar-section">
                    <h4>Environment Info</h4>
                    <div className="detail-sidebar-grid">
                        <div className="detail-sidebar-item">
                            <span className="detail-label">Type</span>
                            <span className="license-status-badge" style={{ color: typeStyle.color, background: typeStyle.bg }}>
                                {env.type}
                            </span>
                        </div>
                        <div className="detail-sidebar-item">
                            <span className="detail-label">State</span>
                            <span className="detail-value">{stateIcons[env.state] || null} {env.state}</span>
                        </div>
                        <div className="detail-sidebar-item">
                            <span className="detail-label">Version</span>
                            <span className="detail-value">{env.version || '—'}</span>
                        </div>
                        <div className="detail-sidebar-item">
                            <span className="detail-label">Organization ID</span>
                            <span className="detail-value" style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>{env.organizationId || '—'}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-sidebar-section">
                    <h4>Backup Details</h4>
                    <div className="detail-sidebar-grid">
                        <div className="detail-sidebar-item">
                            <span className="detail-label">Retention Period</span>
                            <span className="detail-value">{env.backupRetentionDays} days</span>
                        </div>
                        <div className="detail-sidebar-item">
                            <span className="detail-label">Created</span>
                            <span className="detail-value">{env.createdOn ? new Date(env.createdOn).toLocaleDateString('vi-VN') : '—'}</span>
                        </div>
                        <div className="detail-sidebar-item">
                            <span className="detail-label">Last Modified</span>
                            <span className="detail-value">{env.lastModifiedOn ? new Date(env.lastModifiedOn).toLocaleDateString('vi-VN') : '—'}</span>
                        </div>
                    </div>
                </div>

                {env.url && (
                    <div className="detail-sidebar-section">
                        <h4>Links</h4>
                        <a href={env.url} target="_blank" rel="noopener noreferrer" className="management-card" style={{ marginTop: '0.5rem' }}>
                            <div className="management-card-content">
                                <span className="management-card-icon"><Database size={16} /></span>
                                <div>
                                    <h3>Open Environment</h3>
                                    <p>{env.url}</p>
                                </div>
                            </div>
                            <span className="management-card-arrow-container">
                                <ExternalLink size={14} className="management-card-arrow" />
                            </span>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Main Page ──
export const BackupsPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    
    const { data: data, loading, error, refresh: loadData } = useApiData<BackupData | null>({
        key: `backup_data_${accounts[0]?.homeAccountId || 'default'}`,
        fetcher: async () => {
            const token = await acquireToken(instance, accounts[0], powerPlatformAdminConfig.scopes);
            return await fetchEnvironmentBackups(token);
        },
        enabled: isAuthenticated && accounts.length > 0,
        initialData: null
    });

    const [selectedEnv, setSelectedEnv] = useState<EnvironmentBackup | null>(null);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="backups-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Environments</span>
                        <div className="billing-stat-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
                            <Server size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.totalEnvironments : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Production</span>
                        <div className="billing-stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                            <HardDrive size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.productionCount : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Sandbox</span>
                        <div className="billing-stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                            <Database size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.sandboxCount : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Retention</span>
                        <div className="billing-stat-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                            <RefreshCw size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : '28d'}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>Cannot load backup data</strong>
                        <p>{error}</p>
                    </div>
                    <button onClick={loadData} className="billing-retry-btn">
                        <RefreshCw size={14} /> Thử lại
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && !data && (
                <div className="billing-loading">
                    <div className="spinner"></div>
                    <p>Đang tải environment backups...</p>
                </div>
            )}

            {/* Environment Backups Table */}
            {data && data.environments.length > 0 && (
                <div className="billing-section">
                    <div className="billing-section-header">
                        <h3>Dataverse Environment Backups</h3>
                        <button onClick={loadData} className="billing-refresh-btn" disabled={loading} title="Refresh">
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Environment</th>
                                    <th>Type</th>
                                    <th>State</th>
                                    <th>Version</th>
                                    <th>Created</th>
                                    <th>Last Modified</th>
                                    <th>Retention</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.environments.map((env) => {
                                    const typeStyle = envTypeColors[env.type] || envTypeColors.Default;
                                    return (
                                        <tr
                                            key={env.id}
                                            className="clickable-row"
                                            onClick={() => setSelectedEnv(env)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className="billing-table-name">{env.displayName}</td>
                                            <td>
                                                <span className="license-status-badge" style={{ color: typeStyle.color, background: typeStyle.bg }}>
                                                    {env.type}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    {stateIcons[env.state] || null}
                                                    {env.state}
                                                </span>
                                            </td>
                                            <td className="billing-table-type">{env.version || '—'}</td>
                                            <td className="billing-table-type">{formatDate(env.createdOn)}</td>
                                            <td className="billing-table-type">{formatDate(env.lastModifiedOn)}</td>
                                            <td className="billing-table-type">{env.backupRetentionDays}d</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* BigQuery Section — Coming Soon */}
            <div className="billing-section">
                <div className="billing-section-header">
                    <h3>BigQuery Backups</h3>
                </div>
                <div className="billing-empty-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Cloud size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                    <p>🚧 Đang phát triển — sẽ hiển thị BigQuery sync refresh history.</p>
                </div>
            </div>

            {/* Portal Links */}
            <div className="billing-section">
                <h3>Management Portals</h3>
                <div className="management-grid">
                    {portalLinks.map((link) => (
                        <a key={link.title} href={link.url} target="_blank" rel="noopener noreferrer" className="management-card">
                            <div className="management-card-content">
                                <span className="management-card-icon">{link.icon}</span>
                                <div>
                                    <h3>{link.title}</h3>
                                    <p>{link.description}</p>
                                </div>
                            </div>
                            <span className="management-card-arrow-container">
                                <ExternalLink size={14} className="management-card-arrow" />
                            </span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Detail Sidebar */}
            <BackupDetailSidebar env={selectedEnv} onClose={() => setSelectedEnv(null)} />
            {selectedEnv && <div className="detail-sidebar-overlay" onClick={() => setSelectedEnv(null)} />}
        </div>
    );
};
