import React, { useState } from 'react';
import { Package, X, Table, ShoppingCart, PartyPopper, ClipboardList, Box, RotateCcw, Users, Building2, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TableInfo {
    id: string;
    title: string;
    icon: React.ReactNode;
    url: string;
    group: 'logistics' | 'general';
    entityName?: string;
}

export const TableGallery: React.FC = () => {
    const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
    const [logisticsExpanded, setLogisticsExpanded] = useState(true);
    const [generalExpanded, setGeneralExpanded] = useState(false);

    const tables: TableInfo[] = [
        // Logistics Group - 7 tables
        {
            id: 'inventory',
            title: 'Inventory',
            icon: <Package size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?forceUCI=1&pagetype=entitylist&etn=crdfd_kho_binh_dinh&viewid=ff39c606-b0dd-47a0-b2ea-158d8c3e1a48&viewType=1039&navbar=off&cmdbar=false',
            group: 'logistics'
        },
        {
            id: 'sales',
            title: 'Transaction Sale',
            icon: <Table size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_transactionsales&navbar=off&cmdbar=false',
            group: 'logistics'
        },
        {
            id: 'buy',
            title: 'Transaction Buy',
            icon: <ShoppingCart size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_transactionbuy&navbar=off&cmdbar=false',
            group: 'logistics'
        },
        {
            id: 'specialorder',
            title: 'Special Order',
            icon: <Box size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_specialorder&navbar=off&cmdbar=false',
            group: 'logistics'
        },
        {
            id: 'event',
            title: 'Special Event',
            icon: <PartyPopper size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_specialevent&navbar=off&cmdbar=false',
            group: 'logistics'
        },
        {
            id: 'kiemkho',
            title: 'Kiểm kho',
            icon: <ClipboardList size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_kiemkhoqr&navbar=off&cmdbar=false',
            group: 'logistics'
        },
        {
            id: 'trahang',
            title: 'Trả lại hàng bán',
            icon: <RotateCcw size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_oitrahangban&navbar=off&cmdbar=false',
            group: 'logistics'
        },
        // General Group - 3 tables
        {
            id: 'customer',
            title: 'Customer',
            icon: <Users size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_customers&navbar=off&cmdbar=false',
            group: 'general',
            entityName: 'crdfd_customers'
        },
        {
            id: 'supplier',
            title: 'Supplier',
            icon: <Building2 size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_suppliers&navbar=off&cmdbar=false',
            group: 'general',
            entityName: 'crdfd_suppliers'
        },
        {
            id: 'product',
            title: 'Product',
            icon: <Database size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_productses&navbar=off&cmdbar=false',
            group: 'general',
            entityName: 'crdfd_productses'
        }
    ];

    const logisticsTables = tables.filter(t => t.group === 'logistics');
    const generalTables = tables.filter(t => t.group === 'general');

    const renderTableGrid = (tablesToRender: TableInfo[]) => (
        <div className="table-gallery-grid">
            {tablesToRender.map((table) => (
                <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className="table-card"
                    title={table.title}
                >
                    <div className="table-card-icon">
                        {table.icon}
                    </div>
                    <span className="table-card-title">
                        {table.title}
                    </span>
                </button>
            ))}
        </div>
    );

    return (
        <div className="table-gallery-container">
            {/* Logistics Group */}
            <div className="table-group">
                <div
                    className="table-group-header"
                    onClick={() => setLogisticsExpanded(!logisticsExpanded)}
                >
                    <div className="table-group-header-left">
                        <div className="table-group-icon logistics">
                            <Package size={20} />
                        </div>
                        <div className="table-group-info">
                            <h3>Logistics</h3>
                            <span>{logisticsTables.length} tables</span>
                        </div>
                    </div>
                    <button className="table-group-toggle">
                        {logisticsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
                {logisticsExpanded && (
                    <div className="table-group-content">
                        {renderTableGrid(logisticsTables)}
                    </div>
                )}
            </div>

            {/* General Group */}
            <div className="table-group">
                <div
                    className="table-group-header"
                    onClick={() => setGeneralExpanded(!generalExpanded)}
                >
                    <div className="table-group-header-left">
                        <div className="table-group-icon general">
                            <Database size={20} />
                        </div>
                        <div className="table-group-info">
                            <h3>General</h3>
                            <span>{generalTables.length} tables</span>
                        </div>
                    </div>
                    <button className="table-group-toggle">
                        {generalExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
                {generalExpanded && (
                    <div className="table-group-content">
                        {renderTableGrid(generalTables)}
                    </div>
                )}
            </div>

            {/* Modal Popup - Uses Portal to escape layouts with backdrop-filter */}
            {selectedTable && createPortal(
                <div className="table-modal-overlay" onClick={() => setSelectedTable(null)}>
                    <div className="table-modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Floating Close Button */}
                        <button
                            onClick={() => setSelectedTable(null)}
                            className="table-modal-close-float"
                            title="Đóng"
                        >
                            <X size={24} />
                        </button>

                        {/* Modal Content - Iframe */}
                        <div className="table-modal-body">
                            <iframe
                                src={selectedTable.url}
                                className="table-modal-iframe"
                                title={`${selectedTable.title} View`}
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
