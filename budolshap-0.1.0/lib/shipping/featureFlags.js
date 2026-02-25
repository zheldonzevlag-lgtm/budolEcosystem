/**
 * Feature Flag Utilities for BudolShap Shipping Flow
 * 
 * Provides centralized feature flag checking for the BudolShap-aligned
 * seller shipping workflow implementation.
 */

import { getSystemSettings } from '@/lib/settings';

/**
 * Check if BudolShap shipping flow is enabled
 * @returns {Promise<boolean>} - True if BudolShap shipping features are enabled
 */
export async function isBudolShapShippingEnabled() {
  try {
    const settings = await getSystemSettings();
    return settings.budolShapShippingEnabled === true;
  } catch (error) {
    console.error('Failed to check BudolShap shipping feature flag:', error);
    return false; // Default to disabled on error
  }
}

/**
 * Check if waybill generation is enabled
 * @returns {Promise<boolean>} - True if waybill generation is enabled
 */
export async function isWaybillGenerationEnabled() {
  try {
    const settings = await getSystemSettings();
    return settings.budolShapWaybillGeneration === true;
  } catch (error) {
    console.error('Failed to check waybill generation feature flag:', error);
    return false;
  }
}

/**
 * Get BudolShap shipping SLA days
 * @returns {Promise<number>} - Number of days for shipping SLA
 */
export async function getBudolShapShippingSLADays() {
  try {
    const settings = await getSystemSettings();
    return settings.budolShapShippingSLADays || 3; // Default to 3 days
  } catch (error) {
    console.error('Failed to get BudolShap shipping SLA days:', error);
    return 3; // Default to 3 days on error
  }
}

/**
 * Get all BudolShap shipping feature flags
 * @returns {Promise<Object>} - Object containing all BudolShap shipping feature flags
 */
export async function getBudolShapShippingFlags() {
  try {
    const settings = await getSystemSettings();
    return {
      enabled: settings.budolShapShippingEnabled === true,
      waybillGeneration: settings.budolShapWaybillGeneration === true,
      slaDays: settings.budolShapShippingSLADays || 3
    };
  } catch (error) {
    console.error('Failed to get BudolShap shipping feature flags:', error);
    return {
      enabled: false,
      waybillGeneration: false,
      slaDays: 3
    };
  }
}

/**
 * Server-side feature flag check (for API routes)
 * @param {Object} settings - System settings object
 * @returns {boolean} - True if BudolShap shipping is enabled
 */
export function isBudolShapShippingEnabledServer(settings) {
  return settings?.budolShapShippingEnabled === true;
}

/**
 * Server-side waybill generation check
 * @param {Object} settings - System settings object
 * @returns {boolean} - True if waybill generation is enabled
 */
export function isWaybillGenerationEnabledServer(settings) {
  return settings?.budolShapWaybillGeneration === true;
}

/**
 * Server-side SLA days getter
 * @param {Object} settings - System settings object
 * @returns {number} - Number of SLA days
 */
export function getBudolShapShippingSLADaysServer(settings) {
  return settings?.budolShapShippingSLADays || 3;
}