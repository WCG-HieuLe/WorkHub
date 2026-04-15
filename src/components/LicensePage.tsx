import React, { useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    Key, Server, Users, CheckCircle, AlertTriangle,
    ExternalLink, RefreshCw, Package, Search, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchLicenseSummary, fetchLicenseDetail, LicenseSummary, LicenseDetail, LicenseSku } from '@/services/azure/licenseService';
import { graphConfig } from '@/config/authConfig';
import { usePagination } from '@/hooks/usePagination';
import { useApiData } from '@/hooks/useApiData';

type Tab = 'subscriptions' | 'portals';
const PAGE_SIZE = 20;

const portalLinks = [
    { icon: <Key size={18} />, title: 'M365 Admin Licenses', url: 'https://admin.microsoft.com/Adminportal/Home#/licenses', description: 'Microsoft 365 license management' },
    { icon: <Server size={18} />, title: 'PP Admin Capacity', url: 'https://admin.powerplatform.microsoft.com/resources/capacity', description: 'Power Platform capacity & storage' },
];

const statusColors: Record<string, { color: string; bg: string; label: string }> = {
    success: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Active' },
    warning: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Warning' },
    suspended: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Suspended' },
    disabled: { color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)', label: 'Disabled' },
};

export const LicensePage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [tab, setTab] = useState<Tab>('subscriptions');
    
    const { data: data, loading, error, refresh: loadData } = useApiData<LicenseSummary | null>({
        key: `license_summary_${accounts[0]?.homeAccountId || 'default'}`,
        fetcher: async () => {
            const token = await acquireToken(instance, accounts[0], graphConfig.scopes);
            return await fetchLicenseSummary(token);
        },
        enabled: isAuthenticated && accounts.length > 0 && tab === 'subscriptions',
        initialData: null
    });

    const [search, setSearch] = useState('');
    const [selectedSku, setSelectedSku] = useState<LicenseSku | null>(null);
    const [detail, setDetail] = useState<LicenseDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const filteredSkus = data?.skus.filter(sku => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return sku.displayName.toLowerCase().includes(q) || sku.skuPartNumber.toLowerCase().includes(q);
    }) || [];

    const pagination = usePagination(filteredSkus, PAGE_SIZE);
    const skuCount = data ? data.skus.length : '—';

    const openDetail = async (sku: LicenseSku) => {
        setSelectedSku(sku);
        setDetail(null);
        setDetailLoading(true);
        try {
            const token = await acquireToken(instance, accounts[0], graphConfig.scopes);
            const d = await fetchLicenseDetail(token, sku.skuId, sku);
            setDetail(d);
        } catch (e) {
            console.error('Detail fetch error:', e);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedSku(null);
        setDetail(null);
    };

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Total SKUs</span>
                        <div className="billing-stat-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}><Package size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.totalSkus : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Total Seats</span>
                        <div className="billing-stat-icon" style={{ color: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)' }}><Users size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.totalSeats.toLocaleString() : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Assigned</span>
                        <div className="billing-stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}><CheckCircle size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.assignedSeats.toLocaleString() : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Usage</span>
                        <div className="billing-stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}><Key size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? `${data.usagePercent.toFixed(0)}%` : '—'}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Không thể tải dữ liệu license</strong><p>{error}</p></div>
                    <button onClick={() => loadData()} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            {/* Tabs + Search */}
            <div className="reports-header">
                <div className="logs-tabs">
                    <button className={`logs-tab ${tab === 'subscriptions' ? 'active' : ''}`} onClick={() => setTab('subscriptions')}>
                        <Package size={14} /> Subscriptions ({skuCount})
                    </button>
                    <button className={`logs-tab ${tab === 'portals' ? 'active' : ''}`} onClick={() => setTab('portals')}>
                        <ExternalLink size={14} /> Portals
                    </button>
                </div>
                <div className="reports-header-actions">
                    {tab === 'subscriptions' && pagination.totalPages > 1 && (
                        <div className="pagination-bar">
                            <button onClick={pagination.prev} disabled={!pagination.hasPrev} title="Previous page"><ChevronLeft size={14} /></button>
                            <span className="pagination-info">{pagination.page}/{pagination.totalPages}</span>
                            <button onClick={pagination.next} disabled={!pagination.hasNext} title="Next page"><ChevronRight size={14} /></button>
                        </div>
                    )}
                    {tab === 'subscriptions' && (
                        <div className="reports-search" style={{ width: 200 }}>
                            <Search size={14} className="reports-search-icon" />
                            <input type="text" placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                        </div>
                    )}
                    {tab !== 'portals' && (
                        <button onClick={() => loadData()} className="billing-refresh-btn" disabled={loading} title="Refresh">
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        </button>
                    )}
                </div>
            </div>

            {/* Loading */}
            {loading && !data && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải dữ liệu license...</p></div>
            )}

            {/* Subscriptions Tab */}
            {tab === 'subscriptions' && data && (
                <div className="billing-section">
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>License</th>
                                    <th>SKU</th>
                                    <th>Total</th>
                                    <th>Assigned</th>
                                    <th>Available</th>
                                    <th>Usage</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((sku) => {
                                    const usagePercent = sku.totalUnits > 0 ? (sku.assignedUnits / sku.totalUnits) * 100 : 0;
                                    const statusInfo = statusColors[sku.status];
                                    return (
                                        <tr key={sku.skuId} className="clickable-row" onClick={() => openDetail(sku)} style={{ cursor: 'pointer' }}>
                                            <td className="billing-table-name">{sku.displayName}</td>
                                            <td className="billing-table-type">{sku.skuPartNumber}</td>
                                            <td>{sku.totalUnits.toLocaleString()}</td>
                                            <td className="billing-table-cost">{sku.assignedUnits.toLocaleString()}</td>
                                            <td>{sku.availableUnits.toLocaleString()}</td>
                                            <td className="billing-table-share">
                                                <div className="billing-share-bar">
                                                    <div
                                                        className="billing-share-fill"
                                                        style={{
                                                            width: `${usagePercent}%`,
                                                            background: usagePercent > 90 ? '#ef4444' : usagePercent > 70 ? '#f59e0b' : 'var(--accent-primary)',
                                                        }}
                                                    />
                                                </div>
                                                <span>{usagePercent.toFixed(0)}%</span>
                                            </td>
                                            <td>
                                                <span className="license-status-badge" style={{ color: statusInfo.color, background: statusInfo.bg }}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredSkus.length === 0 && search && (
                        <div className="billing-loading" style={{ padding: '2rem' }}><Package size={24} style={{ opacity: 0.3 }} /><p>Không tìm thấy "{search}"</p></div>
                    )}
                </div>
            )}

            {/* Portals Tab */}
            {tab === 'portals' && (
                <div className="billing-section">
                    <div className="management-grid">
                        {portalLinks.map(link => (
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

            {/* Detail Sidebar */}
            {selectedSku && (
                <>
                    <div className="detail-sidebar-overlay" onClick={closeDetail} />
                    <div className="detail-sidebar">
                        <div className="detail-sidebar-header">
                            <h3>{selectedSku.displayName}</h3>
                            <button className="detail-sidebar-close" onClick={closeDetail} title="Close"><X size={16} /></button>
                        </div>
                        <div className="detail-sidebar-body">
                            {detailLoading ? (
                                <div className="detail-loading"><div className="spinner"></div> Loading details...</div>
                            ) : detail ? (
                                <>
                                    {/* Metadata */}
                                    <div className="detail-section">
                                        <div className="detail-section-title">License Info</div>
                                        <div className="detail-meta-grid">
                                            <div className="detail-meta-item"><div className="meta-label">SKU Part Number</div><div className="meta-value">{detail.sku.skuPartNumber}</div></div>
                                            <div className="detail-meta-item"><div className="meta-label">Status</div><div className="meta-value">{detail.rawCapabilityStatus || detail.sku.status}</div></div>
                                            <div className="detail-meta-item"><div className="meta-label">Total</div><div className="meta-value">{detail.sku.totalUnits}</div></div>
                                            <div className="detail-meta-item"><div className="meta-label">Assigned</div><div className="meta-value">{detail.sku.assignedUnits}</div></div>
                                            <div className="detail-meta-item"><div className="meta-label">Available</div><div className="meta-value">{detail.sku.availableUnits}</div></div>
                                            <div className="detail-meta-item"><div className="meta-label">Applies To</div><div className="meta-value">{detail.sku.appliesTo}</div></div>
                                            <div className="detail-meta-item"><div className="meta-label">Warning</div><div className="meta-value">{detail.sku.warningUnits}</div></div>
                                            <div className="detail-meta-item"><div className="meta-label">Suspended</div><div className="meta-value">{detail.sku.suspendedUnits}</div></div>
                                        </div>
                                    </div>

                                    {/* Service Plans */}
                                    {detail.servicePlans.length > 0 && (
                                        <div className="detail-section">
                                            <div className="detail-section-title">Service Plans ({detail.servicePlans.length})</div>
                                            <div className="detail-plan-list">
                                                {detail.servicePlans.map(sp => (
                                                    <span key={sp.servicePlanId} className={`detail-plan-badge ${sp.provisioningStatus === 'Success' ? 'active' : ''}`}>
                                                        {sp.servicePlanName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Assigned Users */}
                                    <div className="detail-section">
                                        <div className="detail-section-title">Assigned Users ({detail.assignedUsers.length}{detail.assignedUsers.length >= 50 ? '+' : ''})</div>
                                        {detail.assignedUsers.length > 0 ? (
                                            <div className="detail-user-list">
                                                {detail.assignedUsers.map(user => (
                                                    <div key={user.userPrincipalName} className="detail-user-item">
                                                        <div className="detail-user-avatar">{user.displayName?.[0] || '?'}</div>
                                                        <div className="detail-user-info">
                                                            <div className="user-name">{user.displayName}</div>
                                                            <div className="user-email">{user.mail || user.userPrincipalName}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="detail-loading">No assigned users found</div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="detail-loading">Could not load details</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
