import React from 'react';
import { WarehouseAI } from './WarehouseAI';
import { Activity, Share2, Database } from 'lucide-react';

export const WarehouseAnalysis: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-6 overflow-hidden gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">AI Analysis & Insights</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Deep dive into inventory trends and flow</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Visualizations Panel */}
                <div className="col-span-1 lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2">
                    {/* System Health & Flow Monitor */}
                    <div className="glass-panel p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] font-semibold">
                                <Activity size={20} className="text-[var(--accent-primary)]" />
                                Power Platform Flow Monitor
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]">
                                All Systems Operational
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { name: "Data Sync: MS Teams -> Dataverse", status: "success", time: "2 mins ago" },
                                { name: "Approval Flow: Stock Request", status: "success", time: "15 mins ago" },
                                { name: "Notification Service: Low Stock", status: "run", time: "Running..." }
                            ].map((flow, i) => (
                                <div key={i} className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border)] flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-1.5 rounded-md ${flow.status === 'success' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]'}`}>
                                            <Share2 size={14} />
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${flow.status === 'success' ? 'bg-[var(--success)]' : 'bg-[var(--accent-primary)] animate-pulse'}`}></div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-[var(--text-primary)] truncate" title={flow.name}>{flow.name}</div>
                                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{flow.time}</div>
                                        {flow.status === 'run' && <div className="text-[10px] text-[var(--accent-primary)] mt-1">Processing batch #291...</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Data Tracking & Modification History */}
                    <div className="glass-panel p-5 flex-1">
                        <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)] font-semibold">
                            <Database size={20} className="text-[var(--warning)]" />
                            Warehouse Data Audit Log
                        </div>
                        <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] border-b border-[var(--border)]">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Time</th>
                                        <th className="px-4 py-3 font-medium">User</th>
                                        <th className="px-4 py-3 font-medium">Action</th>
                                        <th className="px-4 py-3 font-medium">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
                                    {[
                                        { time: "10:42 AM", user: "HieuLe", action: "UPDATE", detail: "Updated stock count for GEN-001 (+50)", color: "text-[var(--info)]" },
                                        { time: "10:15 AM", user: "System_Bot", action: "SYNC", detail: "Auto-synced from Vendor Portal", color: "text-[var(--accent-primary)]" },
                                        { time: "09:30 AM", user: "Manager_01", action: "DELETE", detail: "Removed expecting delivery #9921", color: "text-[var(--error)]" },
                                        { time: "Yesterday", user: "HieuLe", action: "CREATE", detail: "Added new SKU category: Electronics", color: "text-[var(--success)]" },
                                    ].map((log, i) => (
                                        <tr key={i} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                            <td className="px-4 py-3 text-[var(--text-muted)] w-[120px]">{log.time}</td>
                                            <td className="px-4 py-3 font-medium w-[150px]">{log.user}</td>
                                            <td className={`px-4 py-3 font-bold text-xs w-[100px] ${log.color}`}>{log.action}</td>
                                            <td className="px-4 py-3 text-[var(--text-secondary)]">{log.detail}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* AI Chat Interface */}
                <div className="col-span-1 lg:col-span-4 h-full min-h-[400px] glass-panel overflow-hidden border-[var(--accent-primary)] shadow-[var(--shadow)]">
                    <WarehouseAI />
                </div>
            </div>
        </div>
    );
};

