import React, { useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Globe, RefreshCw, AlertTriangle, CheckCircle, Star,
    ExternalLink, Shield, XCircle,
} from 'lucide-react';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchDomains, Domain } from '@/services/azure/domainService';
import { graphConfig } from '@/config/authConfig';

export const DomainsPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!isAuthenticated || accounts.length === 0) return;
        setLoading(true);
        setError(null);
        try {
            const token = await acquireToken(instance, accounts[0], graphConfig.scopes);
            const result = await fetchDomains(token);
            setDomains(result);
        } catch (e) {
            console.error('Domains error:', e);
            setError(e instanceof Error ? e.message : 'Cannot load domains.');
        } finally {
            setLoading(false);
        }
    }, [instance, accounts, isAuthenticated]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const verifiedCount = domains.filter(d => d.isVerified).length;

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Total Domains</span>
                        <div className="billing-stat-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
                            <Globe size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : domains.length || '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Verified</span>
                        <div className="billing-stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : verifiedCount || '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Unverified</span>
                        <div className="billing-stat-icon" style={{ color: (domains.length - verifiedCount) > 0 ? '#ef4444' : '#10b981', background: (domains.length - verifiedCount) > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
                            <XCircle size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : (domains.length - verifiedCount) || '0'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Default</span>
                        <div className="billing-stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                            <Star size={20} />
                        </div>
                    </div>
                    <span className="billing-stat-value billing-stat-value-sm">{loading ? '...' : domains.find(d => d.isDefault)?.id || '—'}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Cannot load domains</strong><p>{error}</p></div>
                    <button onClick={loadData} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            {/* Loading */}
            {loading && domains.length === 0 && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải domains...</p></div>
            )}

            {/* Domains Table */}
            {domains.length > 0 && (
                <div className="billing-section">
                    <div className="billing-section-header">
                        <h3>Tenant Domains</h3>
                        <button onClick={loadData} className="billing-refresh-btn" disabled={loading} title="Refresh">
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Domain</th>
                                    <th>Auth Type</th>
                                    <th>Verified</th>
                                    <th>Default</th>
                                    <th>Services</th>
                                </tr>
                            </thead>
                            <tbody>
                                {domains.map(domain => (
                                    <tr key={domain.id}>
                                        <td className="billing-table-name">
                                            <Globe size={14} style={{ marginRight: '0.35rem', opacity: 0.5 }} />
                                            {domain.id}
                                        </td>
                                        <td>
                                            <span className="license-status-badge" style={{
                                                color: domain.authenticationType === 'Federated' ? '#a78bfa' : '#60a5fa',
                                                background: domain.authenticationType === 'Federated' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                                            }}>
                                                <Shield size={10} /> {domain.authenticationType}
                                            </span>
                                        </td>
                                        <td>
                                            {domain.isVerified
                                                ? <CheckCircle size={16} color="#10b981" />
                                                : <XCircle size={16} color="#ef4444" />
                                            }
                                        </td>
                                        <td>{domain.isDefault ? <Star size={16} color="#f59e0b" /> : '—'}</td>
                                        <td className="billing-table-type">
                                            {domain.supportedServices.length > 0
                                                ? domain.supportedServices.join(', ')
                                                : '—'
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Portal Links */}
            <div className="billing-section">
                <h3>Domain Portals</h3>
                <div className="management-grid">
                    {[
                        { title: 'Entra Custom Domains', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/ActiveDirectoryDomainServicesBlade', description: 'Manage custom domains' },
                        { title: 'M365 Admin Domains', url: 'https://admin.microsoft.com/Adminportal/Home#/Domains', description: 'M365 domain settings' },
                    ].map(link => (
                        <a key={link.title} href={link.url} target="_blank" rel="noopener noreferrer" className="management-card">
                            <div className="management-card-content">
                                <span className="management-card-icon"><Globe size={18} /></span>
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
