import React from 'react';
import { WarehouseTables } from './WarehouseTables';

// Placeholder for other warehouse components if needed
export const Warehouse: React.FC = () => {
    // For now, we default to showing Tables.
    // Based on requirement: "section WAREHOUSE: child Tables"
    // This implies Warehouse is the main view.

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden p-4">
                <WarehouseTables />
            </div>
        </div>
    );
};
