import React, { useCallback, useMemo } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { fetchBillingDashboardData } from '@/services/azure/costService';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Calendar, Download, TrendingUp, Minus, Wallet, Activity, RefreshCw, AlertTriangle, Cloud, FileText, Globe, Server } from 'lucide-react';

function formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDateToDay(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export const BillingPage: React.FC = () => {
    const { data: dashboard, loading, error, refresh } = useApiData({
        key: `billing_dashboard`,
        fetcher: fetchBillingDashboardData,
        enabled: true
    });

    const loadData = useCallback(() => {
        refresh();
    }, [refresh]);

    const totalSpend = dashboard?.vendors.reduce((s, v) => s + v.totalCost, 0) || 0;
    
    // Process donut chart data
    const pieData = useMemo(() => {
        if (!dashboard) return [];
        return dashboard.vendors.map(v => ({
            name: v.name,
            value: v.totalCost,
            color: v.id === 'azure' ? '#3b82f6' : v.id === 'gcp' ? '#10b981' : '#f59e0b'
        }));
    }, [dashboard]);

    return (
        <div className="bg-zinc-950 text-zinc-50 min-h-screen pb-24 font-['Inter'] relative w-full h-full overflow-y-auto">
            
            {error && (
                <div className="m-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 absolute z-50 right-4 top-4 shadow-xl">
                    <AlertTriangle size={20} className="shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">Cannot load billing data</p>
                        <p className="text-xs opacity-80 mt-1">{error}</p>
                    </div>
                </div>
            )}

            <main className="flex-1 p-8 min-h-screen max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold tracking-tight">Billing Dashboard</h2>
                            <button onClick={loadData} disabled={loading} className="p-1.5 bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors">
                                <RefreshCw size={14} className={`text-violet-400 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <p className="text-zinc-500 text-sm">Monitor and analyze infrastructure costs across platforms.</p>
                        {dashboard && (
                            <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider font-semibold">Data As Of: {dashboard.lastUpdated}</p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-lg font-medium text-sm text-zinc-300">
                            <Download size={16} />
                            Export PDF
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-violet-400 hover:bg-violet-500 transition-colors text-zinc-950 rounded-lg font-semibold text-sm">
                            <Calendar size={16} />
                            This Month
                        </button>
                    </div>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/10 p-6 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-400"></div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Current Month Spend</p>
                        <div className="flex items-end justify-between">
                            <div>
                                <h3 className="text-3xl font-bold tracking-tight">
                                    {loading && !dashboard ? '...' : formatCurrency(totalSpend)}
                                </h3>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp size={14} className="text-emerald-400" />
                                    <span className="text-emerald-400 text-xs font-semibold">Live aggregate</span>
                                </div>
                            </div>
                            <div className="p-3 bg-violet-400/10 rounded-lg">
                                <Wallet size={24} className="text-violet-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/10 p-6 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#f59e0b]"></div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Month End Forecast</p>
                        <div className="flex items-end justify-between">
                            <div>
                                <h3 className="text-3xl font-bold tracking-tight">
                                    {loading && !dashboard ? '...' : formatCurrency(dashboard?.forecast || 0)}
                                </h3>
                                <div className="flex items-center gap-1 mt-1 text-[#f59e0b]">
                                    <Activity size={14} />
                                    <span className="text-xs font-semibold">Projected +24% vs Prev</span>
                                </div>
                            </div>
                            <div className="p-3 bg-[#f59e0b]/10 rounded-lg">
                                <Activity size={24} className="text-[#f59e0b]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/10 p-6 rounded-xl flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">M365 Breakdown</p>
                                <h3 className="text-lg font-bold tracking-tight">
                                    {loading && !dashboard ? '...' : formatCurrency(dashboard?.vendors.find(v => v.id === 'm365')?.totalCost || 0)}
                                </h3>
                            </div>
                        </div>
                        <div className="w-full flex h-2.5 rounded-full overflow-hidden mb-2">
                            {dashboard?.m365Breakdown.map((item, idx) => {
                                const m365Total = dashboard.vendors.find(v => v.id === 'm365')?.totalCost || 1;
                                const widthPercent = Math.max((item.cost / m365Total) * 100, 1);
                                return (
                                    <div key={idx} className="h-full" style={{ width: `${widthPercent}%`, backgroundColor: item.color }} title={`${item.name}: ${formatCurrency(item.cost)}`}></div>
                                );
                            })}
                            {!dashboard?.m365Breakdown.length && (
                                <div className="bg-zinc-800 h-full w-full"></div>
                            )}
                        </div>
                        <div className="flex gap-2 text-[10px] text-zinc-400 truncate mt-1">
                            {dashboard?.m365Breakdown.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                    <span>{item.name}</span>
                                </div>
                            ))}
                            {(dashboard?.m365Breakdown.length || 0) > 2 && <span className="opacity-50">...</span>}
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Cost Trend Area Chart */}
                    <div className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/10 p-6 rounded-xl flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-zinc-100">Daily Cost Trend</h4>
                            <select className="bg-transparent border-none outline-none text-xs text-zinc-500 focus:ring-0 cursor-pointer">
                                <option>Current Month</option>
                            </select>
                        </div>
                        <div className="flex-1 min-h-[220px] relative w-full pt-4">
                            {loading && !dashboard ? (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">Analyzing Daily Trend...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dashboard?.dailyTrend || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="violet-gradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                                                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '8px', fontSize: '12px' }}
                                            itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }}
                                            formatter={(value: any) => [formatCurrency(value), 'Cost']}
                                            labelFormatter={(label: any) => formatDateToDay(String(label))}
                                            labelStyle={{ color: '#a1a1aa' }}
                                        />
                                        <Area type="monotone" dataKey="cost" stroke="#a78bfa" strokeWidth={3} fill="url(#violet-gradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/10 p-6 rounded-xl flex flex-col">
                        <h4 className="font-bold mb-6 text-zinc-100">Cost by Service</h4>
                        <div className="flex flex-1 items-center justify-between gap-8 h-[220px]">
                            {loading && !dashboard ? (
                                <div className="w-full flex items-center justify-center text-zinc-600 text-sm">Processing Cost Dimensions...</div>
                            ) : (
                                <>
                                    <div className="relative w-40 h-40 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    innerRadius={60}
                                                    outerRadius={75}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '8px', fontSize: '12px' }}
                                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                    formatter={(value: any) => formatCurrency(value)}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1 pointer-events-none">
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total</span>
                                            <span className="text-lg font-bold text-zinc-100">{formatCurrency(totalSpend)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-4">
                                        {pieData.map((entry, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                                    <span className="text-sm font-medium text-zinc-300">{entry.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-zinc-100">{((entry.value / Math.max(totalSpend, 1)) * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Resources Table */}
                <div className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/10 rounded-xl overflow-hidden mb-8">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[rgba(24,24,27,0.5)]">
                        <h4 className="font-bold text-zinc-100">Top Resources by Spend</h4>
                        <button className="text-violet-400 text-xs font-semibold hover:text-violet-300 transition-colors tracking-wide">VIEW ALL RESOURCES</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-zinc-500 text-[10px] uppercase tracking-wider bg-zinc-900/50">
                                    <th className="px-6 py-4 font-semibold">Resource Name</th>
                                    <th className="px-6 py-4 font-semibold">Category</th>
                                    <th className="px-6 py-4 font-semibold">Cost</th>
                                    <th className="px-6 py-4 font-semibold">% of Total</th>
                                    <th className="px-6 py-4 font-semibold">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {(loading && !dashboard) ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-8"></div></td>
                                    </tr>
                                )) : dashboard?.topResources.slice(0, 5).map((resource, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-zinc-200">{resource.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-zinc-800 text-zinc-400 rounded border border-zinc-700/50">{resource.type}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-zinc-300">{formatCurrency(resource.cost)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 max-w-[120px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="bg-violet-400 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max((resource.cost / totalSpend) * 100, 1)}%` }}></div>
                                                </div>
                                                <span className="text-xs font-mono text-zinc-400 tabular-nums">{((resource.cost / Math.max(totalSpend, 1)) * 100).toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Minus size={16} className="text-zinc-600" />
                                        </td>
                                    </tr>
                                ))}
                                {dashboard?.topResources && dashboard.topResources.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-xs">No resources found for the current period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Portal Links (Including Azure Subscriptions requested explicitly) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a href="https://portal.azure.com" target="_blank" rel="noreferrer" className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/5 p-4 rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
                            <Cloud className="text-blue-400" size={18} />
                        </div>
                        <div>
                            <span className="block text-sm font-semibold text-zinc-200 leading-tight">Azure Prod</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 block">Subscription 1</span>
                        </div>
                    </a>
                    
                    <a href="https://portal.azure.com" target="_blank" rel="noreferrer" className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/5 p-4 rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
                            <Server className="text-indigo-400" size={18} />
                        </div>
                        <div>
                            <span className="block text-sm font-semibold text-zinc-200 leading-tight">Azure Dev</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 block">Subscription 2</span>
                        </div>
                    </a>

                    <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/5 p-4 rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                            <Globe className="text-emerald-400" size={18} />
                        </div>
                        <div>
                            <span className="block text-sm font-semibold text-zinc-200 leading-tight">GCP Console</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 block">Workspace & Cloud</span>
                        </div>
                    </a>

                    <a href="https://admin.microsoft.com" target="_blank" rel="noreferrer" className="bg-zinc-900/85 backdrop-blur-[8px] border border-violet-400/5 p-4 rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                            <FileText className="text-amber-400" size={18} />
                        </div>
                        <div>
                            <span className="block text-sm font-semibold text-zinc-200 leading-tight">M365 Admin</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 block">Licenses & Invoices</span>
                        </div>
                    </a>
                </div>
            </main>
        </div>
    );
}
