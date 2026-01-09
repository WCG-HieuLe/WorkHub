import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { fetchTransactionSales, getAccessToken, TransactionSales, TransactionSalesPaginatedResponse } from '../../services/dataverseService';

export const TransactionSalesTable: React.FC = () => {
    const { instance, accounts } = useMsal();
    const [data, setData] = useState<TransactionSales[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPreviousPage, setHasPreviousPage] = useState(false);
    const pageSize = 50;

    // Load data when component mounts or page changes
    useEffect(() => {
        loadData();
    }, [currentPage]);

    const loadData = async () => {
        if (!accounts[0]) {
            setError('No authenticated account found');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const accessToken = await getAccessToken(instance, accounts[0]);
            const response: TransactionSalesPaginatedResponse = await fetchTransactionSales(
                accessToken,
                currentPage,
                pageSize
            );

            setData(response.data);
            setTotalCount(response.totalCount);
            setHasNextPage(response.hasNextPage);
            setHasPreviousPage(response.hasPreviousPage);
        } catch (err) {
            console.error('Error loading Transaction Sales:', err);
            setError('Failed to load data. Please try again.');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (hasNextPage) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePreviousPage = () => {
        if (hasPreviousPage) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    // Format date helper
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-card)] rounded-xl overflow-hidden border border-[var(--border)] shadow-lg backdrop-blur-md">

            {/* Table Area */}
            <div className="flex-1 overflow-auto relative">
                {error ? (
                    <div className="flex items-center justify-center h-full text-red-400 gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                ) : (
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 bg-[var(--bg-card)] z-20 shadow-sm ring-1 ring-black/5">
                            <tr className="border-b border-[var(--border)]">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap bg-[var(--bg-card)]">Mã Phiếu Xuất</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap bg-[var(--bg-card)]">Chi Tiết Đơn Hàng</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap bg-[var(--bg-card)]">Tên Sản Phẩm</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap bg-[var(--bg-card)]">SL Giao (Kho)</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap bg-[var(--bg-card)]">ĐV Theo Kho</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap bg-[var(--bg-card)]">Ngày Giao TT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)] animate-pulse">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                        No transaction sales found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row) => (
                                    <tr
                                        key={row.crdfd_transactionsalesid}
                                        className="group transition-colors hover:bg-[var(--bg-hover)]"
                                    >
                                        <td className="px-4 py-3 text-[var(--accent-primary)] font-medium whitespace-nowrap hover:underline cursor-pointer">{row.crdfd_maphieuxuat}</td>
                                        <td className="px-4 py-3 text-[var(--text-primary)] whitespace-nowrap">{row.crdfd_idchitietonhang_name}</td>
                                        <td className="px-4 py-3 text-[var(--text-primary)] whitespace-nowrap max-w-[200px] truncate" title={row.crdfd_tensanphamtex}>{row.crdfd_tensanphamtex}</td>
                                        <td className="px-4 py-3 text-[var(--text-primary)] text-right font-mono whitespace-nowrap">{row.crdfd_soluonggiaotheokho}</td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{row.crdfd_onvitheokho}</td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{formatDate(row.crdfd_ngaygiaothucte)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer with Pagination */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-header)] flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">
                    Showing <span className="font-medium text-[var(--text-primary)]">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium text-[var(--text-primary)]">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium text-[var(--text-primary)]">{totalCount}</span> results
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePreviousPage}
                        disabled={!hasPreviousPage}
                        className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg border border-[var(--border)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                        title="Previous Page"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-medium text-[var(--text-primary)] px-4">
                        Page {currentPage} of {Math.max(1, totalPages)}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={!hasNextPage}
                        className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg border border-[var(--border)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                        title="Next Page"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
