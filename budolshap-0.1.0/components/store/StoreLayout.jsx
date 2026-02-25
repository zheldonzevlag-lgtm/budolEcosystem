'use client'
import { useEffect, useState, useCallback, Suspense } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"
import Breadcrumb from "./Breadcrumb"
import { useRouter, usePathname } from "next/navigation"
import toast from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { useIdleTimeout } from "@/hooks/useIdleTimeout"
import SessionTimeoutModal from "../SessionTimeoutModal"
import { useAuthUI } from "@/context/AuthUIContext"

const StoreLayout = ({ children }) => {
    const router = useRouter()
    const pathname = usePathname()
    const { showLogin } = useAuthUI()
    const { user: authUser, isLoading: authLoading } = useAuth()
    const [isSeller, setIsSeller] = useState(false)
    const [loading, setLoading] = useState(true)
    const [storeInfo, setStoreInfo] = useState(null)
    const [user, setUser] = useState(null)

    const fetchIsSeller = async () => {
        // Wait for AuthContext to finish loading
        console.log('[StoreLayout] fetchIsSeller called. authLoading:', authLoading, 'authUser:', authUser?.email);
        if (authLoading) return;

        try {
            // Check session via AuthContext instead of calling API directly
            console.log('[StoreLayout] Verifying seller session for user:', authUser?.email);

            if (!authUser) {
                console.log('[StoreLayout] No session found in AuthContext, redirecting to login. Pathname:', pathname);
                // toast.error("Please login first") // Commented out to avoid annoying users if it's a race condition
                const loginUrl = new URL(window.location.origin)
                loginUrl.searchParams.set('showLogin', 'true')
                loginUrl.searchParams.set('redirect', pathname)
                router.push(loginUrl.toString())
                setLoading(false)
                return
            }

            setUser(authUser)

            // Get user's store
            const response = await fetch(`/api/stores/user/${authUser.id}`)
            if (response.ok) {
                const store = await response.json()
                setStoreInfo(store)

                if (store) {
                    setIsSeller(true)
                    // Check if store is approved and active
                    console.log("Store status:", store.status, "isActive:", store.isActive)

                    if (store.status === 'pending') {
                        toast("Your store is pending approval. Some features may be limited.", { icon: 'ℹ️', id: 'pending-store-toast' })
                    } else if (store.status === 'rejected') {
                        toast.error("Your store application was rejected. Please contact support.")
                    }
                } else {
                    setIsSeller(false)
                    toast.error("Store not found. Please create a store first.")
                }
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.error("StoreLayout fetch failed:", response.status, errorData)
                setIsSeller(false)
                toast.error(errorData.error || "Failed to verify store access.")
            }
        } catch (error) {
            console.error("Error fetching store:", error)
            setIsSeller(false)
            toast.error("Failed to verify store access")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIsSeller()
    }, [authLoading, authUser])

    // Reactive Update for Store Logo/Info
    useEffect(() => {
        const handleStoreUpdate = () => {
            console.log('[StoreLayout] Store updated event received. Re-fetching...');
            fetchIsSeller();
        };

        window.addEventListener('store-updated', handleStoreUpdate);
        return () => window.removeEventListener('store-updated', handleStoreUpdate);
    }, [authUser]);

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
            setIsSeller(false)

            // Show session expired modal
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

    return loading ? (
        <Loading />
    ) : isSeller ? (
        <div className="flex flex-col h-screen">
            <SessionTimeoutModal
                isOpen={isWarning && !isIdle}
                onContinue={resetTimer}
                onLogout={handleLogout}
                remainingSeconds={remainingSeconds}
            />
            <SellerNavbar storeInfo={storeInfo} user={user} />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <SellerSidebar storeInfo={storeInfo} user={user} />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    <Suspense fallback={<div className="h-8 mb-6 bg-slate-100 animate-pulse rounded w-1/4"></div>}>
                        <Breadcrumb />
                    </Suspense>
                    {children}
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">You are not authorized to access this page</h1>
            {storeInfo && !storeInfo.isActive && (
                <p className="text-slate-500 mt-4">Your store needs to be approved by the admin</p>
            )}
            <Link href="/" className="bg-slate-700 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full">
                Go to home <ArrowRightIcon size={18} />
            </Link>
        </div>
    )
}

export default StoreLayout