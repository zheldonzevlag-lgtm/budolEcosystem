import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Formats a date string or object to Manila Time (PHT).
 * @param date - The date to format.
 * @param formatStr - The format string to use.
 * @returns The formatted date string.
 */
export function formatManilaTime(date: string | Date | number, formatStr = 'yyyy-MM-dd HH:mm:ss') {
    if (!date) return '-';
    try {
        const timeZone = 'Asia/Manila';
        const zonedDate = toZonedTime(new Date(date), timeZone);
        return format(zonedDate, formatStr);
    } catch (error) {
        console.error('Date formatting error:', error);
        return date.toString();
    }
}
