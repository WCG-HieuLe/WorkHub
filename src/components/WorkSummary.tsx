import React from 'react';
import { MonthSummary, DayRecord } from '@/types/types';

interface WorkSummaryProps {
    summary: MonthSummary;
    year: number;
    month: number;
}

export const WorkSummary: React.FC<WorkSummaryProps> = React.memo(({ summary, year, month }) => {
    const percentage = summary.standardDays > 0
        ? Math.round((summary.actualDays / summary.standardDays) * 100)
        : 0;

    const getProgressColor = (): string => {
        if (percentage >= 100) return '#10b981';
        if (percentage >= 80) return '#f59e0b';
        return '#ef4444';
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    return (
        <div className="work-summary">
            <div className="summary-header">
                <h2>📊 Tổng kết {monthNames[month]} {year}</h2>
                <a
                    href="https://wecare-ii.crm5.dynamics.com/main.aspx?appid=7c0ada0d-cf0d-f011-998a-6045bd1cb61e&newWindow=true&pagetype=entitylist&etn=crdfd_bangchamconghangngay&viewid=a0425dbf-9e97-477c-b77e-c98bf88b1657&viewType=1039"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link-icon"
                    title="Xem dữ liệu gốc"
                >
                    🔗
                </a>
            </div>

            <div className="summary-cards">
                <div className="summary-card standard">
                    <div className="card-icon">📋</div>
                    <div className="card-content">
                        <span className="card-value">{summary.standardDays}</span>
                        <span className="card-label">Công chuẩn</span>
                    </div>
                </div>

                <div className="summary-card actual">
                    <div className="card-icon">✅</div>
                    <div className="card-content">
                        <span className="card-value">{summary.actualDays.toFixed(1)}</span>
                        <span className="card-label">Công thực tế</span>
                    </div>
                </div>

                <div className="summary-card difference">
                    <div className="card-icon">{summary.actualDays >= summary.standardDays ? '🎉' : '⚠️'}</div>
                    <div className="card-content">
                        <span className={`card-value ${summary.actualDays >= summary.standardDays ? 'positive' : 'negative'}`}>
                            {summary.actualDays >= summary.standardDays ? '+' : ''}
                            {(summary.actualDays - summary.standardDays).toFixed(1)}
                        </span>
                        <span className="card-label">Chênh lệch</span>
                    </div>
                </div>
            </div>

            <div className="progress-section">
                <div className="progress-header">
                    <span>Tiến độ công</span>
                    <span className="progress-percent">{percentage}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: getProgressColor()
                        }}
                    />
                </div>
            </div>

            {summary.insufficientDays.length > 0 && (
                <div className="insufficient-section">
                    <h3>⚠️ Ngày không đủ công ({summary.insufficientDays.length} ngày)</h3>
                    <div className="insufficient-list">
                        {summary.insufficientDays.map((day: DayRecord) => (
                            <div key={day.date} className="insufficient-item">
                                <span className="insufficient-date">{formatDate(day.date)}</span>
                                <span className="insufficient-hours">
                                    {day.hoursWorked}h (thiếu {8 - day.hoursWorked}h)
                                </span>
                                {day.note && <span className="insufficient-note">{day.note}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});
