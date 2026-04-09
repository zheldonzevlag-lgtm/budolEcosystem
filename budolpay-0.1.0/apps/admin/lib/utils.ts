import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format currency to Philippine Peso
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}

/**
 * Format date and time to readable string
 */
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

/**
 * Truncate string to specified length
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

/**
 * Get current time in UTC
 */
export function getNowUTC(): Date {
    return new Date();
}

/**
 * Format date to Manila time string
 */
export function formatManilaTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(d);
}

/**
 * Get current Manila date as string
 */
export function getManilaDateString(): string {
    return new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date());
}

/**
 * Calculates the next compliance audit date based on semi-annual cycle (Jan 15 / July 15)
 * Basis: BSP Circular 808 & PCI DSS Quarterly/Annual review standards
 */
export function getNextAuditDate(): string {
    const now = new Date();
    // Use Asia/Manila for current date calculation
    const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentYear = manilaTime.getFullYear();
    
    // Audit Cycle 1: Jan 15
    const janAudit = new Date(currentYear, 0, 15);
    // Audit Cycle 2: July 15
    const julyAudit = new Date(currentYear, 6, 15);
    
    let nextAudit: Date;
    if (manilaTime < janAudit) {
        nextAudit = janAudit;
    } else if (manilaTime < julyAudit) {
        nextAudit = julyAudit;
    } else {
        // Next year's Jan 15
        nextAudit = new Date(currentYear + 1, 0, 15);
    }
    
    return nextAudit.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
