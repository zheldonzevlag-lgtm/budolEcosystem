/**
 * Role-Based Access Control (RBAC) Configuration
 * Compliance: BSP Circular 808
 */

const ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER',
    STAFF: 'STAFF',
    DRIVER: 'DRIVER',
    SUPERVISOR: 'SUPERVISOR',
    MERCHANT: 'MERCHANT'
};

const PERMISSIONS = {
    // Wallet Permissions
    WALLET_READ: 'WALLET_READ',
    WALLET_TRANSFER: 'WALLET_TRANSFER',
    WALLET_ADMIN_ADJUST: 'WALLET_ADMIN_ADJUST',
    
    // System Permissions
    SYSTEM_CONFIG: 'SYSTEM_CONFIG',
    KYC_APPROVE: 'KYC_APPROVE',
    TRANSACTION_READ_ALL: 'TRANSACTION_READ_ALL',
    
    // UI Permissions
    MANAGE_USERS: 'manage_users',
    VIEW_REPORTS: 'view_reports',
    MANAGE_SETTINGS: 'manage_settings',
    VIEW_PROFILE: 'view_profile',
    MAKE_PAYMENT: 'make_payment'
};

const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        PERMISSIONS.WALLET_READ,
        PERMISSIONS.WALLET_TRANSFER,
        PERMISSIONS.WALLET_ADMIN_ADJUST,
        PERMISSIONS.SYSTEM_CONFIG,
        PERMISSIONS.KYC_APPROVE,
        PERMISSIONS.TRANSACTION_READ_ALL,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.MANAGE_SETTINGS
    ],
    [ROLES.SUPERVISOR]: [
        PERMISSIONS.WALLET_READ,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.KYC_APPROVE,
        PERMISSIONS.TRANSACTION_READ_ALL
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.WALLET_READ,
        PERMISSIONS.KYC_APPROVE
    ],
    [ROLES.USER]: [
        PERMISSIONS.WALLET_READ,
        PERMISSIONS.WALLET_TRANSFER,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.MAKE_PAYMENT
    ],
    [ROLES.DRIVER]: [
        PERMISSIONS.WALLET_READ,
        PERMISSIONS.VIEW_PROFILE
    ],
    [ROLES.MERCHANT]: [
        PERMISSIONS.WALLET_READ,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.MAKE_PAYMENT
    ]
};

const hasPermission = (role, permission) => {
    if (!role || !permission) return false;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
};

module.exports = {
    ROLES,
    PERMISSIONS,
    hasPermission
};
