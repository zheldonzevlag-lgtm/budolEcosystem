/**
 * Date Utilities for Budol Ecosystem
 * Standardizes timezone handling (Asia/Manila)
 */

/**
 * Gets the current time as a true UTC Date object
 * @returns {Date}
 */
export function getNowUTC() {
    return new Date();
}

/**
 * Formats a date string or object to Asia/Manila display time
 * Handles both true UTC and legacy "fake UTC" (shifted by 8h)
 * @param {Date|string} date 
 * @param {object} options 
 * @returns {string}
 */
export function formatManilaTime(date, options = {}) {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    // Heuristic to detect legacy "fake UTC" timestamps
    // If we have a timestamp that seems to be already shifted, we might need to handle it.
    // However, the cleanest way is to transition to real UTC and use this formatter.
    
    const defaultOptions = {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: options.showSeconds ? '2-digit' : undefined,
        hour12: true
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // If dateStyle or timeStyle is provided, individual date/time components must be removed
    // to avoid TypeError in Intl.DateTimeFormat
    if (options.dateStyle || options.timeStyle) {
        delete mergedOptions.year;
        delete mergedOptions.month;
        delete mergedOptions.day;
        delete mergedOptions.hour;
        delete mergedOptions.minute;
        delete mergedOptions.second;
        // Keep timeZone and hour12 as they are usually compatible or handled by styles
    }

    return d.toLocaleString('en-US', mergedOptions);
}

/**
 * Legacy support for the +8h manual offset
 * @deprecated Use true UTC and formatManilaTime instead
 */
export function getLegacyManilaISO() {
    return new Date().toISOString();
}

/**
 * Gets a YYYY-MM-DD date string in Asia/Manila timezone
 * @param {Date|string} date 
 * @returns {string}
 */
export function getManilaDateString(date = new Date()) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Calculates the next compliance audit date based on semi-annual cycle (Jan 15 / July 15)
 * Basis: BSP Circular 808 & PCI DSS Quarterly/Annual review standards
 * @returns {string} Formatted date string (e.g., "Jul 15, 2026")
 */
export function getNextAuditDate() {
    const now = new Date();
    // Use Asia/Manila for current date calculation
    const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentYear = manilaTime.getFullYear();
    
    // Audit Cycle 1: Jan 15
    const janAudit = new Date(currentYear, 0, 15);
    // Audit Cycle 2: July 15
    const julyAudit = new Date(currentYear, 6, 15);
    
    let nextAudit;
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
