import React, { useState } from 'react';
import { Database, Search, CheckCircle, Play } from 'lucide-react';

export const WarehouseCheck: React.FC = () => {
    const [query, setQuery] = useState('SELECT * FROM inventory WHERE stock < 10');
    const [results, setResults] = useState<any[] | null>(null);

    const handleRunQuery = () => {
        // Mock query execution
        setResults([
            { id: 'WH-003', name: 'Keyboard Keychron K2', stock: 0, status: 'Out of Stock' },
            { id: 'WH-005', name: 'Office Chair Miller', stock: 5, status: 'Low Stock' },
        ]);
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Data Check & Query</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Validate data integrity and run direct queries</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Query Editor */}
                <div className="glass-panel flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Database size={18} />
                        Query Editor
                    </div>
                    <div className="flex-1 p-0 relative">
                        <textarea
                            className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-[var(--bg-input)] text-[var(--text-primary)]"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            spellCheck={false}
                            aria-label="SQL Query Editor"
                            placeholder="Enter your SQL query here..."
                        />
                        <button
                            onClick={handleRunQuery}
                            className="absolute bottom-4 right-4 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <Play size={16} /> Run Query
                        </button>
                    </div>
                </div>

                {/* Results / Validation */}
                <div className="glass-panel flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Search size={18} />
                        Results
                    </div>
                    <div className="flex-1 p-4 overflow-auto">
                        {!results ? (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                                <Search size={48} className="mb-4 opacity-50" />
                                <p>Execute a query to see results here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[#10b98110] p-3 rounded-lg border border-[#10b98130]">
                                    <CheckCircle size={16} />
                                    Query executed successfully (2 rows returned)
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-secondary)]">
                                        <tr>
                                            <th className="px-4 py-2">ID</th>
                                            <th className="px-4 py-2">Name</th>
                                            <th className="px-4 py-2">Stock</th>
                                            <th className="px-4 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {results.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-[var(--bg-hover)]">
                                                <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{row.id}</td>
                                                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.name}</td>
                                                <td className="px-4 py-3 text-[var(--danger)] font-bold">{row.stock}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded text-xs bg-[#ef444410] text-[var(--danger)] border border-[#ef444430]">
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Health Checks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-4 flex items-center justify-between">
                    <div>
                        <div className="text-[var(--text-muted)] text-xs uppercase font-bold tracking-wider mb-1">Data Integrity</div>
                        <div className="text-lg font-semibold text-[var(--success)]">100% Healthy</div>
                    </div>
                    <CheckCircle className="text-[var(--success)]" size={24} />
                </div>
                <div className="glass-panel p-4 flex items-center justify-between">
                    <div>
                        <div className="text-[var(--text-muted)] text-xs uppercase font-bold tracking-wider mb-1">Sync Status</div>
                        <div className="text-lg font-semibold text-[var(--text-primary)]">Up to date</div>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-[var(--success)] animate-pulse"></div>
                </div>
                <div className="glass-panel p-4 flex items-center justify-between">
                    <div>
                        <div className="text-[var(--text-muted)] text-xs uppercase font-bold tracking-wider mb-1">Data Anomalies</div>
                        <div className="text-lg font-semibold text-[var(--text-primary)]">0 Detected</div>
                    </div>
                    <CheckCircle className="text-[var(--text-secondary)]" size={24} />
                </div>
            </div>
        </div>
    );
};

