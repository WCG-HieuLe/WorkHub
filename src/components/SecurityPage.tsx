import React from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Shield, AlertTriangle, Users, RefreshCw, ExternalLink,
    CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchSecurityData, SecurityData } from '@/services/azure/securityService';
import { graphConfig } from '@/config/authConfig';
import { useApiData } from '@/hooks/useApiData';

const severityColors: Record<string, { color: string; bg: string }> = {
    high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    informational: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
    unknown: { color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)' },
};

const riskColors: Record<string, { color: string; bg: string }> = {
    high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    none: { color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)' },
    hidden: { color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)' },
};

export const SecurityPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    
    const { data: data, loading, error, refresh: loadData } = useApiData<SecurityData | null>({
        key: `security_data_${accounts[0]?.homeAccountId || 'default'}`,
        fetcher: async () => {
            const token = await acquireToken(instance, accounts[0], graphConfig.scopes);
            return await fetchSecurityData(token);
        },
        enabled: isAuthenticated && accounts.length > 0,
        initialData: null
    });

    const highRiskCount = data?.riskyUsers.filter(u => u.riskLevel === 'high').length || 0;
    const highAlerts = data?.alerts.filter(a => a.severity === 'high').length || 0;

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Risky Users</span>
                        <div className="billing-stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.riskyUsers.length : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">High Risk</span>
                        <div className="billing-stat-icon" style={{ color: highRiskCount > 0 ? '#ef4444' : '#10b981', background: highRiskCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? highRiskCount : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Security Alerts</span>
                        <div className="billing-stat-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
                            <Shield size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.alerts.length : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">High Severity</span>
                        <div className="billing-stat-icon" style={{ color: highAlerts > 0 ? '#ef4444' : '#10b981', background: highAlerts > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
                            <XCircle size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? highAlerts : '—'}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Cannot load security data</strong><p>{error}</p></div>
                    <button onClick={() => loadData()} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            {/* Loading */}
            {loading && !data && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải security data...</p></div>
            )}

            {/* Risky Users */}
            {data && data.riskyUsers.length > 0 && (
                <div className="billing-section">
                    <div className="billing-section-header">
                        <h3>Risky Users ({data.riskyUsers.length})</h3>
                        <button onClick={() => loadData()} className="billing-refresh-btn" disabled={loading} title="Refresh">
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Risk Level</th>
                                    <th>Risk State</th>
                                    <th>Detail</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.riskyUsers.map(user => {
                                    const risk = riskColors[user.riskLevel] || riskColors.none;
                                    return (
                                        <tr key={user.id}>
                                            <td className="billing-table-name">{user.userDisplayName}</td>
                                            <td>
                                                <span className="license-status-badge" style={{ color: risk.color, background: risk.bg }}>
                                                    {user.riskLevel}
                                                </span>
                                            </td>
                                            <td>{user.riskState}</td>
                                            <td className="billing-table-type">{user.riskDetail || '—'}</td>
                                            <td className="billing-table-type">
                                                <Clock size={12} /> {new Date(user.riskLastUpdatedDateTime).toLocaleDateString('vi-VN')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {data && data.riskyUsers.length === 0 && !loading && (
                <div className="billing-section">
                    <h3>Risky Users</h3>
                    <div className="billing-loading" style={{ padding: '2rem' }}>
                        <CheckCircle size={28} color="#10b981" />
                        <p>Không có user nào có risk — hệ thống an toàn ✅</p>
                    </div>
                </div>
            )}

            {/* Security Alerts */}
            {data && data.alerts.length > 0 && (
                <div className="billing-section">
                    <h3>Security Alerts ({data.alerts.length})</h3>
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Severity</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.alerts.map(alert => {
                                    const sev = severityColors[alert.severity] || severityColors.unknown;
                                    return (
                                        <tr key={alert.id}>
                                            <td className="billing-table-name">{alert.title}</td>
                                            <td>
                                                <span className="license-status-badge" style={{ color: sev.color, background: sev.bg }}>
                                                    {alert.severity}
                                                </span>
                                            </td>
                                            <td>{alert.category}</td>
                                            <td>{alert.status}</td>
                                            <td className="billing-table-type">
                                                {new Date(alert.createdDateTime).toLocaleDateString('vi-VN')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Portal Links */}
            <div className="billing-section">
                <h3>Security Portals</h3>
                <div className="management-grid">
                    {[
                        { title: 'Entra Risky Users', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/RiskyUsersBlade', description: 'Identity Protection' },
                        { title: 'Security Alerts', url: 'https://security.microsoft.com/alerts', description: 'Microsoft 365 Defender' },
                        { title: 'Conditional Access', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_ConditionalAccess/ConditionalAccessBlade', description: 'Access policies' },
                    ].map(link => (
                        <a key={link.title} href={link.url} target="_blank" rel="noopener noreferrer" className="management-card">
                            <div className="management-card-content">
                                <span className="management-card-icon"><Shield size={18} /></span>
                                <div><h3>{link.title}</h3><p>{link.description}</p></div>
                            </div>
                            <span className="management-card-arrow-container">
                                <ExternalLink size={14} className="management-card-arrow" />
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};
