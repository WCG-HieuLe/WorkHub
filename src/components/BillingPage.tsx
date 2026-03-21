import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
    DollarSign, TrendingUp, BarChart3,
    Cloud, CreditCard, Landmark, RefreshCw,
    ExternalLink, AlertTriangle, Server, Search,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchCurrentMonthCost, fetchTopResources, fetchCostForecast, BillingData } from '@/services/azure/costService';
import { getCachedBillingData, setCachedBillingData, clearBillingCache } from '@/services/azure/billingCache';
import { azureManagementConfig } from '@/config/authConfig';
import { usePagination } from '@/hooks/usePagination';

type Tab = 'overview' | 'resources' | 'portals';
const PAGE_SIZE = 20;

const portalLinks = [
    { icon: <Cloud size={18} />, title: 'Azure Cost Management', url: 'https://portal.azure.com/#view/Microsoft_Cost_Management/Menu/~/overview', description: 'Azure billing & cost analysis' },
    { icon: <CreditCard size={18} />, title: 'Microsoft 365 Billing', url: 'https://admin.cloud.microsoft/?#/billoverview', description: 'MS 365 subscription & billing' },
    { icon: <Landmark size={18} />, title: 'Google Cloud Billing', url: 'https://console.cloud.google.com/billing?project=wecare-ai-studio', description: 'Google Cloud billing dashboard' },
    { icon: <CreditCard size={18} />, title: 'Azure Invoices', url: 'https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/invoices', description: 'Download Azure invoices' },
];

function formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    if (dateStr.length === 8) {
        return `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}`;
    }
    return dateStr;
}

export const BillingPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [data, setData] = useState<BillingData | null>(() => getCachedBillingData());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>('portals');
    const [search, setSearch] = useState('');
    const loadedRef = useRef(!!getCachedBillingData());

    const loadData = useCallback(async (force = false) => {
        if (!isAuthenticated || accounts.length === 0) return;
        if (loadedRef.current && !force) return;
        if (force) clearBillingCache();
        setLoading(true);
        setError(null);
        try {
            const token = await acquireToken(instance, accounts[0], azureManagementConfig.scopes);

            // Step 1: Fetch daily cost FIRST → show chart immediately
            const costData = await fetchCurrentMonthCost(token);
            const partial: BillingData = {
                currentMonthCost: costData.total,
                dailyCosts: costData.daily,
                topResources: [],
                forecast: null,
                currency: costData.currency,
                lastUpdated: new Date().toISOString(),
            };
            setData(partial);

            // Step 2: Fetch resources (with delay to avoid 429)
            await new Promise(r => setTimeout(r, 1500));
            const resources = await fetchTopResources(token);
            const withResources: BillingData = { ...partial, topResources: resources };
            setData(withResources);

            // Step 3: Fetch forecast
            await new Promise(r => setTimeout(r, 1500));
            const forecast = await fetchCostForecast(token);
            const full: BillingData = {
                ...withResources,
                forecast: forecast ? { ...forecast, totalCost: costData.total } : null,
            };
            setData(full);
            setCachedBillingData(full);
            loadedRef.current = true;
        } catch (e) {
            console.error('Billing data error:', e);
            setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu billing.');
        } finally {
            setLoading(false);
        }
    }, [instance, accounts, isAuthenticated]);

    // Start loading immediately on mount (background while user sees Portals)
    useEffect(() => {
        loadData();
    }, [loadData]);

    const maxDailyCost = data ? Math.max(...data.dailyCosts.map(d => d.cost), 1) : 1;

    const filteredResources = data?.topResources.filter(r => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.resourceType.toLowerCase().includes(q);
    }) || [];

    const pagination = usePagination(filteredResources, PAGE_SIZE);
    const resourceCount = loadedRef.current ? (data?.topResources.length || 0) : '—';

    return (
        <div className="health-page">
            {/* Stats */}
            <div className="billing-stats">
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Current Month Spend</span>
                        <div className="billing-stat-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}><DollarSign size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? formatCurrency(data.currentMonthCost, data.currency) : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">EOM Forecast</span>
                        <div className="billing-stat-icon" style={{ color: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)' }}><TrendingUp size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data?.forecast ? formatCurrency(data.currentMonthCost + data.forecast.forecastCost, data.currency) : '—'}</span>
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Top Resource</span>
                        <div className="billing-stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}><Server size={20} /></div>
                    </div>
                    <span className="billing-stat-value billing-stat-value-sm">{loading ? '...' : data?.topResources[0] ? `${data.topResources[0].name}` : '—'}</span>
                    {data?.topResources[0] && (
                        <span className="billing-stat-sub">{formatCurrency(data.topResources[0].cost, data.currency)}</span>
                    )}
                </div>
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Resources Tracked</span>
                        <div className="billing-stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}><BarChart3 size={20} /></div>
                    </div>
                    <span className="billing-stat-value">{loading ? '...' : data ? data.topResources.length : '—'}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={20} />
                    <div><strong>Không thể tải dữ liệu billing</strong><p>{error}</p></div>
                    <button onClick={() => loadData(true)} className="billing-retry-btn"><RefreshCw size={14} /> Thử lại</button>
                </div>
            )}

            {/* Tabs */}
            <div className="reports-header">
                <div className="logs-tabs">
                    <button className={`logs-tab ${tab === 'portals' ? 'active' : ''}`} onClick={() => setTab('portals')}>
                        <ExternalLink size={14} /> Portals
                    </button>
                    <button className={`logs-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
                        <BarChart3 size={14} /> Daily Cost
                    </button>
                    <button className={`logs-tab ${tab === 'resources' ? 'active' : ''}`} onClick={() => setTab('resources')}>
                        <Server size={14} /> Resources ({resourceCount})
                    </button>
                </div>
                <div className="reports-header-actions">
                    {tab === 'resources' && pagination.totalPages > 1 && (
                        <div className="pagination-bar">
                            <button onClick={pagination.prev} disabled={!pagination.hasPrev} title="Previous page"><ChevronLeft size={14} /></button>
                            <span className="pagination-info">{pagination.page}/{pagination.totalPages}</span>
                            <button onClick={pagination.next} disabled={!pagination.hasNext} title="Next page"><ChevronRight size={14} /></button>
                        </div>
                    )}
                    {tab === 'resources' && (
                        <div className="reports-search" style={{ width: 200 }}>
                            <Search size={14} className="reports-search-icon" />
                            <input type="text" placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)} className="reports-search-input" />
                        </div>
                    )}
                    {tab !== 'portals' && (
                        <button onClick={() => loadData(true)} className="billing-refresh-btn" disabled={loading} title="Refresh">
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        </button>
                    )}
                </div>
            </div>

            {/* Loading */}
            {loading && !data && (
                <div className="billing-loading"><div className="spinner"></div><p>Đang tải dữ liệu billing...</p></div>
            )}

            {/* Overview Tab: Daily Cost Chart */}
            {tab === 'overview' && data && data.dailyCosts.length > 0 && (
                <div className="billing-section">
                    <div className="billing-chart">
                        {data.dailyCosts.map((day) => (
                            <div key={day.date} className="billing-chart-bar-group" title={`${formatDate(day.date)}: ${formatCurrency(day.cost, day.currency)}`}>
                                <div className="billing-chart-bar-wrapper">
                                    <div
                                        className="billing-chart-bar"
                                        style={{ height: `${Math.max((day.cost / maxDailyCost) * 100, 2)}%` }}
                                    />
                                </div>
                                <span className="billing-chart-label">{formatDate(day.date)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resources Tab */}
            {tab === 'resources' && data && (
                <div className="billing-section">
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Resource</th>
                                    <th>Type</th>
                                    <th>Cost</th>
                                    <th>Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((resource, i) => (
                                    <tr key={i}>
                                        <td className="billing-table-rank">{(pagination.page - 1) * PAGE_SIZE + i + 1}</td>
                                        <td className="billing-table-name">{resource.name}</td>
                                        <td className="billing-table-type">{resource.resourceType}</td>
                                        <td className="billing-table-cost">{formatCurrency(resource.cost, resource.currency)}</td>
                                        <td className="billing-table-share">
                                            <div className="billing-share-bar">
                                                <div
                                                    className="billing-share-fill"
                                                    style={{ width: `${(resource.cost / data.currentMonthCost) * 100}%` }}
                                                />
                                            </div>
                                            <span>{((resource.cost / data.currentMonthCost) * 100).toFixed(1)}%</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredResources.length === 0 && search && (
                        <div className="billing-loading" style={{ padding: '2rem' }}><Server size={24} style={{ opacity: 0.3 }} /><p>Không tìm thấy "{search}"</p></div>
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
        </div>
    );
};
