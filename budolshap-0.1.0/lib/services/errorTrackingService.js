/**
 * Error Tracking Service
 * Service layer for error tracking configuration
 * Phase 6: Sentry integration with enable/disable capability
 */

import { prisma } from '@/lib/prisma';

/**
 * Get error tracking configuration
 * @returns {Promise<object>} Error tracking configuration
 */
export async function getErrorTrackingConfig() {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' },
            select: {
                errorTrackingEnabled: true,
                sentryDsn: true,
                sentryEnvironment: true,
                sentryTracesSampleRate: true
            }
        });

        return {
            enabled: settings?.errorTrackingEnabled || false,
            sentryDsn: settings?.sentryDsn || null,
            environment: settings?.sentryEnvironment || 'production',
            tracesSampleRate: settings?.sentryTracesSampleRate || 0.1
        };
    } catch (error) {
        console.error('[ErrorTrackingService] Failed to get config:', error);
        return {
            enabled: false,
            sentryDsn: null,
            environment: 'production',
            tracesSampleRate: 0.1
        };
    }
}

/**
 * Update error tracking configuration
 * @param {object} config - Error tracking configuration
 * @param {boolean} config.enabled - Whether error tracking is enabled
 * @param {string} config.sentryDsn - Sentry DSN
 * @param {string} config.environment - Sentry environment
 * @param {number} config.tracesSampleRate - Traces sample rate (0-1)
 * @returns {Promise<object>} Updated settings
 */
export async function updateErrorTrackingConfig(config) {
    const { enabled, sentryDsn, environment, tracesSampleRate } = config;

    if (enabled && !sentryDsn) {
        throw new Error('Sentry DSN is required when error tracking is enabled');
    }

    if (tracesSampleRate !== undefined && (tracesSampleRate < 0 || tracesSampleRate > 1)) {
        throw new Error('Traces sample rate must be between 0 and 1');
    }

    const updateData = {
        errorTrackingEnabled: enabled || false,
        sentryDsn: enabled ? sentryDsn : null,
        sentryEnvironment: environment || 'production',
        sentryTracesSampleRate: tracesSampleRate !== undefined ? tracesSampleRate : 0.1
    };

    // If disabling, clear DSN
    if (!enabled) {
        updateData.sentryDsn = null;
    }

    const settings = await prisma.systemSettings.upsert({
        where: { id: 'default' },
        update: updateData,
        create: {
            id: 'default',
            ...updateData,
            realtimeProvider: 'POLLING',
            sessionTimeout: 15,
            sessionWarning: 1,
            loginLimit: 10,
            registerLimit: 5,
            cacheProvider: 'MEMORY'
        }
    });

    return settings;
}

/**
 * Get error tracking status
 * @returns {Promise<object>} Error tracking status
 */
export async function getErrorTrackingStatus() {
    const config = await getErrorTrackingConfig();

    const status = {
        enabled: config.enabled,
        configured: !!(config.enabled && config.sentryDsn),
        message: ''
    };

    if (!config.enabled) {
        status.message = 'Error tracking is disabled';
    } else if (!config.sentryDsn) {
        status.message = 'Error tracking is enabled but Sentry DSN is not configured';
        status.status = 'warning';
    } else {
        status.message = 'Error tracking is enabled and configured';
        status.status = 'active';
    }

    return status;
}

