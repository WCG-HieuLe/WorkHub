import React from 'react';
import { FlowMonitor } from './FlowMonitor';
import { TableGallery } from './TableGallery';

interface WarehouseLayoutProps {
    activeView?: 'tables' | 'flow';
}

export const WarehouseLayout: React.FC<WarehouseLayoutProps> = ({ activeView = 'tables' }) => {
    return (
        <div className="h-full flex flex-col gap-4 p-4">
            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {activeView === 'tables' && <TableGallery />}
                {activeView === 'flow' && <FlowMonitor />}
            </div>
        </div>
    );
};
