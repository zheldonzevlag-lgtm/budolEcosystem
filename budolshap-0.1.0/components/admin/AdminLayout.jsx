'use client'
import { useEffect, useState, useCallback } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import AdminNavbar from "./AdminNavbar"
import AdminSidebar from "./AdminSidebar"
import { getUser } from "@/lib/auth-client"
import { useRouter, usePathname } from "next/navigation"
import toast from "react-hot-toast"
import { useIdleTimeout } from "@/hooks/useIdleTimeout"
import SessionTimeoutModal from "../SessionTimeoutModal"
import { useAuthUI } from "@/context/AuthUIContext"
import { useAuth } from "@/context/AuthContext"

const AdminLayout = ({ children }) => {
    const router = useRouter()
    const { showLogin } = useAuthUI()
    const { user: authUser, isLoading: authLoading } = useAuth()
    const pathname = usePathname()
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)

    useEffect(() => {
        if (pathname === '/admin/login') return

        const fetchIsAdmin = async () => {
            if (authLoading) return

            try {
                setUser(authUser)

                if (!authUser) {
                    toast.error("Please login first")
                    const loginUrl = new URL(window.location.origin)
                    loginUrl.searchParams.set('showLogin', 'true')
                    loginUrl.searchParams.set('redirect', pathname)
                    router.push(loginUrl.toString())
                    setLoading(false)
                    return
                }

                // Get token for Authorization header
                const { getToken } = await import("@/lib/auth-client")
                const token = getToken()

                const response = await fetch('/api/auth/admin/check', {
                    headers: token ? {
                        'Authorization': `Bearer ${token}`
                    } : {}
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log('Admin check response:', data)

                    if (data.accountType && (!authUser?.accountType || authUser.accountType !== data.accountType)) {
                        setUser(prev => prev ? { ...prev, accountType: data.accountType } : prev)
                    }

                    if (data.isAdmin) {
                        setIsAdmin(true)
                    } else {
                        setIsAdmin(false)
                        toast.error(data.message || `Access denied for ${data.email || authUser.email}`)
                        console.error('Admin check failed. User email:', data.email || authUser.email)
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}))
                    console.error('Admin check API error:', response.status, errorData)

                    const hasAdminAccountType = authUser?.accountType === 'ADMIN'
                    setIsAdmin(hasAdminAccountType)

                    if (!hasAdminAccountType) {
                        toast.error("Failed to verify admin access. Please try again.")
                    }
                }
            } catch (error) {
                console.error("Error checking admin status:", error)
                setIsAdmin(false)
                toast.error("Failed to verify admin access. Check console for details.")
            } finally {
                setLoading(false)
            }
        }

        fetchIsAdmin()
    }, [router, authLoading, authUser])

    const [remainingSeconds, setRemainingSeconds] = useState(60)
    const [timeoutSettings, setTimeoutSettings] = useState({
        timeoutMs: 15 * 60 * 1000,
        warningMs: 14 * 60 * 1000
    })

    useEffect(() => {
        // Fetch system settings for timeout
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/system/settings')
                if (res.ok) {
                    const data = await res.json()
                    if (data.sessionTimeout) {
                        // Convert minutes to ms
                        const timeoutMs = data.sessionTimeout * 60 * 1000
                        const warningMinutes = data.sessionWarning || 1
                        const warningMs = (data.sessionTimeout - warningMinutes) * 60 * 1000

                        setTimeoutSettings({
                            timeoutMs,
                            warningMs
                        })
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error)
            }
        }
        fetchSettings()
    }, [])

    // Handle logout function
    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            setUser(null)
            setIsAdmin(false) // Explicitly clear admin status to trigger Not Authorized view

            // Show session expired modal
            // We set a small timeout to allow UI to update to "Not Authorized" state first
            setTimeout(() => {
                showLogin(null, null, 'session_expired')
            }, 100)

            toast.success('Logged out due to inactivity')
        } catch (error) {
            console.error('Logout failed:', error)
            router.push('/')
        }
    }, [router, showLogin])

    // Idle timeout hook
    const { isIdle, isWarning, resetTimer } = useIdleTimeout({
        onIdle: handleLogout,
        timeoutMs: timeoutSettings.timeoutMs,
        warningMs: timeoutSettings.warningMs
    })

    // Countdown effect during warning
    useEffect(() => {
        let interval
        if (isWarning && !isIdle) {
            setRemainingSeconds(60)
            interval = setInterval(() => {
                setRemainingSeconds(prev => Math.max(0, prev - 1))
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isWarning, isIdle])

    if (pathname === '/admin/login') {
        return <>{children}</>
    }

    if (loading) {
        return <Loading />
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">You are not authorized to access this page</h1>
                <Link href="/" className="bg-slate-700 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full">
                    Go to home <ArrowRightIcon size={18} />
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen">
            <SessionTimeoutModal
                isOpen={isWarning && !isIdle}
                onContinue={resetTimer}
                onLogout={handleLogout}
                remainingSeconds={remainingSeconds}
            />
            <AdminNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <AdminSidebar user={user} />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default AdminLayout