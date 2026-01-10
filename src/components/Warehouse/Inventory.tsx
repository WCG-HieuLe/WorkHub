import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Check, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { fetchInventory, getAccessToken, InventoryItem, InventoryPaginatedResponse } from '../../services/dataverseService';

export const InventoryTable: React.FC = () => {
    const { instance, accounts } = useMsal();
    const [data, setData] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [diffOnly, setDiffOnly] = useState(false);

    // UI State
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPreviousPage, setHasPreviousPage] = useState(false);
    const pageSize = 50;

    // Load data only when page changes AND we have a search term (or filters).
    // Initial load is skipped if no search term/filters.
    useEffect(() => {
        if (searchTerm.trim() || locationFilter || diffOnly) {
            loadData();
        }
    }, [currentPage]); // Only re-fetch on page change here. Search/Filter triggers manual load.

    const loadData = async () => {
        if (!accounts[0]) {
            setError('No authenticated account found');
            return;
        }

        // If no criteria, don't fetch (optional logic, but keep it for now as per previous behavior, unless user wants to see everything with a filter)
        if (!searchTerm.trim() && !locationFilter && !diffOnly) {
            setData([]);
            setTotalCount(0);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const accessToken = await getAccessToken(instance, accounts[0]);
            const response: InventoryPaginatedResponse = await fetchInventory(
                accessToken,
                currentPage,
                pageSize,
                searchTerm,
                locationFilter,
                diffOnly
            );

            setData(response.data);
            setTotalCount(response.totalCount);
            setHasNextPage(response.hasNextPage);
            setHasPreviousPage(response.hasPreviousPage);
        } catch (err) {
            console.error('Error loading Inventory:', err);
            setError('Failed to load data. Please try again.');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        loadData();
    };

    const applyFilters = () => {
        setCurrentPage(1);
        loadData();
        setIsFilterOpen(false);
    };

    const clearFilters = () => {
        setLocationFilter('');
        setDiffOnly(false);
        // Do we reload? Maybe not until 'Apply' or 'Search' is clicked? 
        // User expectation: Clear usually resets UI. Let's reset UI only.
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleNextPage = () => {
        if (hasNextPage) setCurrentPage(prev => prev + 1);
    };

    const handlePreviousPage = () => {
        if (hasPreviousPage) setCurrentPage(prev => prev - 1);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="h-full flex flex-col bg-[#1e1e2e] text-slate-200 p-6 overflow-hidden font-sans relative">

            {/* Search Bar Container */}
            <div className="w-full max-w-3xl mb-8 relative z-10">
                <div className="relative flex items-center w-full bg-white rounded-full shadow-lg shadow-blue-500/10 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-[#1e1e2e]">

                    {/* Search Icon */}
                    <div className="pl-4 pr-3 text-slate-400">
                        <Search className="w-5 h-5" />
                    </div>

                    {/* Input */}
                    <input
                        type="text"
                        placeholder="Search product name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 py-3 text-slate-700 placeholder-slate-400 bg-transparent border-none focus:outline-none focus:ring-0 text-sm"
                    />

                    {/* Clear Search X */}
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Divider */}
                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    {/* Filter Button */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-50 ${isFilterOpen || locationFilter || diffOnly ? 'text-blue-600' : 'text-slate-500'}`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                    </button>

                    {/* Search Run Button (Optional, Enter is primary, but clickable is good) */}
                    <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-6 py-3 font-medium text-sm hover:bg-blue-700 transition-colors"
                    >
                        Search
                    </button>
                </div>
                {/* Active Filter Indicators */}
                {(locationFilter || diffOnly) && (
                    <div className="flex flex-wrap gap-2 mt-3 ml-2">
                        {locationFilter && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Location: {locationFilter}
                            </span>
                        )}
                        {diffOnly && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <AlertCircle className="w-3 h-3" /> Differences Only
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Filter Sidebar Overlay */}
            {isFilterOpen && (
                <div className="absolute inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsFilterOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="relative w-80 h-full bg-[#252538] border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
                            <h2 className="font-semibold text-lg text-white">Filters</h2>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                                aria-label="Close filters"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 p-5 space-y-6 overflow-y-auto">
                            {/* Filter: Stock Status */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-300 uppercase tracking-wider">Inventory Status</label>
                                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:border-slate-600 transition-colors">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${diffOnly ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`}>
                                        {diffOnly && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={diffOnly}
                                        onChange={(e) => setDiffOnly(e.target.checked)}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm text-slate-200">Difference Only</span>
                                        <span className="text-xs text-slate-500">Show mismatch between Actual & Theory</span>
                                    </div>
                                </label>
                            </div>

                            {/* Filter: Location */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-300 uppercase tracking-wider">Warehouse Location</label>
                                <input
                                    type="text"
                                    placeholder="Enter location name..."
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <p className="text-xs text-slate-500">Search for specific zones or bins.</p>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-700/50 flex items-center gap-3 bg-[#1e1e2e]/50">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={applyFilters}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <p>Updating inventory data...</p>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64 text-red-400 gap-2 bg-red-500/10 rounded-xl border border-red-500/20">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                        <Search className="w-12 h-12 text-slate-600 mb-4" />
                        <p className="text-lg font-medium text-slate-300">No products found</p>
                        <p className="text-sm text-slate-500 max-w-xs text-center mt-2">
                            {(searchTerm || locationFilter || diffOnly)
                                ? "No Items match your search or filter criteria."
                                : "Enter a search term or apply filters to view inventory."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 pb-20"> {/* pb-20 for pagination space */}
                        {/* List Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-[#1e1e2e] z-0">
                            <div className="col-span-5 md:col-span-4">Product</div>
                            <div className="col-span-2 text-right hidden md:block">Actual</div>
                            <div className="col-span-2 text-right hidden md:block">Theoretical</div>
                            <div className="col-span-2 text-right hidden md:block">Diff (Lost)</div>
                            <div className="col-span-2 text-right">Location</div>
                        </div>

                        {/* List Items */}
                        {data.map((item) => (
                            <div
                                key={item.crdfd_kho_binh_dinhid}
                                className="group relative bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-blue-500/30 rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.005]"
                            >
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    {/* Product Info */}
                                    <div className="col-span-5 md:col-span-4 flex flex-col justify-center">
                                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-blue-300 transition-colors line-clamp-1" title={item.productName}>
                                            {item.productName || 'Unknown Product'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono text-slate-500 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">
                                                {item.crdfd_masp}
                                            </span>
                                            <span className="text-xs text-slate-500 bg-slate-700/30 px-1.5 py-0.5 rounded">
                                                {item.crdfd_onvi}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mobile View - Compact Numbers */}
                                    <div className="col-span-7 md:hidden flex justify-end gap-3 text-xs">
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-500">Actual</span>
                                            <span className="font-mono text-emerald-400 font-medium">
                                                {item.crdfd_tonkhothucte?.toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-500">Theo</span>
                                            <span className="font-mono text-slate-300">
                                                {item.crdfd_tonkholythuyet?.toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Desktop View - Stock Columns */}
                                    <div className="hidden md:block col-span-2 text-right">
                                        <div className="text-sm font-mono font-medium text-emerald-400 bg-emerald-500/5 inline-block px-2 py-1 rounded">
                                            {item.crdfd_tonkhothucte?.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="hidden md:block col-span-2 text-right">
                                        <div className="text-sm font-mono text-slate-300">
                                            {item.crdfd_tonkholythuyet?.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="hidden md:block col-span-2 text-right">
                                        {/* Difference Highlighting */}
                                        <div className={`text-sm font-mono inline-block px-2 py-0.5 rounded ${(item.crdfd_tonkhothucte || 0) !== (item.crdfd_tonkholythuyet || 0) ? 'text-red-400 bg-red-500/10' : 'text-slate-600'}`}>
                                            {(item.crdfd_tonkhothucte || 0) - (item.crdfd_tonkholythuyet || 0)}
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="hidden md:block col-span-2 text-right text-xs text-slate-400 truncate pl-2" title={item.warehouseLocationName}>
                                        {item.warehouseLocationName || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Footer */}
            {totalCount > 0 && (
                <div className="mt-auto pt-4 border-t border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm bg-[#1e1e2e]">
                    <div className="text-slate-500">
                        Showing <span className="font-medium text-slate-300">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium text-slate-300">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium text-slate-300">{totalCount}</span> results
                    </div>

                    <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                        <button
                            onClick={handlePreviousPage}
                            disabled={!hasPreviousPage}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-4 font-mono text-slate-300">
                            {currentPage} <span className="text-slate-600">/</span> {Math.max(1, totalPages)}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={!hasNextPage}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Next page"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
