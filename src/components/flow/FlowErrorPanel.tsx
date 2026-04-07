import React, { useState } from 'react';
import { ExternalLink, XCircle, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import type { FailureEntry } from '@/services/azure/flowAnalyticsService';

/* ─── Design Tokens (Midnight Architect) ─── */
const MA = {
    card:         '#181f31',
    cardLow:      '#141b2c',
    cardHigh:     '#232a3c',
    cardHighest:  '#2e3447',
    primary:      '#7cd2ed',
    error:        '#ffb4ab',
    text:         '#dce1fb',
    textMuted:    '#889296',
    outline:      '#3e484c',
} as const;

interface Props {
    failures: FailureEntry[];
}

export const FlowErrorPanel: React.FC<Props> = ({ failures }) => {
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = search.trim()
        ? failures.filter(f =>
            f.flowName.toLowerCase().includes(search.toLowerCase()) ||
            f.errorCode.toLowerCase().includes(search.toLowerCase()) ||
            f.errorMessage.toLowerCase().includes(search.toLowerCase()) ||
            f.failedAction.toLowerCase().includes(search.toLowerCase())
        )
        : failures;

    if (failures.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-2" style={{ color: MA.textMuted }}>
                <XCircle size={24} className="opacity-30" />
                <span className="text-xs">No failures in this period</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MA.textMuted }} />
                <input
                    type="text"
                    placeholder="Filter failures..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-lg transition-colors focus:outline-none"
                    style={{ background: MA.cardLow, color: MA.text, border: 'none' }}
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: MA.textMuted }}>
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Failures Table */}
            <div className="overflow-x-auto rounded-xl" style={{ background: MA.cardLow }}>
                <table className="w-full text-xs" style={{ color: MA.text }}>
                    <thead>
                        <tr style={{ background: MA.cardHigh }}>
                            <th className="text-left px-3 py-2.5 font-semibold uppercase text-[10px] tracking-wider" style={{ color: MA.textMuted }}>Flow</th>
                            <th className="text-left px-3 py-2.5 font-semibold uppercase text-[10px] tracking-wider" style={{ color: MA.textMuted }}>Error</th>
                            <th className="text-left px-3 py-2.5 font-semibold uppercase text-[10px] tracking-wider" style={{ color: MA.textMuted }}>Action</th>
                            <th className="text-left px-3 py-2.5 font-semibold uppercase text-[10px] tracking-wider" style={{ color: MA.textMuted }}>Time</th>
                            <th className="w-8 px-2 py-2.5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((f, idx) => {
                            const isExpanded = expandedId === f.runId;
                            return (
                                <React.Fragment key={idx}>
                                    <tr
                                        className="cursor-pointer transition-colors"
                                        style={{
                                            borderBottom: `1px solid ${MA.outline}15`,
                                            background: isExpanded ? `${MA.primary}08` : 'transparent',
                                        }}
                                        onClick={() => setExpandedId(isExpanded ? null : f.runId)}
                                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = MA.cardHigh; }}
                                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = isExpanded ? `${MA.primary}08` : 'transparent'; }}
                                    >
                                        <td className="px-3 py-2.5 font-medium max-w-[200px] truncate" style={{ color: MA.text }}>{f.flowName}</td>
                                        <td className="px-3 py-2.5">
                                            <span
                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                                style={{ background: `${MA.error}18`, color: MA.error }}
                                            >
                                                {f.errorCode}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 truncate max-w-[150px]" style={{ color: MA.textMuted }}>{f.failedAction}</td>
                                        <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: MA.textMuted }}>
                                            {f.startTime ? new Date(f.startTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                        <td className="px-2 py-2.5" style={{ color: MA.textMuted }}>
                                            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={5} className="p-0">
                                                <div className="px-4 py-3 space-y-2" style={{ background: '#070d1f' }}>
                                                    <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: MA.textMuted }}>Error Details</div>
                                                    <p className="text-[11px] break-words" style={{ color: MA.text }}>{f.errorMessage || 'No message'}</p>
                                                    <div className="flex gap-3 pt-1">
                                                        <a
                                                            href={f.flowUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] hover:underline"
                                                            style={{ color: MA.primary }}
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <ExternalLink size={10} /> Flow Details
                                                        </a>
                                                        <a
                                                            href={f.runUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] hover:underline"
                                                            style={{ color: MA.primary }}
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <ExternalLink size={10} /> Run Details
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="text-[10px] text-right" style={{ color: MA.textMuted }}>
                {filtered.length} of {failures.length} failures
            </div>
        </div>
    );
};
