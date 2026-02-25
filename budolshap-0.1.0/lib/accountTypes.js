export const ACCOUNT_TYPES = [
    {
        value: 'BUYER',
        label: 'Buyer',
        badgeClass: 'bg-slate-100 text-slate-600',
        description: 'Default shopper account that can browse and place orders.'
    },
    {
        value: 'SELLER',
        label: 'Seller',
        badgeClass: 'bg-purple-100 text-purple-600',
        description: 'Store owners and managers who can run a shop.'
    },
    {
        value: 'ADMIN',
        label: 'Admin',
        badgeClass: 'bg-red-100 text-red-600',
        description: 'Global administrators with elevated privileges.'
    }
]

export const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPES.map(type => type.value)

export const ACCOUNT_TYPE_LABELS = ACCOUNT_TYPES.reduce((acc, type) => {
    acc[type.value] = type.label
    return acc
}, {})

export function normalizeAccountType(type, { fallback = null } = {}) {
    if (!type || typeof type !== 'string') {
        return fallback
    }
    const normalized = type.toUpperCase()
    return ACCOUNT_TYPE_VALUES.includes(normalized) ? normalized : fallback
}

export function getAccountTypeMeta(type) {
    const normalized = normalizeAccountType(type)
    return ACCOUNT_TYPES.find(accountType => accountType.value === normalized)
}

