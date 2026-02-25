import { 
    getSystemSettings as getSettings, 
    updateSystemSettings as updateSettings,
    clearSettingsCache as clearGlobalCache
} from '@/lib/settings';
import { getRealtimeConfig as getRealtime, clearSettingsCache as clearRealtimeCache } from '@/lib/realtime';

/**
 * System Settings Service
 * Service layer for system settings operations
 * This abstracts database operations from API routes
 */
export async function getSystemSettings(forceRefresh = false) {
    return await getSettings(forceRefresh);
}

export async function updateSystemSettings(data) {
    const updated = await updateSettings(data);
    // Invalidate caches across system
    clearGlobalCache();
    clearRealtimeCache();
    return updated;
}

export async function getRealtimeConfig() {
    return await getRealtime();
}


