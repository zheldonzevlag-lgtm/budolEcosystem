/**
 * BudolShap RBAC Configuration
 * Defines standardized roles and permissions for the ecosystem.
 */

export const PERMISSIONS = {
    // Product Management
    PRODUCTS_VIEW: 'products:view',
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_EDIT: 'products:edit',
    PRODUCTS_DELETE: 'products:delete',
    PRODUCTS_APPROVE: 'products:approve',

    // Store Management
    STORES_VIEW: 'stores:view',
    STORES_CREATE: 'stores:create',
    STORES_EDIT: 'stores:edit',
    STORES_DELETE: 'stores:delete',
    STORES_APPROVE: 'stores:approve',

    // Order Management
    ORDERS_VIEW: 'orders:view',
    ORDERS_EDIT: 'orders:edit',
    ORDERS_PROCESS: 'orders:process',

    // User Management
    USERS_VIEW: 'users:view',
    USERS_EDIT: 'users:edit',
    USERS_DELETE: 'users:delete',
    USERS_MANAGE_ROLES: 'users:manage_roles',
    USERS_KYC_APPROVE: 'users:kyc_approve',

    // Financials
    PAYOUTS_VIEW: 'payouts:view',
    PAYOUTS_APPROVE: 'payouts:approve',
    TRANSACTIONS_VIEW: 'transactions:view',

    // System
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',
    AUDIT_LOGS_VIEW: 'audit_logs:view',
};

export const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    LEAD: 'LEAD',
    STAFF: 'STAFF',
    SELLER: 'SELLER',
    BUYER: 'BUYER',
};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS), // All permissions
    
    [ROLES.MANAGER]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.PRODUCTS_APPROVE,
        PERMISSIONS.STORES_VIEW,
        PERMISSIONS.STORES_APPROVE,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_KYC_APPROVE,
        PERMISSIONS.PAYOUTS_VIEW,
        PERMISSIONS.TRANSACTIONS_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.AUDIT_LOGS_VIEW,
    ],

    [ROLES.LEAD]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.PRODUCTS_APPROVE,
        PERMISSIONS.STORES_VIEW,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_KYC_APPROVE,
        PERMISSIONS.TRANSACTIONS_VIEW,
    ],

    [ROLES.STAFF]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.STORES_VIEW,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.TRANSACTIONS_VIEW,
    ],

    [ROLES.SELLER]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.PRODUCTS_CREATE,
        PERMISSIONS.PRODUCTS_EDIT,
        PERMISSIONS.PRODUCTS_DELETE,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_PROCESS,
        PERMISSIONS.TRANSACTIONS_VIEW,
    ],

    [ROLES.BUYER]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.ORDERS_VIEW,
    ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role 
 * @param {string} permission 
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
    if (!role || !permission) return false;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
}
