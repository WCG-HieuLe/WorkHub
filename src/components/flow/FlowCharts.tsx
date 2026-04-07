import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { AggregatedStats } from '@/services/azure/flowAnalyticsService';

/* ─── Design Tokens (Midnight Architect) ─── */
const MA = {
    card:         '#181f31',
    cardHigh:     '#232a3c',
    primary:      '#7cd2ed',
    success:      '#4edea3',
    warning:      '#ffb95f',
    error:        '#ffb4ab',
    text:         '#dce1fb',
    textMuted:    '#889296',
} as const;

const DONUT_COLORS = [MA.success, MA.error, MA.warning, MA.primary];

const TOOLTIP_STYLE = {
    background: MA.card,
    border: 'none',
    borderRadius: '10px',
    fontSize: '11px',
    color: MA.text,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
};

// ── Status Donut Chart ──

interface DonutProps {
    succeeded: number;
    failed: number;
    running?: number;
}

export const StatusDonutChart: React.FC<DonutProps> = ({ succeeded, failed, running = 0 }) => {
    const data = [
        { name: 'Succeeded', value: succeeded },
        { name: 'Failed', value: failed },
        ...(running > 0 ? [{ name: 'Running', value: running }] : []),
    ].filter(d => d.value > 0);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-xs" style={{ color: MA.textMuted }}>
                No data
            </div>
        );
    }

    const total = succeeded + failed + running;

    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((_, idx) => (
                            <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold" style={{ fontFamily: 'Lexend, sans-serif', color: MA.text }}>
                    {total.toLocaleString()}
                </span>
                <span className="text-[10px]" style={{ color: MA.textMuted }}>Total Runs</span>
            </div>
        </div>
    );
};

// ── Error Trend Chart ──

interface TrendProps {
    stats: AggregatedStats;
}

export const ErrorTrendChart: React.FC<TrendProps> = ({ stats }) => {
    const chartData = Object.entries(stats.runsByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { passes, fails }]) => ({
            date: date.slice(5),
            passes,
            fails,
        }));

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-xs" style={{ color: MA.textMuted }}>
                No trend data
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="maColorPasses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={MA.success} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={MA.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="maColorFails" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={MA.error} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={MA.error} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: MA.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: MA.textMuted }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="passes" stroke={MA.success} fillOpacity={1} fill="url(#maColorPasses)" strokeWidth={2} />
                <Area type="monotone" dataKey="fails" stroke={MA.error} fillOpacity={1} fill="url(#maColorFails)" strokeWidth={2} />
            </AreaChart>
        </ResponsiveContainer>
    );
};

// ── Top Flows Chart ──

interface TopFlowsProps {
    topFlows: AggregatedStats['topFlows'];
}

export const TopFlowsChart: React.FC<TopFlowsProps> = ({ topFlows }) => {
    const data = topFlows.slice(0, 5).map(f => ({
        name: f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name,
        count: f.count,
    }));

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-xs" style={{ color: MA.textMuted }}>
                No data
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: MA.textMuted }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: MA.text }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill={MA.primary} radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
        </ResponsiveContainer>
    );
};
