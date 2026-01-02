import React, { useState, useEffect } from 'react';

interface AuditLog {
    id: string;
    employee: string;
    modifiedBy: string;
    modifiedOn: string;
    checkIn: string;
    checkOut: string;
    department: string;
}

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_u-FV9xhpVkCcCQU-RyWZX7Fbm67qDMzAYo6pZiXn1Cw1SV_2RZvdsdV7fy5bL4kRRBfeY9zy5W5f/pub?gid=1068085002&single=true&output=csv';

// Parse CSV to array of objects
function parseCSV(csv: string): AuditLog[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    // Skip header row
    const dataRows = lines.slice(1);

    return dataRows.map((line, index) => {
        // Handle CSV with potential commas in values
        const values = line.split(',');
        return {
            id: values[6] || String(index), // __PowerAppsId__
            employee: values[0] || '',
            modifiedBy: values[1] || '',
            modifiedOn: values[2] || '',
            checkIn: values[3] || '',
            checkOut: values[4] || '',
            department: values[5] || '',
        };
    }).filter(log => log.employee); // Filter out empty rows
}

export const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const response = await fetch(SHEET_CSV_URL);
                if (!response.ok) throw new Error('Failed to fetch data');
                const csv = await response.text();
                const parsedLogs = parseCSV(csv);
                setLogs(parsedLogs);
            } catch (err) {
                console.error('Error fetching audit logs:', err);
                setError('Không thể tải dữ liệu từ Google Sheets');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        // Format: DD/MM/YYYY or DD/MM/YYYY : HH:mm:ss
        const parts = dateStr.split(' : ');
        return parts[0]; // Return just the date part
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '-';
        const parts = dateStr.split(' : ');
        return parts[1] || '-'; // Return time part
    };

    if (loading) {
        return (
            <div className="audit-logs">
                <div className="leave-list-container">
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="audit-logs">
                <div className="leave-list-container">
                    <div className="empty-state">
                        <p>⚠️ {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="audit-logs">
            {/* Header */}
            <div className="tab-navigation">
                <span className="tab-btn active">
                    📋 Audit Logs ({logs.length})
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <a
                        href="https://docs.google.com/spreadsheets/d/e/2PACX-1vR_u-FV9xhpVkCcCQU-RyWZX7Fbm67qDMzAYo6pZiXn1Cw1SV_2RZvdsdV7fy5bL4kRRBfeY9zy5W5f/pubhtml?gid=1068085002&single=true"
                        target="_blank"
                        rel="noreferrer"
                        className="external-link-icon"
                        title="Mở Google Sheet"
                    >
                        🔗
                    </a>
                </div>
            </div>

            {/* List View */}
            <div className="leave-list-container">
                {logs.length === 0 ? (
                    <div className="empty-state">
                        <p>Chưa có dữ liệu audit log.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="leave-table">
                            <thead>
                                <tr>
                                    <th>Nhân viên</th>
                                    <th>Người chỉnh sửa</th>
                                    <th>Ngày sửa</th>
                                    <th>Ngày CC</th>
                                    <th>Check-in</th>
                                    <th>Check-out</th>
                                    <th>Phòng ban</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="font-medium">{log.employee}</td>
                                        <td>{log.modifiedBy}</td>
                                        <td>{log.modifiedOn}</td>
                                        <td>{formatDate(log.checkIn)}</td>
                                        <td>
                                            <span className="audit-new-value">{formatTime(log.checkIn)}</span>
                                        </td>
                                        <td>
                                            <span className="audit-new-value">{formatTime(log.checkOut)}</span>
                                        </td>
                                        <td>{log.department}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
