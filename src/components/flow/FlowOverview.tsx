import React, { useState, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { Activity, AlertTriangle, CheckCircle, Shield, Loader2, Square, BarChart3, XCircle } from 'lucide-react';
import { StatusDonutChart, ErrorTrendChart, TopFlowsChart } from './FlowCharts';
import { FlowErrorPanel } from './FlowErrorPanel';
import {
    fetchAllFlowsRunsBatched,
    stopScanning,
    clearRunsCache,
    type AggregatedStats,
} from '@/services/azure/flowAnalyticsService';
import type { FlowDefinition } from '@/services/azure/powerPlatformService';

/* ─── Design Tokens (Midnight Architect) ─── */
const MA = {
    surface:      '#0c1324',
    card:         '#181f31',
    cardLow:      '#141b2c',
    cardHigh:     '#232a3c',
    cardHighest:  '#2e3447',
    primary:      '#7cd2ed',
    primaryCtr:   '#409cb5',
    success:      '#4edea3',
    warning:      '#ffb95f',
    error:        '#ffb4ab',
    text:         '#dce1fb',
    textMuted:    '#889296',
    shadow:       '0 12px 40px rgba(0, 101, 122, 0.06)',
} as const;

interface Props {
    flows: FlowDefinition[];
}

const DAYS_OPTIONS = [
    { value: 1, label: 'Today' },
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
];

export const FlowOverview: React.FC<Props> = ({ flows }) => {
    const { instance, accounts } = useMsal();

    const [daysRange, setDaysRange] = useState(1);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState<AggregatedStats | null>(null);
    const [activeChart, setActiveChart] = useState<'failures' | null>(null);

    const activatedFlows = flows.filter(f => f.state === 'Activated');
    const draftFlows = flows.filter(f => f.state !== 'Activated');

    const startScan = useCallback(async () => {
        if (!accounts[0] || scanning) return;
        setScanning(true);
        setProgress(0);
        setStats(null);
        clearRunsCache();

        try {
            const result = await fetchAllFlowsRunsBatched(
                instance,
                accounts[0],
                activatedFlows.map(f => ({ id: f.id, name: f.name })),
                daysRange,
                (processed, partialStats) => {
                    setProgress(Math.round((processed / activatedFlows.length) * 100));
                    setStats(partialStats);
                },
            );
            setStats(result);
        } catch (err) {
            console.error('[FlowOverview] scan error:', err);
        } finally {
            setScanning(false);
            setProgress(100);
        }
    }, [instance, accounts, activatedFlows, daysRange, scanning]);

    const handleStop = () => {
        stopScanning();
        setScanning(false);
    };

    const successRate = stats
        ? stats.totalRuns > 0
            ? ((stats.successfulRuns / stats.totalRuns) * 100).toFixed(1)
            : '—'
        : '—';

    const healthScore = stats
        ? stats.totalRuns > 0
            ? Math.round(100 - (stats.failedRuns / stats.totalRuns) * 100)
            : 100
        : null;

    return (
        <div className="space-y-5">
            {/* ── Scan Controls ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                    {DAYS_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { setDaysRange(opt.value); setStats(null); }}
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
                            style={daysRange === opt.value
                                ? { background: `linear-gradient(135deg, ${MA.primaryCtr}, ${MA.primary})`, color: '#002e39' }
                                : { background: MA.cardLow, color: MA.textMuted }
                            }
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {scanning ? (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: `${MA.error}15`, color: MA.error }}
                        >
                            <Square size={12} /> Stop
                        </button>
                    ) : (
                        <button
                            onClick={startScan}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: `linear-gradient(135deg, ${MA.primaryCtr}, ${MA.primary})`, color: '#002e39' }}
                        >
                            <BarChart3 size={13} /> Scan {activatedFlows.length} flows
                        </button>
                    )}
                </div>
            </div>

            {/* ── Progress Bar ── */}
            {scanning && (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]" style={{ color: MA.textMuted }}>
                        <span className="flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" style={{ color: MA.primary }} /> Scanning...
                        </span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: MA.cardHigh }}>
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${MA.primaryCtr}, ${MA.primary})` }}
                        />
                    </div>
                </div>
            )}

            {/* ── Scan Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <ScanStatCard
                    icon={<Activity size={16} />}
                    label="Total Flows"
                    value={flows.length.toString()}
                    sub={`${activatedFlows.length} active · ${draftFlows.length} draft`}
                    tint={MA.primary}
                />
                <ScanStatCard
                    icon={<CheckCircle size={16} />}
                    label="Succeeded"
                    value={stats?.successfulRuns?.toLocaleString() || '—'}
                    sub={stats ? `${successRate}% success rate` : 'Run scan to view'}
                    tint={MA.success}
                />
                <ScanStatCard
                    icon={<AlertTriangle size={16} />}
                    label="Failed"
                    value={stats?.failedRuns?.toLocaleString() || '—'}
                    sub={stats?.recentFailures?.length ? `${stats.recentFailures.length} recent` : '—'}
                    tint={MA.error}
                    onClick={() => stats?.recentFailures?.length && setActiveChart(activeChart === 'failures' ? null : 'failures')}
                    clickable={!!stats?.recentFailures?.length}
                />
                <ScanStatCard
                    icon={<Shield size={16} />}
                    label="Health Score"
                    value={healthScore !== null ? `${healthScore}%` : '—'}
                    sub={stats?.unsharedFlows?.length ? `${stats.unsharedFlows.length} unshared` : 'System health'}
                    tint={healthScore !== null ? (healthScore >= 90 ? MA.success : healthScore >= 70 ? MA.warning : MA.error) : MA.primary}
                />
            </div>

            {/* ── Charts Grid ── */}
            {stats && stats.totalRuns > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ChartCard title="Status Distribution">
                        <StatusDonutChart succeeded={stats.successfulRuns} failed={stats.failedRuns} />
                    </ChartCard>
                    <ChartCard title="Error Trend">
                        <ErrorTrendChart stats={stats} />
                    </ChartCard>
                    <ChartCard title="Top Flows">
                        <TopFlowsChart topFlows={stats.topFlows} />
                    </ChartCard>
                </div>
            )}

            {/* ── Failures Drawer ── */}
            {activeChart === 'failures' && stats?.recentFailures && (
                <div className="rounded-xl p-4" style={{ background: MA.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'Lexend, sans-serif', color: MA.text }}>
                            <XCircle size={14} style={{ color: MA.error }} /> Recent Failures
                        </h3>
                        <button onClick={() => setActiveChart(null)} className="text-xs" style={{ color: MA.textMuted }}>
                            Close
                        </button>
                    </div>
                    <FlowErrorPanel failures={stats.recentFailures} />
                </div>
            )}

            {/* ── Empty State ── */}
            {!scanning && !stats && (
                <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: MA.textMuted }}>
                    <BarChart3 size={36} className="opacity-20" />
                    <p className="text-xs">Click "Scan" to analyze flow runs</p>
                </div>
            )}
        </div>
    );
};

/* ═══ Sub Components ═══ */

function ScanStatCard({ icon, label, value, sub, tint, onClick, clickable }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
    tint: string;
    onClick?: () => void;
    clickable?: boolean;
}) {
    return (
        <div
            className={`rounded-xl p-4 transition-all ${clickable ? 'cursor-pointer' : ''}`}
            style={{ background: `${tint}0a`, boxShadow: MA.shadow }}
            onClick={onClick}
            onMouseEnter={clickable ? (e) => { (e.currentTarget as HTMLElement).style.background = `${tint}14`; } : undefined}
            onMouseLeave={clickable ? (e) => { (e.currentTarget as HTMLElement).style.background = `${tint}0a`; } : undefined}
        >
            <div className="flex items-center justify-between mb-2">
                <span style={{ color: tint, opacity: 0.7 }}>{icon}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: MA.textMuted }}>
                    {label}
                </span>
            </div>
            <div className="text-xl font-bold" style={{ fontFamily: 'Lexend, sans-serif', color: MA.text }}>{value}</div>
            <div className="text-[10px] mt-1" style={{ color: MA.textMuted }}>{sub}</div>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl p-4" style={{ background: MA.card, boxShadow: MA.shadow }}>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: MA.textMuted }}>
                {title}
            </h3>
            {children}
        </div>
    );
}
