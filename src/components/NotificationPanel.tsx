import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { Bell, X, ExternalLink, Info, CheckCircle, AlertTriangle, XCircle, MessageSquare } from 'lucide-react';
import {
    getAccessToken,
    fetchNotifications,
    getCurrentSystemUserId,
    buildPowerAppsUrl,
    formatTimeAgo,
} from '@/services/dataverse';
import type { AppNotification } from '@/services/dataverse/notificationService';

// ── Icon mapping ──

const getNotifIcon = (icontype: number) => {
    switch (icontype) {
        case 100000000: return <Info size={16} className="notif-icon notif-icon--info" />;
        case 100000001: return <CheckCircle size={16} className="notif-icon notif-icon--success" />;
        case 100000002: return <XCircle size={16} className="notif-icon notif-icon--failure" />;
        case 100000003: return <AlertTriangle size={16} className="notif-icon notif-icon--warning" />;
        case 100000004: return <MessageSquare size={16} className="notif-icon notif-icon--mention" />;
        default: return <Info size={16} className="notif-icon notif-icon--info" />;
    }
};

const getPriorityClass = (priority: number) => {
    return priority === 200000001 ? 'notif-priority--high' : '';
};

// ── Component ──

export const NotificationPanel: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [systemUserId, setSystemUserId] = useState<string | null>(null);

    const panelRef = useRef<HTMLDivElement>(null);

    // Resolve systemuserid on mount
    useEffect(() => {
        const resolveUser = async () => {
            if (!isAuthenticated || accounts.length === 0) return;
            try {
                const token = await getAccessToken(instance, accounts[0]);
                const azureAdObjectId = accounts[0].localAccountId;
                const userId = await getCurrentSystemUserId(token, azureAdObjectId);
                if (userId) setSystemUserId(userId);
            } catch (e) {
                console.error('[NotificationPanel] Error resolving user:', e);
            }
        };
        resolveUser();
    }, [isAuthenticated, accounts, instance]);

    // Fetch notifications (silent = no loading spinner for background refresh)
    const loadNotifications = useCallback(async (silent = false) => {
        if (!isAuthenticated || !systemUserId || accounts.length === 0) return;
        if (!silent) setLoading(true);
        try {
            const token = await getAccessToken(instance, accounts[0]);
            const data = await fetchNotifications(token, systemUserId, 30);
            setNotifications(data);
        } catch (e) {
            console.error('[NotificationPanel] Error loading:', e);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [isAuthenticated, systemUserId, accounts, instance]);

    // Auto-refresh: fetch on mount + every 60s
    useEffect(() => {
        if (!systemUserId) return;

        // Initial fetch
        loadNotifications(false);

        // Poll every 5 minutes
        const interval = setInterval(() => {
            loadNotifications(true); // silent refresh
        }, 300_000);

        return () => clearInterval(interval);
    }, [systemUserId, loadNotifications]);

    // Also refresh when panel opens
    useEffect(() => {
        if (isOpen && systemUserId) {
            loadNotifications(true);
        }
    }, [isOpen, systemUserId, loadNotifications]);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close panel on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (iframeUrl) {
                    setIframeUrl(null);
                } else {
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [iframeUrl]);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
    };

    const handleActionClick = (url: string) => {
        const fullUrl = buildPowerAppsUrl(url);
        setIframeUrl(fullUrl);
        setIsOpen(false);
    };

    const notifCount = notifications.length;

    if (!isAuthenticated) return null;

    return (
        <>
            <div className="notif-container" ref={panelRef}>
                {/* Bell Icon */}
                <button
                    className="notif-bell-btn"
                    onClick={handleToggle}
                    title="Thông báo"
                    aria-label="Thông báo"
                >
                    <Bell size={18} />
                    {notifCount > 0 && (
                        <span className="notif-badge">
                            {notifCount > 99 ? '99+' : notifCount}
                        </span>
                    )}
                </button>

                {/* Dropdown Panel */}
                {isOpen && (
                    <div className="notif-panel">
                        <div className="notif-panel-header">
                            <h3>Thông báo</h3>
                            <span className="notif-count-label">{notifCount} thông báo</span>
                        </div>

                        <div className="notif-panel-body">
                            {loading && (
                                <div className="notif-loading">
                                    <div className="spinner notif-spinner"></div>
                                    <span>Đang tải...</span>
                                </div>
                            )}

                            {!loading && notifications.length === 0 && (
                                <div className="notif-empty">
                                    <Bell size={32} strokeWidth={1} />
                                    <p>Không có thông báo mới</p>
                                </div>
                            )}

                            {!loading && notifications.map((notif) => (
                                <div
                                    key={notif.appnotificationid}
                                    className={`notif-item ${getPriorityClass(notif.priority)}`}
                                >
                                    <div className="notif-item-icon">
                                        {getNotifIcon(notif.icontype)}
                                    </div>
                                    <div className="notif-item-content">
                                        <div className="notif-item-title">{notif.title}</div>
                                        <div className="notif-item-body">{notif.body}</div>
                                        <div className="notif-item-meta">
                                            <span className="notif-item-time">
                                                {formatTimeAgo(notif.createdon)}
                                            </span>
                                            {notif.priorityFormatted === 'High' && (
                                                <span className="notif-item-priority-badge">Ưu tiên cao</span>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        {notif.actions.length > 0 && (
                                            <div className="notif-item-actions">
                                                {notif.actions.map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        className="notif-action-btn"
                                                        onClick={() => handleActionClick(action.data.url)}
                                                    >
                                                        <ExternalLink size={12} />
                                                        {action.title}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Iframe Popup Modal — rendered via portal to escape stacking context */}
            {iframeUrl && ReactDOM.createPortal(
                <div className="notif-modal-overlay" onClick={() => setIframeUrl(null)}>
                    <div className="notif-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="notif-modal-header">
                            <h3>Chi tiết</h3>
                            <div className="notif-modal-header-actions">
                                <a
                                    href={iframeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="notif-modal-open-btn"
                                    title="Mở trong tab mới"
                                >
                                    <ExternalLink size={14} />
                                </a>
                                <button
                                    className="notif-modal-close-btn"
                                    onClick={() => setIframeUrl(null)}
                                    title="Đóng"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="notif-modal-body">
                            <iframe
                                src={iframeUrl}
                                title="Notification Detail"
                                className="notif-iframe"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
