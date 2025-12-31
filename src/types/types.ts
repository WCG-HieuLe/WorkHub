export interface DayRecord {
    date: string;          // YYYY-MM-DD
    hoursWorked: number;   // Số giờ làm thực tế
    status: 'normal' | 'late' | 'leave' | 'off' | 'holiday' | 'warning';
    workValue: number;     // 0, 0.5, hoặc 1 công
    sogiolam?: number;     // crdfd_sogiolam (Dataverse)
    ghichu?: string;       // crdfd_ghichu (Dataverse)
    note?: string;
    checkIn?: string;      // Giờ vào
    checkOut?: string;     // Giờ ra
    recordId?: string;     // Dataverse record ID for updates
    registration?: {       // Thông tin đăng ký
        id: string;
        type: number;
        typeName: string;
        hours: number;
        status: string;
    };
}

export interface MonthSummary {
    standardDays: number;  // Công chuẩn trong tháng
    actualDays: number;    // Công thực tế
    insufficientDays: DayRecord[];  // Danh sách ngày thiếu giờ
}
