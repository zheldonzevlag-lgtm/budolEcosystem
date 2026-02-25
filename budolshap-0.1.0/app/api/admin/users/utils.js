import { getConfiguredAdminEmailSet, isUserAdmin } from '@/lib/adminAccess'

export const adminUserInclude = {
    store: {
        select: {
            id: true,
            name: true,
            username: true,
            status: true,
            isActive: true,
            logo: true,
            addresses: true
        }
    },
    _count: {
        select: {
            buyerOrders: true,
            Address: true,
            ratings: true
        }
    },
    Address: true
}

export function getAdminEmailSet() {
    return getConfiguredAdminEmailSet()
}

export function attachAdminFlag(user, adminEmailSet = getAdminEmailSet()) {
    if (!user) {
        return user
    }

    const isAdminAccount = isUserAdmin(user, adminEmailSet)

    return {
        ...user,
        isAdminAccount
    }
}

