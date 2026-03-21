import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { Search, ExternalLink, BarChart3, RefreshCw, AlertTriangle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { acquireToken } from '@/services/azure/tokenService';
import { fetchAllReports, PBIReport } from '@/services/azure/powerbiService';
import { powerBIConfig, msalConfig } from '@/config/authConfig';

export const ReportsPage: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [search, setSearch] = useState('');
    const [reports, setReports] = useState<PBIReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<PBIReport | null>(null);
    const [iframeLoading, setIframeLoading] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const loadReports = useCallback(async () => {
        if (!isAuthenticated || accounts.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const token = await acquireToken(instance, accounts[0], powerBIConfig.scopes);
            const pbiReports = await fetchAllReports(token);
            setReports(pbiReports);

            // Default: all workspace groups collapsed
            const groups: Record<string, boolean> = {};
            for (const r of pbiReports) {
                groups[r.workspaceName] = false;
            }
            setExpandedGroups(groups);
        } catch (e) {
            console.error('PBI Reports error:', e);
            setError(e instanceof Error ? e.message : 'Cannot load reports from Power BI API.');
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, [instance, accounts, isAuthenticated]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    // Group reports by workspace
    const workspaces = useMemo(() => {
        const wsMap = new Map<string, PBIReport[]>();
        for (const report of reports) {
            const existing = wsMap.get(report.workspaceName) || [];
            existing.push(report);
            wsMap.set(report.workspaceName, existing);
        }
        return Array.from(wsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [reports]);

    // Filtered workspaces based on search
    const filteredWorkspaces = useMemo(() => {
        if (!search.trim()) return workspaces;
        const q = search.toLowerCase();
        return workspaces
            .map(([wsName, wsReports]) => {
                const filtered = wsReports.filter(
                    r => r.name.toLowerCase().includes(q) || wsName.toLowerCase().includes(q)
                );
                return [wsName, filtered] as [string, PBIReport[]];
            })
            .filter(([, wsReports]) => wsReports.length > 0);
    }, [search, workspaces]);

    const toggleGroup = (wsName: string) => {
        setExpandedGroups(prev => ({ ...prev, [wsName]: !prev[wsName] }));
    };

    const handleSelectReport = (report: PBIReport) => {
        if (selectedReport?.id === report.id) return;
        setSelectedReport(report);
        setIframeLoading(true);
        // Collapse the app's main navigation sidebar
        window.dispatchEvent(new CustomEvent('workhub:collapse-sidebar'));
    };

    const totalReports = reports.length;

    // Build iframe-compatible embed URL with autoAuth
    const getEmbedIframeUrl = (report: PBIReport) => {
        // Extract tenant ID from authority URL
        const authority = msalConfig.auth.authority || '';
        const tenantId = authority.split('/').pop() || '';
        // Power BI embed URL with autoAuth for seamless SSO in iframe
        return `https://app.powerbi.com/reportEmbed?reportId=${report.id}&groupId=${report.workspaceId}&autoAuth=true&ctid=${tenantId}`;
    };

    return (
        <div className="reports-page">
            {/* Sidebar */}
            <aside className="reports-sidebar">
                <div className="reports-sidebar-header">
                    <div className="reports-search">
                        <Search size={14} className="reports-search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm report..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="reports-search-input"
                        />
                    </div>
                    <button onClick={loadReports} className="reports-refresh-btn" disabled={loading} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="reports-sidebar-error">
                        <AlertTriangle size={14} />
                        <span>{error}</span>
                        <button onClick={loadReports} className="reports-retry-link">Thử lại</button>
                    </div>
                )}

                {/* Loading */}
                {loading && reports.length === 0 && (
                    <div className="reports-sidebar-loading">
                        <div className="spinner" />
                        <span>Đang tải...</span>
                    </div>
                )}

                {/* Report list */}
                <div className="reports-sidebar-list">
                    {filteredWorkspaces.map(([wsName, wsReports]) => (
                        <div key={wsName} className="reports-ws-group">
                            <button
                                className="reports-ws-header"
                                onClick={() => toggleGroup(wsName)}
                            >
                                {expandedGroups[wsName]
                                    ? <ChevronDown size={14} />
                                    : <ChevronRight size={14} />
                                }
                                <span className="reports-ws-name">{wsName}</span>
                                <span className="reports-ws-count">{wsReports.length}</span>
                            </button>

                            {expandedGroups[wsName] && (
                                <div className="reports-ws-items">
                                    {wsReports.map(report => (
                                        <button
                                            key={report.id}
                                            className={`reports-item ${selectedReport?.id === report.id ? 'active' : ''}`}
                                            onClick={() => handleSelectReport(report)}
                                            title={report.name}
                                        >
                                            <BarChart3 size={14} className="reports-item-icon" />
                                            <span className="reports-item-name">{report.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {!loading && filteredWorkspaces.length === 0 && reports.length > 0 && (
                        <div className="reports-sidebar-empty">
                            <Search size={16} />
                            <span>Không tìm thấy report</span>
                        </div>
                    )}

                    {!loading && reports.length === 0 && !error && (
                        <div className="reports-sidebar-empty">
                            <BarChart3 size={16} />
                            <span>Không có report</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {totalReports > 0 && (
                    <div className="reports-sidebar-footer">
                        <span>{totalReports} reports</span>
                    </div>
                )}
            </aside>

            {/* Viewer */}
            <main className="reports-viewer">
                {selectedReport ? (
                    <>
                        <div className="reports-viewer-header">
                            <div className="reports-viewer-title">
                                <BarChart3 size={16} />
                                <h3>{selectedReport.name}</h3>
                                <span className="reports-viewer-workspace">{selectedReport.workspaceName}</span>
                            </div>
                            <a
                                href={selectedReport.webUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="reports-open-btn"
                                title="Open in Power BI"
                            >
                                <ExternalLink size={14} />
                                <span>Open in Power BI</span>
                            </a>
                        </div>
                        <div className="reports-iframe-container">
                            {iframeLoading && (
                                <div className="reports-iframe-loading">
                                    <Loader2 size={24} className="spin" />
                                    <span>Đang tải report...</span>
                                </div>
                            )}
                            <iframe
                                key={selectedReport.id}
                                src={getEmbedIframeUrl(selectedReport)}
                                className="reports-iframe"
                                title={selectedReport.name}
                                allowFullScreen
                                onLoad={() => setIframeLoading(false)}
                            />
                        </div>
                    </>
                ) : (
                    <div className="reports-viewer-empty">
                        <BarChart3 size={48} className="reports-viewer-empty-icon" />
                        <h3>Chọn report để xem</h3>
                        <p>Chọn một report từ danh sách bên trái để xem trực tiếp tại đây</p>
                    </div>
                )}
            </main>
        </div>
    );
};
