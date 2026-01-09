import React, { useState } from 'react';
import { Package, X, Table, ShoppingCart, PartyPopper, ClipboardList, Box, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TableInfo {
    id: string;
    title: string;
    icon: React.ReactNode;
    url: string;
}

export const TableGallery: React.FC = () => {
    const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);

    const tables: TableInfo[] = [
        {
            id: 'inventory',
            title: 'Inventory',
            icon: <Package size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?forceUCI=1&pagetype=entitylist&etn=crdfd_kho_binh_dinh&viewid=ff39c606-b0dd-47a0-b2ea-158d8c3e1a48&viewType=1039&navbar=off&cmdbar=false'
        },
        {
            id: 'sales',
            title: 'Transaction Sale',
            icon: <Table size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_transactionsales&navbar=off&cmdbar=false'
        },
        {
            id: 'buy',
            title: 'Transaction Buy',
            icon: <ShoppingCart size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_transactionbuy&navbar=off&cmdbar=false'
        },
        {
            id: 'specialorder',
            title: 'Special Order',
            icon: <Box size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_specialorder&navbar=off&cmdbar=false'
        },
        {
            id: 'event',
            title: 'Special Event',
            icon: <PartyPopper size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_specialevent&navbar=off&cmdbar=false'
        },
        {
            id: 'kiemkho',
            title: 'Kiểm kho',
            icon: <ClipboardList size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_kiemkhoqr&navbar=off&cmdbar=false'
        },
        {
            id: 'trahang',
            title: 'Trả lại hàng bán',
            icon: <RotateCcw size={28} strokeWidth={1.5} />,
            url: 'https://wecare-ii.crm5.dynamics.com/main.aspx?pagetype=entitylist&etn=crdfd_oitrahangban&navbar=off&cmdbar=false'
        }
    ];

    return (
        <div className="table-gallery-container">
            <div className="table-gallery-grid">
                {tables.map((table) => (
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
