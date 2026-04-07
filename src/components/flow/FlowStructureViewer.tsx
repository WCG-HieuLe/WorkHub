import React from 'react';
import { Zap, GitBranch, ArrowRight, Loader2 } from 'lucide-react';
import type { FlowStructure } from '@/services/azure/flowAnalyticsService';

/* ─── Design Tokens (Midnight Architect) ─── */
const MA = {
    card:         '#181f31',
    cardHigh:     '#232a3c',
    cardHighest:  '#2e3447',
    primary:      '#7cd2ed',
    primaryCtr:   '#409cb5',
    text:         '#dce1fb',
    textMuted:    '#889296',
} as const;

interface Props {
    structure: FlowStructure;
    loading?: boolean;
}

export const FlowStructureViewer: React.FC<Props> = ({ structure, loading }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-6 text-xs gap-2" style={{ color: MA.textMuted }}>
                <Loader2 size={14} className="animate-spin" style={{ color: MA.primary }} />
                Loading structure...
            </div>
        );
    }

    if (!structure.trigger && structure.actions.length === 0) {
        return (
            <div className="flex items-center justify-center py-6 text-xs" style={{ color: MA.textMuted }}>
                No structure data
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Trigger */}
            {structure.trigger && (
                <div
                    className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ background: `${MA.primaryCtr}12` }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${MA.primaryCtr}25` }}
                    >
                        <Zap size={14} style={{ color: MA.primary }} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: MA.textMuted }}>Trigger</div>
                        <div className="text-[11px] font-medium truncate" style={{ color: MA.text }}>{structure.trigger.name}</div>
                        <div className="text-[10px]" style={{ color: MA.textMuted }}>{structure.trigger.type}</div>
                    </div>
                </div>
            )}

            {/* Actions */}
            {structure.actions.length > 0 && (
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <GitBranch size={12} style={{ color: MA.textMuted }} />
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MA.textMuted }}>
                            Actions ({structure.actions.length})
                        </span>
                    </div>
                    <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
                        {structure.actions.map((action, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-colors cursor-default"
                                style={{ background: MA.cardHigh }}
                                onMouseEnter={e => (e.currentTarget.style.background = MA.cardHighest)}
                                onMouseLeave={e => (e.currentTarget.style.background = MA.cardHigh)}
                            >
                                <ArrowRight size={10} style={{ color: MA.textMuted }} className="shrink-0" />
                                <span className="truncate" style={{ color: MA.text }}>{action.name}</span>
                                <span className="ml-auto text-[10px] shrink-0" style={{ color: MA.textMuted }}>{action.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
