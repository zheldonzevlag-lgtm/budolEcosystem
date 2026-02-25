import { normalizeAccountType } from './accountTypes'

export function getConfiguredAdminEmailSet() {
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    return new Set(adminEmails)
}

export function isEmailConfiguredAsAdmin(email, adminEmailSet = getConfiguredAdminEmailSet()) {
    if (!email) return false
    return adminEmailSet.has(email.toLowerCase())
}

export function isAccountTypeAdmin(accountType) {
    return normalizeAccountType(accountType) === 'ADMIN'
}

export function isUserAdmin(user, adminEmailSet = getConfiguredAdminEmailSet()) {
    if (!user) return false
    
    // Check database isAdmin flag first (highest priority)
    if (user.isAdmin === true) {
        return true
    }

    // Check account type
    if (isAccountTypeAdmin(user.accountType)) {
        return true
    }

    // Check configured admin emails
    return isEmailConfiguredAsAdmin(user.email, adminEmailSet)
}

