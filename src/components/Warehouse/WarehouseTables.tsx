import React, { useState } from 'react';
import {
    Package,
    ShoppingCart,
    ClipboardList,
    AlertCircle,
    FileText,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Database,
    Users,
    Building2,
    RotateCcw
} from 'lucide-react';

// Interface for table card metadata
interface TableCard {
    id: string;
    name: string;
    icon: React.ElementType;
    count: number;
    color: string;
    group: 'logistics' | 'general';
    entityName?: string; // Dataverse entity logical name
}

// Warehouse tables data - organized by groups
const warehouseTables: TableCard[] = [
    // Logistics Group - 7 tables
    { id: 'inventory', name: 'Inventory', icon: Package, count: 1247, color: 'from-blue-500 to-cyan-500', group: 'logistics' },
    { id: 'transaction-sale', name: 'Transaction Sale', icon: ShoppingCart, count: 856, color: 'from-green-500 to-emerald-500', group: 'logistics' },
    { id: 'transaction-buy', name: 'Transaction Buy', icon: ClipboardList, count: 432, color: 'from-purple-500 to-pink-500', group: 'logistics' },
    { id: 'special-order', name: 'Special Order', icon: AlertCircle, count: 89, color: 'from-orange-500 to-red-500', group: 'logistics' },
    { id: 'special-event', name: 'Special Event', icon: FileText, count: 1523, color: 'from-indigo-500 to-blue-500', group: 'logistics' },
    { id: 'kiem-kho', name: 'Kiểm kho', icon: CheckSquare, count: 234, color: 'from-teal-500 to-green-500', group: 'logistics' },
    { id: 'tra-lai-hang-ban', name: 'Trả lại hàng bán', icon: RotateCcw, count: 156, color: 'from-rose-500 to-pink-500', group: 'logistics' },
    // General Group - 3 tables
    { id: 'customer', name: 'Customer', icon: Users, count: 342, color: 'from-pink-500 to-rose-500', group: 'general', entityName: 'crdfd_customers' },
    { id: 'supplier', name: 'Supplier', icon: Building2, count: 128, color: 'from-amber-500 to-orange-500', group: 'general', entityName: 'crdfd_suppliers' },
    { id: 'product', name: 'Product', icon: Database, count: 567, color: 'from-violet-500 to-purple-500', group: 'general', entityName: 'crdfd_productses' },
];

export const WarehouseTables: React.FC = () => {
    const [logisticsExpanded, setLogisticsExpanded] = useState(true);
    const [generalExpanded, setGeneralExpanded] = useState(true);

    const logisticsTables = warehouseTables.filter(t => t.group === 'logistics');
    const generalTables = warehouseTables.filter(t => t.group === 'general');

    const handleCardClick = (tableId: string) => {
        console.log('Navigate to table:', tableId);
        // TODO: Implement navigation to detail view
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-card)] rounded-xl overflow-hidden border border-[var(--border)] shadow-lg backdrop-blur-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-header)]">
                <h2 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Warehouse Tables</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    Quản lý các bảng dữ liệu kho hàng
                </p>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Logistics Group */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div
                        className="px-6 py-4 bg-[var(--bg-header)] border-b border-[var(--border)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                        onClick={() => setLogisticsExpanded(!logisticsExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <Package size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">Logistics</h3>
                                <p className="text-xs text-[var(--text-muted)]">{logisticsTables.length} tables</p>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-[var(--bg-input)] rounded-lg transition-colors">
                            {logisticsExpanded ? (
                                <ChevronUp size={20} className="text-[var(--text-secondary)]" />
                            ) : (
                                <ChevronDown size={20} className="text-[var(--text-secondary)]" />
                            )}
                        </button>
                    </div>

                    {/* Group Content */}
                    {logisticsExpanded && (
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-4">
                                {logisticsTables.map((table) => {
                                    const Icon = table.icon;
                                    return (
                                        <div
                                            key={table.id}
                                            onClick={() => handleCardClick(table.id)}
                                            className="group relative bg-[var(--bg-card)] border-2 border-[var(--border)] rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-[var(--accent-primary)] hover:shadow-lg hover:scale-105"
                                        >
                                            {/* Icon with gradient background */}
                                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${table.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                                <Icon size={24} className="text-white" />
                                            </div>

                                            {/* Table name */}
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 truncate" title={table.name}>
                                                {table.name}
                                            </h4>

                                            {/* Record count */}
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {table.count.toLocaleString()} records
                                            </p>

                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-[var(--accent-primary)] opacity-0 group-hover:opacity-5 rounded-lg transition-opacity pointer-events-none" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* General Group */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div
                        className="px-6 py-4 bg-[var(--bg-header)] border-b border-[var(--border)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                        onClick={() => setGeneralExpanded(!generalExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                                <Database size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">General</h3>
                                <p className="text-xs text-[var(--text-muted)]">{generalTables.length} tables</p>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-[var(--bg-input)] rounded-lg transition-colors">
                            {generalExpanded ? (
                                <ChevronUp size={20} className="text-[var(--text-secondary)]" />
                            ) : (
                                <ChevronDown size={20} className="text-[var(--text-secondary)]" />
                            )}
                        </button>
                    </div>

                    {/* Group Content */}
                    {generalExpanded && (
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-4">
                                {generalTables.map((table) => {
                                    const Icon = table.icon;
                                    return (
                                        <div
                                            key={table.id}
                                            onClick={() => handleCardClick(table.id)}
                                            className="group relative bg-[var(--bg-card)] border-2 border-[var(--border)] rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-[var(--accent-primary)] hover:shadow-lg hover:scale-105"
                                        >
                                            {/* Icon with gradient background */}
                                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${table.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                                <Icon size={24} className="text-white" />
                                            </div>

                                            {/* Table name */}
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 truncate" title={table.name}>
                                                {table.name}
                                            </h4>

                                            {/* Record count */}
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {table.count.toLocaleString()} records
                                            </p>

                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-[var(--accent-primary)] opacity-0 group-hover:opacity-5 rounded-lg transition-opacity pointer-events-none" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
