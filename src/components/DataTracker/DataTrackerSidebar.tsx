import React, { useState } from 'react';
import { Database, TrendingUp, Users, Package, FileText, Truck, ChevronDown, ChevronRight } from 'lucide-react';

interface DataTrackerSidebarProps {
    selectedTable: string;
    onSelectTable: (table: string) => void;
}

interface TableGroup {
    name: string;
    icon: React.ReactNode;
    tables: { id: string; label: string; icon: React.ReactNode }[];
}

export const DataTrackerSidebar: React.FC<DataTrackerSidebarProps> = ({ selectedTable, onSelectTable }) => {
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['warehouse', 'sales']);

    const tableGroups: TableGroup[] = [
        {
            name: 'System',
            icon: <Database size={16} />,
            tables: [
                { id: 'system_process', label: 'Process', icon: <Database size={14} /> },
                { id: 'system_assistant', label: 'Assistant', icon: <Database size={14} /> },
                { id: 'system_knowledge', label: 'Knowledge', icon: <Database size={14} /> },
            ]
        },
        {
            name: 'KPI',
            icon: <TrendingUp size={16} />,
            tables: [
                { id: 'kpi_general', label: 'General', icon: <TrendingUp size={14} /> },
            ]
        },
        {
            name: 'Customer',
            icon: <Users size={16} />,
            tables: [
                { id: 'customer_list', label: 'Customer', icon: <Users size={14} /> },
            ]
        },
        {
            name: 'Warehouse',
            icon: <Package size={16} />,
            tables: [
                { id: 'warehouse_inventory', label: 'Inventory', icon: <Package size={14} /> },
                { id: 'warehouse_main', label: 'Warehouse', icon: <Package size={14} /> },
                { id: 'warehouse_audit', label: 'Danh sách kiểm hàng', icon: <FileText size={14} /> },
            ]
        },
        {
            name: 'Soạn hàng',
            icon: <FileText size={16} />,
            tables: [
                { id: 'sales_plan_1', label: 'Kế hoạch soạn hàng 1', icon: <FileText size={14} /> },
                { id: 'sales_plan_2', label: 'Kế hoạch soạn hàng 2', icon: <FileText size={14} /> },
            ]
        },
        {
            name: 'Vận tải',
            icon: <Truck size={16} />,
            tables: [
                { id: 'transport_main', label: 'Vận tải', icon: <Truck size={14} /> },
                { id: 'transport_delivery', label: 'Đơn vị vận chuyển', icon: <Truck size={14} /> },
            ]
        },
        {
            name: 'Xuất kho',
            icon: <Package size={16} />,
            tables: [
                { id: 'export_app', label: 'App Xuất kho', icon: <Package size={14} /> },
                { id: 'transaction_sales', label: 'Transaction Sales', icon: <Package size={14} /> },
                { id: 'export_delivery', label: 'Giao bù hàng sai lệch', icon: <FileText size={14} /> },
            ]
        },
    ];

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupName)
                ? prev.filter(g => g !== groupName)
                : [...prev, groupName]
        );
    };

    return (
        <div className="w-64 border-l border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Database size={16} className="text-[var(--accent-primary)]" />
                    Data Tables
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {tableGroups.map((group) => {
                    const isExpanded = expandedGroups.includes(group.name.toLowerCase());

                    return (
                        <div key={group.name} className="mb-1">
                            <button
                                onClick={() => toggleGroup(group.name.toLowerCase())}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
                            >
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    {group.icon}
                                    <span>{group.name}</span>
                                </div>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            {isExpanded && (
                                <div className="ml-2 mt-1 space-y-0.5">
                                    {group.tables.map((table) => (
                                        <button
                                            key={table.id}
                                            onClick={() => onSelectTable(table.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedTable === table.id
                                                    ? 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] border-l-2 border-[var(--accent-primary)]'
                                                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                                                }`}
                                        >
                                            {table.icon}
                                            <span className="truncate">{table.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
