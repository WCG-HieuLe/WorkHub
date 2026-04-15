/**
 * ConfirmDialog — Reusable confirmation modal
 * Pattern: center screen, glassmorphism, danger/warning/info variants
 * Usage:
 *   <ConfirmDialog
 *     open={showConfirm}
 *     title="Xóa connection?"
 *     message="Hành động này không thể hoàn tác."
 *     confirmLabel="Xóa"
 *     variant="danger"
 *     loading={isDeleting}
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const variantConfig: Record<ConfirmVariant, {
    icon: React.ReactNode;
    color: string;
    bg: string;
    iconBg: string;
}> = {
    danger: {
        icon: <Trash2 size={22} />,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        iconBg: 'rgba(239, 68, 68, 0.15)',
    },
    warning: {
        icon: <AlertTriangle size={22} />,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        iconBg: 'rgba(245, 158, 11, 0.15)',
    },
    info: {
        icon: <Info size={22} />,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
        iconBg: 'rgba(59, 130, 246, 0.15)',
    },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    variant = 'danger',
    loading = false,
    onConfirm,
    onCancel,
}) => {
    const confirmBtnRef = useRef<HTMLButtonElement>(null);
    const config = variantConfig[variant];

    // Focus confirm button on open
    useEffect(() => {
        if (open) confirmBtnRef.current?.focus();
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) onCancel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, loading, onCancel]);

    if (!open) return null;

    return (
        <div className="confirm-dialog-overlay" onClick={!loading ? onCancel : undefined}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                {/* Icon */}
                <div className="confirm-dialog-icon" style={{ background: config.iconBg, color: config.color }}>
                    {config.icon}
                </div>

                {/* Content */}
                <h3 className="confirm-dialog-title">{title}</h3>
                {message && <p className="confirm-dialog-message">{message}</p>}

                {/* Actions */}
                <div className="confirm-dialog-actions">
                    <button
                        className="confirm-dialog-btn confirm-dialog-btn--cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        className="confirm-dialog-btn confirm-dialog-btn--confirm"
                        style={{ background: config.color }}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="confirm-dialog-spinner" />
                        ) : null}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
