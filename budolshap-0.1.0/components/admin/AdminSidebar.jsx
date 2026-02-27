'use client'

import { usePathname } from "next/navigation"
import { HomeIcon, ShieldCheckIcon, StoreIcon, TicketPercentIcon, UsersIcon, ShoppingBasketIcon, PackageIcon, LogOut, PhilippinePesoIcon, BarChart3Icon, UserCheckIcon, Activity, LockIcon, SettingsIcon, ChevronDownIcon, ChevronRightIcon, Zap, History, HardDrive, Bug, Megaphone, ClockIcon, MapIcon, RefreshCcw, BellRing, Globe, ChevronLeftIcon, MenuIcon, Image as ImageIcon, FolderTree } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { assets } from "@/assets/assets"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import { useState, useRef } from "react"
import { Pencil, Loader2 } from "lucide-react"
import { compressImage } from "@/lib/imageUtils"

const AdminSidebar = ({ user: userProp }) => {
    const { logout, token, login, user: authUser } = useAuth()
    const user = authUser || userProp // Prefer reactive user from context
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isStoreManagementOpen, setIsStoreManagementOpen] = useState(false)
    const [isProductOrderManagementOpen, setIsProductOrderManagementOpen] = useState(false)
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [tooltipData, setTooltipData] = useState({ visible: false, text: '', top: 0, left: 0 })
    const fileInputRef = useRef(null)

    const handleMouseEnter = (e, text) => {
        if (isSidebarOpen) return
        const rect = e.currentTarget.getBoundingClientRect()
        setTooltipData({
            visible: true,
            text,
            top: rect.top + rect.height / 2,
            left: rect.right
        })
    }

    const handleMouseLeave = () => {
        setTooltipData(prev => ({ ...prev, visible: false }))
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        setIsUploading(true)

        try {
            let base64Image;

            // Auto-compress if larger than 2MB
            if (file.size > 2 * 1024 * 1024) {
                const toastId = toast.loading('Compressing image...')
                try {
                    base64Image = await compressImage(file, {
                        maxWidth: 1200,
                        maxHeight: 1200,
                        quality: 0.8
                    })
                    toast.dismiss(toastId)
                } catch (err) {
                    toast.dismiss(toastId)
                    console.error('Compression failed', err)
                    toast.error('Image too large and compression failed')
                    return
                }
            } else {
                base64Image = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.readAsDataURL(file)
                    reader.onload = () => resolve(reader.result)
                })
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64Image,
                    type: 'profile'
                })
            })

            if (!response.ok) throw new Error('Upload failed')
            const data = await response.json()

            const profileResponse = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: data.url })
            })

            if (!profileResponse.ok) throw new Error('Profile update failed')
            const updatedData = await profileResponse.json()

            // Update local storage so getUser() returns fresh data immediately
            if (updatedData.user) {
                localStorage.setItem('user', JSON.stringify(updatedData.user))
            }

            toast.success('Profile photo updated successfully')
            window.dispatchEvent(new Event('login-success'))
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to update profile photo')
        } finally {
            setIsUploading(false)
        }
    }

    const sidebarLinks = [
        { name: 'Dashboard', href: '/admin', icon: HomeIcon },
        { name: 'Payouts', href: '/admin/payouts', icon: PhilippinePesoIcon },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3Icon },
        { name: 'Coupons', href: '/admin/coupons', icon: TicketPercentIcon },
    ]

    const storeManagementSubMenu = [
        { name: 'Stores', href: '/admin/stores', icon: StoreIcon },
        { name: 'Approve Store', href: '/admin/approve', icon: ShieldCheckIcon },
    ]

    const productOrderManagementSubMenu = [
        { name: 'Products Management', href: '/admin/products', icon: ShoppingBasketIcon },
        { name: 'Product Categories', href: '/admin/categories', icon: FolderTree },
        { name: 'Orders Management', href: '/admin/orders', icon: PackageIcon },
        { name: 'Returns Management', href: '/admin/returns', icon: RefreshCcw },
    ]

    const userManagementSubMenu = [
        { name: 'Users', href: '/admin/users', icon: UsersIcon },
        { name: 'Manage Membership', href: '/admin/memberships', icon: UserCheckIcon },
        { name: 'KYC Submission & Approval', href: '/admin/kyc', icon: ShieldCheckIcon },
    ]

    const settingsSubMenu = [
        { name: 'Notifications', href: '/admin/settings/notifications', icon: BellRing },
        { name: 'Escrow Settings', href: '/admin/escrow', icon: LockIcon },
        { name: 'Marketing Ads', href: '/admin/settings/marketing-ads', icon: Megaphone },
        { name: 'Unpaid Order Cancellation', href: '/admin/settings/unpaid-cancellation', icon: ClockIcon },
        { name: 'Map & Location', href: '/admin/settings/maps', icon: MapIcon },
        { name: 'Webhooks', href: '/admin/webhooks', icon: Activity },
        { name: 'Realtime Updates', href: '/admin/settings/realtime', icon: Zap },
        { name: 'Caching Systems', href: '/admin/settings/cache', icon: HardDrive },
        { name: 'Error Tracking', href: '/admin/settings/error-tracking', icon: Bug },
        { name: 'Security Settings', href: '/admin/settings/security', icon: ShieldCheckIcon },
        { name: 'RBAC & Permissions', href: '/admin/settings/rbac', icon: ShieldCheckIcon },
        { name: 'Product Settings', href: '/admin/settings/products', icon: ImageIcon },
        { name: 'Environment Settings', href: '/admin/settings/environment', icon: Globe },
        { name: 'Rate Limiting', href: '/admin/settings/rate-limiting', icon: UsersIcon },
        { name: 'Login & Logout Tracker', href: '/admin/settings/audit-logs', icon: History },
        { name: 'Forensic Audit Trails', href: '/admin/settings/forensic-audit-trails', icon: ShieldCheckIcon },
    ]

    const handleLogout = () => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                Are you sure you want to logout?
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-200">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id)
                            setIsLoggingOut(true)

                            // Artificial delay ensuring spinner visibility for UX
                            const minDelay = new Promise(resolve => setTimeout(resolve, 800));

                            try {
                                const logoutPromise = logout();
                                await Promise.all([minDelay, logoutPromise]);
                            } catch (error) {
                                console.error('Logout failed', error)
                            } finally {
                                setIsLoggingOut(false)
                            }
                        }}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Logout
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ))
    }

    const getInitials = (name) => {
        if (!name) return 'A'
        const parts = name.trim().split(' ')
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }

    const SidebarTooltip = () => {
        if (!tooltipData.visible || isSidebarOpen) return null
        return (
            <div
                className="fixed z-[100] px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200"
                style={{
                    top: tooltipData.top,
                    left: tooltipData.left + 12,
                    transform: 'translateY(-50%)'
                }}
            >
                {tooltipData.text}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
            </div>
        )
    }

    return (
        <div className={`inline-flex h-full flex-col gap-5 border-r border-slate-200 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80' : 'w-20'} justify-between bg-white relative`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute -right-3 top-6 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 z-20 text-slate-500"
            >
                {isSidebarOpen ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
            </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                <div className="flex flex-col gap-3 justify-center items-center pt-8">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                        <div className={`rounded-full overflow-hidden shadow-md border-2 border-slate-100 relative transition-all duration-300 ${isSidebarOpen ? 'w-16 h-16' : 'w-10 h-10'}`}>
                            {user?.image ? (
                                <img className="w-full h-full object-cover" src={user.image} alt="Profile" />
                            ) : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                                    {getInitials(user?.name)}
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                {isUploading ? (
                                    <Loader2 className={`${isSidebarOpen ? 'w-6 h-6' : 'w-4 h-4'} text-white animate-spin`} />
                                ) : (
                                    <Pencil className={`${isSidebarOpen ? 'w-5 h-5' : 'w-3 h-3'} text-white`} />
                                )}
                            </div>
                        </div>

                        {/* Tooltip for Image Upload */}
                        <div className={`absolute top-0 left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 ${!isSidebarOpen && 'hidden'}`}>
                            Change Photo
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                        </div>
                    </div>

                    {isSidebarOpen ? (
                        <div className="flex flex-col items-center px-2 max-w-full text-center">
                            {user?.store?.name && (
                                <p className="font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis w-full text-base">
                                    {user.store.name}
                                </p>
                            )}
                            <p className={`${user?.store?.name ? 'text-xs text-slate-500 font-medium' : 'font-semibold text-slate-700 text-sm'} whitespace-nowrap overflow-hidden text-ellipsis w-full`}>
                                {user?.store?.name ? user?.name : `Hi, ${user?.name || 'Admin'}`}
                            </p>
                        </div>
                    ) : (
                        <p className="font-bold text-slate-500 text-xs">{getInitials(user?.name)}</p>
                    )}
                </div>

                <div className="mt-6 pb-4 flex flex-col gap-1 px-3">
                    {/* Dashboard Link */}
                    <Link
                        href="/admin"
                        onMouseEnter={(e) => handleMouseEnter(e, "Dashboard")}
                        onMouseLeave={handleMouseLeave}
                        className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 rounded-lg transition group ${pathname === '/admin' && 'bg-slate-100 text-slate-700'}`}
                    >
                        <div className="min-w-[20px] flex justify-center">
                            <HomeIcon size={20} />
                        </div>
                        <p className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Dashboard</p>
                        {pathname === '/admin' && isSidebarOpen && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 rounded-l"></span>}
                    </Link>

                    {/* User & Member Management Menu with Submenu */}
                    <div>
                        <button
                            onMouseEnter={(e) => handleMouseEnter(e, "User & Member Management")}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => {
                                if (!isSidebarOpen) setIsSidebarOpen(true)
                                setIsUserManagementOpen(!isUserManagementOpen)
                            }}
                            className="w-full relative flex items-center justify-between text-slate-500 hover:bg-slate-50 p-2.5 rounded-lg transition group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="min-w-[20px] flex justify-center">
                                    <UsersIcon size={20} />
                                </div>
                                <p className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>User & Member Management</p>
                            </div>
                            <div className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                {isUserManagementOpen ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                            </div>
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isUserManagementOpen && isSidebarOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                            {userManagementSubMenu.map((link, index) => (
                                <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 pl-11 rounded-lg transition group ${pathname === link.href && 'bg-slate-100 text-slate-700'}`}>
                                    <div className="min-w-[16px] flex justify-center">
                                        <link.icon size={16} />
                                    </div>
                                    <p className="text-xs whitespace-nowrap">{link.name}</p>
                                    {pathname === link.href && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 rounded-l"></span>}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Products & Order Management Menu with Submenu */}
                    <div>
                        <button
                            onMouseEnter={(e) => handleMouseEnter(e, "Products & Order Management")}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => {
                                if (!isSidebarOpen) setIsSidebarOpen(true)
                                setIsProductOrderManagementOpen(!isProductOrderManagementOpen)
                            }}
                            className="w-full relative flex items-center justify-between text-slate-500 hover:bg-slate-50 p-2.5 rounded-lg transition group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="min-w-[20px] flex justify-center">
                                    <ShoppingBasketIcon size={20} />
                                </div>
                                <p className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Products & Order Management</p>
                            </div>
                            <div className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                {isProductOrderManagementOpen ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                            </div>
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isProductOrderManagementOpen && isSidebarOpen ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'}`}>
                            {productOrderManagementSubMenu.map((link, index) => (
                                <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 pl-11 rounded-lg transition group ${pathname === link.href && 'bg-slate-100 text-slate-700'}`}>
                                    <div className="min-w-[16px] flex justify-center">
                                        <link.icon size={16} />
                                    </div>
                                    <p className="text-xs whitespace-nowrap">{link.name}</p>
                                    {pathname === link.href && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 rounded-l"></span>}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Store Management Menu with Submenu */}
                    <div>
                        <button
                            onMouseEnter={(e) => handleMouseEnter(e, "Store Management")}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => {
                                if (!isSidebarOpen) setIsSidebarOpen(true)
                                setIsStoreManagementOpen(!isStoreManagementOpen)
                            }}
                            className="w-full relative flex items-center justify-between text-slate-500 hover:bg-slate-50 p-2.5 rounded-lg transition group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="min-w-[20px] flex justify-center">
                                    <StoreIcon size={20} />
                                </div>
                                <p className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Store Management</p>
                            </div>
                            <div className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                {isStoreManagementOpen ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                            </div>
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isStoreManagementOpen && isSidebarOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                            {storeManagementSubMenu.map((link, index) => (
                                <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 pl-11 rounded-lg transition group ${pathname === link.href && 'bg-slate-100 text-slate-700'}`}>
                                    <div className="min-w-[16px] flex justify-center">
                                        <link.icon size={16} />
                                    </div>
                                    <p className="text-xs whitespace-nowrap">{link.name}</p>
                                    {pathname === link.href && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 rounded-l"></span>}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Rest of the Links */}
                    {
                        sidebarLinks.slice(1).map((link, index) => (
                            <Link
                                key={index}
                                href={link.href}
                                onMouseEnter={(e) => handleMouseEnter(e, link.name)}
                                onMouseLeave={handleMouseLeave}
                                className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 rounded-lg transition group ${pathname === link.href && 'bg-slate-100 text-slate-700'}`}
                            >
                                <div className="min-w-[20px] flex justify-center">
                                    <link.icon size={20} />
                                </div>
                                <p className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{link.name}</p>
                                {pathname === link.href && isSidebarOpen && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 rounded-l"></span>}
                            </Link>
                        ))
                    }

                    {/* Settings Menu with Submenu */}
                    <div>
                        <button
                            onMouseEnter={(e) => handleMouseEnter(e, "Settings")}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => {
                                if (!isSidebarOpen) setIsSidebarOpen(true)
                                setIsSettingsOpen(!isSettingsOpen)
                            }}
                            className="w-full relative flex items-center justify-between text-slate-500 hover:bg-slate-50 p-2.5 rounded-lg transition group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="min-w-[20px] flex justify-center">
                                    <SettingsIcon size={20} />
                                </div>
                                <p className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Settings</p>
                            </div>
                            <div className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                {isSettingsOpen ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                            </div>
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSettingsOpen && isSidebarOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            {settingsSubMenu.map((link, index) => (
                                <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 pl-11 rounded-lg transition group ${pathname === link.href && 'bg-slate-100 text-slate-700'}`}>
                                    <div className="min-w-[16px] flex justify-center">
                                        <link.icon size={16} />
                                    </div>
                                    <p className="text-xs whitespace-nowrap">{link.name}</p>
                                    {pathname === link.href && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 rounded-l"></span>}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3 border-t border-slate-200">
                <button
                    onMouseEnter={(e) => handleMouseEnter(e, "Logout")}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`w-full relative flex items-center gap-3 text-red-500 hover:bg-red-50 p-2.5 rounded-lg transition group ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="min-w-[20px] flex justify-center">
                        {isLoggingOut ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />}
                    </div>
                    <p className={`whitespace-nowrap font-medium text-sm transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Logout</p>
                </button>
            </div>

            <SidebarTooltip />
        </div>
    )
}

export default AdminSidebar
