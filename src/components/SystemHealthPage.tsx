import React, { useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Activity, Cloud, Shield, Zap, Globe,
    ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Clock,
} from 'lucide-react';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchHealthData, HealthData, mapStatus } from '@/services/azure/healthService';
import { graphConfig } from '@/config/authConfig';

const statusLabels: Record<string, { label: string; color: string }> = {
    healthy: { label: 'Operational', color: '#10b981' },
    degraded: { label: 'Degraded', color: '#f59e0b' },
    outage: { label: 'Outage', color: '#ef4444' },
    unknown: { label: 'Unknown', color: '#71717a' },
};

const serviceIcons: Record<string, React.ReactNode> = {
    'Exchange Online': <Cloud size={16} />,
    'Microsoft Teams': <Activity size={16} />,
    'SharePoint Online': <Globe size={16} />,
    'Microsoft 365 suite': <Shield size={16} />,
    'Power Platform': <Zap size={16} />,
};

const portalLinks = [
    { icon: <Activity size={18} />, title: 'Azure Service Health', url: 'https://portal.azure.com/#view/Microsoft_Azure_Health/AzureHealthBrowseBlade', description: 'Azure resource health' },
    { icon: <Cloud size={18} />, title: 'M365 Service Health', url: 'https://admin.microsoft.com/Adminportal/Home#/servicehealth', description: 'Microsoft 365 status' },
    { icon: <Zap size={18} />, title: 'PP Service Health', url: 'https://admin.powerplatform.microsoft.com/servicehealth', description: 'Power Platform health' },
];

export const SystemHealthPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!isAuthenticated || accounts.length === 0) return;
        setLoading(true);
        setError(null);
        try {
            const token = await acquireToken(instance, accounts[0], graphConfig.scopes);
            const healthData = await fetchHealthData(token);
            setData(healthData);
        } catch (e) {
            console.error('Health data error:', e);
            setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu health.');
        } finally {
            setLoading(false);
        }
    }, [instance, accounts, isAuthenticated]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const healthyCount = data ? data.services.filter(s => mapStatus(s.status) === 'healthy').length : 0;
    const issueCount = data ? data.services.length - healthyCount : 0;

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Services</span>
                        <div className="billing-stat-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
                            <Activity size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.services.length : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Operational</span>
                        <div className="billing-stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? healthyCount : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Issues</span>
                        <div className="billing-stat-icon" style={{ color: issueCount > 0 ? '#ef4444' : '#10b981', background: issueCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? issueCount : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Active Incidents</span>
                        <div className="billing-stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                            <Clock size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.activeIssues.length : '—'}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>Cannot load service health</strong>
                        <p>{error}</p>
                    </div>
                    <button onClick={loadData} className="billing-retry-btn">
                        <RefreshCw size={14} /> Thử lại
                    </button>
                </div>
            )}

            {/* Service Health Grid */}
            {data && data.services.length > 0 && (
                <div className="billing-section">
                    <div className="billing-section-header">
                        <h3>Microsoft 365 Service Health</h3>
                        <button onClick={loadData} className="billing-refresh-btn" disabled={loading} title="Refresh">
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                    <div className="health-services-grid">
                        {data.services.map((service) => {
                            const mappedStatus = mapStatus(service.status);
                            const statusInfo = statusLabels[mappedStatus];
                            return (
                                <div key={service.id} className="health-service-card">
                                    <div className="health-service-header">
                                        <span className="health-service-name">
                                            {serviceIcons[service.service] || <Cloud size={16} />}
                                            {service.service}
                                        </span>
                                        <div className={`health-status-dot ${mappedStatus}`} title={statusInfo.label} />
                                    </div>
                                    <span className="health-service-desc">
                                        <span className="license-status-badge" style={{ color: statusInfo.color, background: `${statusInfo.color}15` }}>
                                            {statusInfo.label}
                                        </span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Issues */}
            {data && data.activeIssues.length > 0 && (
                <div className="billing-section">
                    <h3>Active Issues ({data.activeIssues.length})</h3>
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Issue</th>
                                    <th>Status</th>
                                    <th>Started</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.activeIssues.map((issue) => (
                                    <tr key={issue.id}>
                                        <td className="billing-table-name">{issue.service}</td>
                                        <td>{issue.title}</td>
                                        <td>
                                            <span className="license-status-badge" style={{
                                                color: statusLabels[mapStatus(issue.status)]?.color || '#71717a',
                                                background: `${statusLabels[mapStatus(issue.status)]?.color || '#71717a'}15`,
                                            }}>
                                                {issue.classification || issue.status}
                                            </span>
                                        </td>
                                        <td className="billing-table-type">
                                            {new Date(issue.startDateTime).toLocaleDateString('vi-VN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && !data && (
                <div className="billing-loading">
                    <div className="spinner"></div>
                    <p>Đang tải service health...</p>
                </div>
            )}

            {/* Portal Links */}
            <div className="billing-section">
                <h3>Health Portals</h3>
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
        </div>
    );
};
