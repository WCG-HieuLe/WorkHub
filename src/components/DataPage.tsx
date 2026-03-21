import React from 'react';
import { Database } from 'lucide-react';

export const DataPage: React.FC = () => {
    return (
        <div className="health-page">
            {/* Coming soon: Dataverse/BigQuery/Lakehouse data viewer */}
            <div className="billing-section" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <Database size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Data Viewer</h3>
                <p>Xem data trực tiếp từ Dataverse, BigQuery, và Fabric Lakehouse.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.75rem', opacity: 0.6 }}>🚧 Đang phát triển — Dataflow và Fabric đã có page riêng trên sidebar.</p>
            </div>
        </div>
    );
};
