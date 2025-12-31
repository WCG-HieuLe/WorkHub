import { DayRecord } from '../types/types';
import { getDaysInMonth, getDayOfWeek, getStandardWorkValue, getStandardHours, formatDate } from '../utils/workUtils';

/**
 * Tạo mock data cho tháng được chỉ định
 * Mô phỏng các trường hợp: làm đủ, nghỉ phép, đi trễ, làm thiếu giờ
 */
export function generateMockData(year: number, month: number): DayRecord[] {
    const daysInMonth = getDaysInMonth(year, month);
    const records: DayRecord[] = [];
    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(year, month, day);
        const dayOfWeek = getDayOfWeek(year, month, day);
        const standardHours = getStandardHours(dayOfWeek);
        const standardWork = getStandardWorkValue(dayOfWeek);

        // Nếu là ngày trong tương lai, bỏ qua
        if (date > today) continue;

        // Ngày nghỉ (CN)
        if (dayOfWeek === 0) {
            records.push({
                date: dateStr,
                hoursWorked: 0,
                status: 'off',
                workValue: 0,
                note: 'Chủ nhật - Nghỉ'
            });
            continue;
        }

        // Random các trường hợp để demo
        const random = Math.random();

        if (random < 0.05) {
            // 5% ngày nghỉ phép
            records.push({
                date: dateStr,
                hoursWorked: 0,
                status: 'leave',
                workValue: 0,
                note: 'Nghỉ phép'
            });
        } else if (random < 0.1) {
            // 5% ngày đi trễ (làm thiếu giờ)
            const hoursWorked = Math.max(standardHours - 2, 2);
            records.push({
                date: dateStr,
                hoursWorked,
                status: 'late',
                workValue: hoursWorked / 8,
                note: `Đi trễ - chỉ làm ${hoursWorked}h`
            });
        } else if (random < 0.15) {
            // 5% làm thiếu giờ (không đủ 8h)
            const hoursWorked = Math.floor(Math.random() * 3) + 5; // 5-7 giờ
            records.push({
                date: dateStr,
                hoursWorked,
                status: 'normal',
                workValue: hoursWorked / 8,
                note: `Làm ${hoursWorked}h`
            });
        } else {
            // Làm đủ công
            records.push({
                date: dateStr,
                hoursWorked: standardHours,
                status: 'normal',
                workValue: standardWork,
                note: dayOfWeek === 6 ? 'Sáng thứ 7' : undefined
            });
        }
    }

    return records;
}

/**
 * Mock data cố định cho tháng 12/2024 để demo
 */
export function getDecember2024MockData(): DayRecord[] {
    return generateMockData(2024, 11); // month is 0-indexed
}
