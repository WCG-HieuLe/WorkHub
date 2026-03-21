import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    FileText, Users, Shield, RefreshCw, AlertTriangle, CheckCircle,
    XCircle, Clock, ExternalLink, Search, MapPin, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchSignInLogs, fetchAuditEvents, SignInLog, AuditEvent } from '@/services/azure/auditService';
import { graphConfig } from '@/config/authConfig';
import { usePagination } from '@/hooks/usePagination';

type Tab = 'signins' | 'audit';
const PAGE_SIZE = 20;

export const LogsPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const [tab, setTab] = useState<Tab>('signins');
    const [search, setSearch] = useState('');

    // Lazy-loaded data per tab
    const [signIns, setSignIns] = useState<SignInLog[]>([]);
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadedTabs = useRef<Set<Tab>>(new Set());

    const loadTab = useCallback(async (targetTab: Tab, force = false) => {
        if (!isAuthenticated || accounts.length === 0) return;
        if (!force && loadedTabs.current.has(targetTab)) return;

        setLoading(true);
        setError(null);
        try {
            const token = await acquireToken(instance, accounts[0], graphConfig.scopes);
            if (targetTab === 'signins') {
                const data = await fetchSignInLogs(token, 50);
                setSignIns(data);
            } else {
                const data = await fetchAuditEvents(token, 50);
                setAuditEvents(data);
            }
            loadedTabs.current.add(targetTab);
        } catch (e) {
            console.error(`Audit ${targetTab} error:`, e);
            setError(e instanceof Error ? e.message : 'Cannot load audit logs.');
        } finally {
            setLoading(false);
        }
    }, [instance, accounts, isAuthenticated]);

    useEffect(() => {
        loadTab(tab);
    }, [tab, loadTab]);

    // Filtering
    const filteredSignIns = signIns.filter(log => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return log.userDisplayName?.toLowerCase().includes(q) || log.appDisplayName?.toLowerCase().includes(q) || log.ipAddress?.toLowerCase().includes(q);
    });

    const filteredAudit = auditEvents.filter(event => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return event.activityDisplayName?.toLowerCase().includes(q) || event.category?.toLowerCase().includes(q);
    });

    // Pagination
    const signInPagination = usePagination(filteredSignIns, PAGE_SIZE);
    const auditPagination = usePagination(filteredAudit, PAGE_SIZE);

    const successCount = signIns.filter(s => s.status?.errorCode === 0).length;
    const failCount = signIns.filter(s => s.status?.errorCode !== 0).length;
    const signInCount = loadedTabs.current.has('signins') ? signIns.length : '—';
    const auditCount = loadedTabs.current.has('audit') ? auditEvents.length : '—';

    const activePagination = tab === 'signins' ? signInPagination : auditPagination;

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Sign-ins</span>
                        <div className="billing-stat-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}><Users size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading && tab === 'signins' ? '...' : signInCount}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Successful</span>
                        <div className="billing-stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}><CheckCircle size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading && tab === 'signins' ? '...' : loadedTabs.current.has('signins') ? successCount : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Failed</span>
                        <div className="billing-stat-icon" style={{ color: failCount > 0 ? '#ef4444' : '#10b981', background: failCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}><XCircle size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading && tab === 'signins' ? '...' : loadedTabs.current.has('signins') ? failCount : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Audit Events</span>
                        <div className="billing-stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}><FileText size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading && tab === 'audit' ? '...' : auditCount}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Cannot load audit logs</strong><p>{error}</p></div>
                    <button onClick={() => loadTab(tab, true)} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            {/* Tabs + Search */}
            <div className="reports-header">
                <div className="logs-tabs">
                    <button className={`logs-tab ${tab === 'signins' ? 'active' : ''}`} onClick={() => setTab('signins')}>
                        <Users size={14} /> Sign-in Logs ({signInCount})
                    </button>
                    <button className={`logs-tab ${tab === 'audit' ? 'active' : ''}`} onClick={() => setTab('audit')}>
                        <Shield size={14} /> Audit Events ({auditCount})
                    </button>
                </div>
                <div className="reports-header-actions">
                    {activePagination.totalPages > 1 && (
                        <div className="pagination-bar">
                            <button onClick={activePagination.prev} disabled={!activePagination.hasPrev} title="Previous page"><ChevronLeft size={14} /></button>
                            <span className="pagination-info">{activePagination.page}/{activePagination.totalPages}</span>
                            <button onClick={activePagination.next} disabled={!activePagination.hasNext} title="Next page"><ChevronRight size={14} /></button>
                        </div>
                    )}
                    <div className="reports-search" style={{ width: 200 }}>
                        <Search size={14} className="reports-search-icon" />
                        <input type="text" placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                    </div>
                    <button onClick={() => loadTab(tab, true)} className="billing-refresh-btn" disabled={loading} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải {tab === 'signins' ? 'sign-in logs' : 'audit events'}...</p></div>
            )}

            {/* Sign-in Logs */}
            {tab === 'signins' && !loading && loadedTabs.current.has('signins') && (
                <div className="billing-section">
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Application</th>
                                    <th>Status</th>
                                    <th>IP / Location</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {signInPagination.items.map(log => {
                                    const isSuccess = log.status?.errorCode === 0;
                                    return (
                                        <tr key={log.id}>
                                            <td className="billing-table-name">{log.userDisplayName || log.userPrincipalName}</td>
                                            <td>{log.appDisplayName || '—'}</td>
                                            <td>
                                                {isSuccess ? (
                                                    <span className="license-status-badge" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}><CheckCircle size={12} /> Success</span>
                                                ) : (
                                                    <span className="license-status-badge" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} title={log.status?.failureReason}><XCircle size={12} /> Failed</span>
                                                )}
                                            </td>
                                            <td className="billing-table-type">
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <MapPin size={12} /> {log.ipAddress || '—'}{log.location?.countryOrRegion ? ` (${log.location.countryOrRegion})` : ''}
                                                </span>
                                            </td>
                                            <td className="billing-table-type">
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Clock size={12} /> {new Date(log.createdDateTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}

            {/* Audit Events */}
            {tab === 'audit' && !loading && loadedTabs.current.has('audit') && (
                <div className="billing-section">
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Activity</th>
                                    <th>Category</th>
                                    <th>Initiated By</th>
                                    <th>Result</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditPagination.items.map(event => {
                                    const initiator = event.initiatedBy?.user?.displayName || event.initiatedBy?.app?.displayName || '—';
                                    const isSuccess = event.result === 'success';
                                    return (
                                        <tr key={event.id}>
                                            <td className="billing-table-name">{event.activityDisplayName}</td>
                                            <td>{event.category}</td>
                                            <td>{initiator}</td>
                                            <td>
                                                <span className="license-status-badge" style={{
                                                    color: isSuccess ? '#10b981' : '#ef4444',
                                                    background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                }}>{event.result}</span>
                                            </td>
                                            <td className="billing-table-type">
                                                {new Date(event.activityDateTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
                <h3>Audit Portals</h3>
                <div className="management-grid">
                    {[
                        { title: 'Entra Sign-in Logs', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/SignInLogsMenuBlade', description: 'Full sign-in log viewer' },
                        { title: 'Entra Audit Logs', url: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/AuditLogsBlade', description: 'Directory audit events' },
                    ].map(link => (
                        <a key={link.title} href={link.url} target="_blank" rel="noopener noreferrer" className="management-card">
                            <div className="management-card-content">
                                <span className="management-card-icon"><FileText size={18} /></span>
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
