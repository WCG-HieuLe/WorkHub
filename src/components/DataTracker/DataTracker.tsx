import React, { useState } from 'react';
import { DataTrackerTable } from './DataTrackerTable';
import { DataTrackerSidebar } from './DataTrackerSidebar';

export const DataTracker: React.FC = () => {
    const [selectedTable, setSelectedTable] = useState('transaction_sales');

    return (
        <div className="h-full flex overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <DataTrackerTable selectedTable={selectedTable} />
            </div>

            {/* Right Sidebar */}
            <DataTrackerSidebar
                selectedTable={selectedTable}
                onSelectTable={setSelectedTable}
            />
        </div>
    );
};
