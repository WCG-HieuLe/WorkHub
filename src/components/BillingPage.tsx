import React, { useCallback, useMemo } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { fetchBillingDashboardData } from '@/services/azure/costService';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import {
    Calendar, Download, TrendingUp, TrendingDown, Minus,
    Wallet, Activity, RefreshCw, AlertTriangle,
    Cloud, FileText, Globe, Server, LayoutGrid,
} from 'lucide-react';

function formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency,
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
}

function formatDateToDay(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export const BillingPage: React.FC = () => {
    const { data: dashboard, loading, error, refresh } = useApiData({
        key: 'billing_dashboard',
        fetcher: fetchBillingDashboardData,
        enabled: true,
    });

    const loadData = useCallback(() => refresh(), [refresh]);

    const totalSpend = dashboard?.vendors.reduce((s, v) => s + v.totalCost, 0) || 0;
    const forecast   = dashboard?.forecast || 0;
    const azureCost  = dashboard?.vendors.find(v => v.id === 'azure')?.totalCost || 0;
    const gcpCost    = dashboard?.vendors.find(v => v.id === 'gcp')?.totalCost || 0;
    const m365Cost   = dashboard?.vendors.find(v => v.id === 'm365')?.totalCost || 0;

    const momPct = 24; // stub
    const isUp   = momPct >= 0;

    const pieData = useMemo(() => {
        if (!dashboard) return [];
        return dashboard.vendors.map(v => ({
            name: v.name, value: v.totalCost,
            color: v.id === 'azure' ? '#118DFF' : v.id === 'gcp' ? '#E66C37' : '#8B5CF6',
        }));
    }, [dashboard]);

    const portalLinks = [
        { href: 'https://portal.azure.com',         icon: <Cloud size={18} />,    label: 'Azure Prod',   sub: 'Subscription 1', color: '#118DFF', bg: 'rgba(17,141,255,0.1)' },
        { href: 'https://portal.azure.com',         icon: <Server size={18} />,   label: 'Azure Dev',    sub: 'Subscription 2', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
        { href: 'https://console.cloud.google.com', icon: <Globe size={18} />,    label: 'GCP Console',  sub: 'Workspace & Cloud', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        { href: 'https://admin.microsoft.com',      icon: <FileText size={18} />, label: 'M365 Admin',   sub: 'Licenses & Invoices', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    ];

    return (
        <div className="health-page">

            {/* Error */}
            {error && (
                <div className="billing-error">
                    <AlertTriangle size={18} />
                    <div>
                        <strong>Cannot load billing data</strong>
                        <p>{error}</p>
                    </div>
                    <button onClick={loadData} className="billing-retry-btn">
                        <RefreshCw size={14} /> Retry
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {dashboard && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Data as of: {dashboard.lastUpdated}
                        </span>
                    )}
                    <button onClick={loadData} disabled={loading} className="billing-refresh-btn" title="Refresh">
                        <RefreshCw size={13} className={loading ? 'spin' : ''} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 500,
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer',
                    }}>
                        <Download size={14} /> Export PDF
                    </button>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                        background: 'var(--accent-primary)', border: 'none',
                        borderRadius: '8px', color: '#fff', cursor: 'pointer',
                    }}>
                        <Calendar size={14} /> This Month
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="billing-stats">
                {/* Hero — Total */}
                <div className="billing-stat-card" style={{ borderColor: 'rgba(167,139,250,0.25)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--accent-primary), transparent)' }} />
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Total Spend</span>
                        <div className="billing-stat-icon" style={{ color: 'var(--accent-primary)', background: 'rgba(167,139,250,0.1)' }}>
                            <Wallet size={16} />
                        </div>
                    </div>
                    <span className="billing-stat-value" style={{ fontSize: '1.5rem' }}>
                        {loading && !dashboard ? '—' : formatCurrency(totalSpend)}
                    </span>
                    {dashboard && (
                        <span className="billing-stat-sub" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            color: isUp ? '#f59e0b' : '#10b981', fontSize: '0.7rem',
                        }}>
                            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {Math.abs(momPct)}% vs prev month
                        </span>
                    )}
                </div>

                {/* Azure */}
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Azure Cloud</span>
                        <div className="billing-stat-icon" style={{ color: '#118DFF', background: 'rgba(17,141,255,0.1)' }}>
                            <Cloud size={16} />
                        </div>
                    </div>
                    <span className="billing-stat-value" style={{ color: '#118DFF' }}>
                        {loading && !dashboard ? '—' : formatCurrency(azureCost)}
                    </span>
                </div>

                {/* GCP */}
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Google Cloud</span>
                        <div className="billing-stat-icon" style={{ color: '#E66C37', background: 'rgba(230,108,55,0.1)' }}>
                            <Globe size={16} />
                        </div>
                    </div>
                    <span className="billing-stat-value" style={{ color: '#E66C37' }}>
                        {loading && !dashboard ? '—' : formatCurrency(gcpCost)}
                    </span>
                </div>

                {/* M365 */}
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Microsoft 365</span>
                        <div className="billing-stat-icon" style={{ color: '#8B5CF6', background: 'rgba(139,92,246,0.1)' }}>
                            <LayoutGrid size={16} />
                        </div>
                    </div>
                    <span className="billing-stat-value" style={{ color: '#8B5CF6' }}>
                        {loading && !dashboard ? '—' : formatCurrency(m365Cost)}
                    </span>
                </div>

                {/* Forecast */}
                <div className="billing-stat-card">
                    <div className="billing-stat-header">
                        <span className="billing-stat-label">Forecast EOM</span>
                        <div className="billing-stat-icon" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}>
                            <Activity size={16} />
                        </div>
                    </div>
                    <span className="billing-stat-value" style={{ color: 'var(--text-secondary)' }}>
                        {loading && !dashboard ? '—' : `~${formatCurrency(forecast)}`}
                    </span>
                </div>
            </div>

            {/* Charts row */}
            <div className="billing-charts-row">
                {/* Area Chart */}
                <div className="billing-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="billing-section-header">
                        <h3>Daily Cost Trend</h3>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            fontSize: '0.65rem', fontWeight: 700, color: '#10b981',
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                            padding: '0.2rem 0.5rem', borderRadius: '20px',
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                            LIVE
                        </span>
                    </div>
                    <div style={{ height: 180 }}>
                        {loading && !dashboard ? (
                            <div className="billing-loading" style={{ padding: '2rem' }}>Loading trend...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dashboard?.dailyTrend || []} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="bg-area" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }}
                                        itemStyle={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}
                                        formatter={(v) => [formatCurrency(v as number), 'Cost']}
                                        labelFormatter={(l) => formatDateToDay(String(l))}
                                        labelStyle={{ color: 'var(--text-muted)' }}
                                    />
                                    <Area type="monotone" dataKey="cost" stroke="var(--accent-primary)" strokeWidth={2} fill="url(#bg-area)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Donut */}
                <div className="billing-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="billing-section-header">
                        <h3>Cost by Service</h3>
                        <span style={{
                            fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent-primary)',
                            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                            padding: '0.15rem 0.45rem', borderRadius: '20px',
                        }}>MTD</span>
                    </div>
                    {loading && !dashboard ? (
                        <div className="billing-loading" style={{ padding: '1rem' }}>Loading...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ position: 'relative', width: 130, height: 130 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">
                                            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }}
                                            formatter={(v) => formatCurrency(v as number)}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    pointerEvents: 'none',
                                }}>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(totalSpend)}</span>
                                </div>
                            </div>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {pieData.map((e, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {totalSpend > 0 ? ((e.value / totalSpend) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Resources Table */}
            <div className="billing-section" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="billing-section-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0 }}>Top Resources by Spend</h3>
                    <button style={{ background: 'none', border: 'none', fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer', letterSpacing: '0.05em' }}>
                        VIEW ALL
                    </button>
                </div>
                <div className="billing-table-wrapper">
                    <table className="billing-table">
                        <thead>
                            <tr>
                                <th>Resource Name</th>
                                <th>Category</th>
                                <th>Cost</th>
                                <th>% of Total</th>
                                <th>Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !dashboard
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        {[200, 100, 60, 120, 40].map((w, j) => (
                                            <td key={j}>
                                                <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, width: w, opacity: 0.5 }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                                : dashboard?.topResources.slice(0, 5).map((r, idx) => {
                                    const pct = totalSpend > 0 ? (r.cost / totalSpend) * 100 : 0;
                                    return (
                                        <tr key={idx}>
                                            <td className="billing-table-name">{r.name}</td>
                                            <td className="billing-table-type">{r.type}</td>
                                            <td className="billing-table-cost">{formatCurrency(r.cost)}</td>
                                            <td>
                                                <div className="billing-table-share">
                                                    <div className="billing-share-bar">
                                                        <div className="billing-share-fill" style={{ width: `${Math.max(pct, 1)}%` }} />
                                                    </div>
                                                    <span>{pct.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td><Minus size={14} style={{ color: 'var(--text-muted)' }} /></td>
                                        </tr>
                                    );
                                })}
                            {dashboard?.topResources?.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No resources found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Portal Links */}
            <div className="management-grid">
                {portalLinks.map((p) => (
                    <a key={p.label} href={p.href} target="_blank" rel="noreferrer" className="management-card">
                        <div className="management-card-content">
                            <span className="management-card-icon" style={{ color: p.color, background: p.bg }}>{p.icon}</span>
                            <div>
                                <h3>{p.label}</h3>
                                <p>{p.sub}</p>
                            </div>
                        </div>
                        <span className="management-card-arrow-container">
                            <Globe size={14} className="management-card-arrow" />
                        </span>
                    </a>
                ))}
            </div>

        </div>
    );
};
