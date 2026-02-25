'use client'
import { usePathname } from "next/navigation"
import { HomeIcon, LayoutListIcon, SquarePenIcon, SquarePlusIcon, SettingsIcon, TruckIcon, TicketIcon, WalletIcon, PackageXIcon, MessageSquareIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, Pencil, Loader2 } from "lucide-react"
import { useState, useRef } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"

import { assets } from "@/assets/assets"
import { compressImage } from "@/lib/imageUtils"

const StoreSidebar = ({ storeInfo, user }) => {
    console.log('StoreSidebar storeInfo:', storeInfo);
    const pathname = usePathname()
    const [uploading, setUploading] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [tooltipData, setTooltipData] = useState({ visible: false, text: '', top: 0, left: 0 })
    const fileInputRef = useRef(null)

    const handleMouseEnter = (e, text) => {
        if (isSidebarOpen) return
        const rect = e.currentTarget.getBoundingClientRect()
        setTooltipData({
            visible: true,
            text,
            top: rect.top + rect.height / 2,
            left: rect.right,
            force: false
        })
    }

    const handleImageMouseEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setTooltipData({
            visible: true,
            text: "Upload new photo",
            top: rect.top + rect.height / 2,
            left: rect.right,
            force: true
        })
    }

    const handleMouseLeave = () => {
        setTooltipData(prev => ({ ...prev, visible: false }))
    }

    const SidebarTooltip = () => {
        if (!tooltipData.visible || (isSidebarOpen && !tooltipData.force)) return null
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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        const toastId = toast.loading("Processing and updating store logo...")

        try {
            // Compress image on client side before upload (supports WebP for transparency)
            const base64 = await compressImage(file, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.8,
                type: 'image/webp'
            });

            // 1. Upload to Cloudinary
            let logoUrl = ""
            try {
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64 })
                })

                if (!uploadRes.ok) throw new Error("Cloudinary upload failed")
                const uploadData = await uploadRes.json()
                logoUrl = uploadData.url
            } catch (error) {
                console.warn("Cloudinary upload failed, falling back to database storage:", error)
                toast.error("External upload timed out. Saving to local database instead...", { duration: 4000 })
                // Use the compressed base64 string as a fallback for the database
                logoUrl = base64
            }

            // 2. Update Store Profile
            const updateRes = await fetch(`/api/stores/${storeInfo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logo: logoUrl })
            })

            if (!updateRes.ok) throw new Error("Failed to update store information")

            toast.success("Store logo updated!", { id: toastId })

            // 3. Trigger global refresh
            window.dispatchEvent(new Event('store-updated'))
        } catch (error) {
            console.error("Store logo upload error:", error)
            toast.error(error.message || "Failed to upload image", { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    const sidebarLinks = [
        { name: 'Dashboard', href: '/store', icon: HomeIcon },

        { name: 'Manage Product', href: '/store/manage-product', icon: SquarePenIcon },
        { name: 'Orders', href: '/store/orders', icon: LayoutListIcon },
        { name: 'Shipping', href: '/store/shipping', icon: TruckIcon },
        { name: 'Coupons', href: '/store/coupons', icon: TicketIcon },
        { name: 'Wallet', href: '/store/wallet', icon: WalletIcon },
        { name: 'Returns', href: '/store/returns', icon: PackageXIcon },
        { name: 'Chat', href: '/store/chat', icon: MessageSquareIcon },
        { name: 'Settings', href: '/store/settings', icon: SettingsIcon },
    ]

    return (
        <div className={`inline-flex h-full flex-col gap-5 border-r border-slate-200 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'sm:w-64 w-20' : 'w-20'} bg-white relative`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute -right-3 top-6 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 z-20 text-slate-500 max-sm:hidden"
            >
                {isSidebarOpen ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
            </button>

            <SidebarTooltip />

            <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden">
                <div
                    className="relative group cursor-pointer"
                    onClick={() => !uploading && fileInputRef.current.click()}
                    onMouseEnter={handleImageMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className={`rounded-full overflow-hidden shadow-md transition-all duration-300 ${isSidebarOpen ? 'w-14 h-14' : 'w-10 h-10'}`}>
                        <Image
                            className={`w-full h-full object-cover transition-all ${uploading ? 'opacity-50 grayscale-[0.5]' : 'group-hover:brightness-90'}`}
                            src={storeInfo?.logo || assets.upload_area}
                            alt="Store Logo"
                            width={80}
                            height={80}
                        />
                    </div>

                    {uploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full">
                            <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent animate-spin rounded-full"></div>
                        </div>
                    ) : (
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full`}>
                            <PencilIcon className="text-white" size={isSidebarOpen ? 16 : 12} />
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        hidden
                    />
                </div>
                
                {isSidebarOpen && (
                    <div className="flex flex-col items-center px-2 max-w-full text-center mt-2 space-y-0.5">
                        <p className="font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis w-full text-base">
                            {storeInfo?.name || 'My Store'}
                        </p>
                        <p className="text-xs text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full">
                            {user?.name || 'Seller'}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-col gap-1 px-2 max-sm:mt-6">
                {
                    sidebarLinks.map((link, index) => (
                        <Link 
                            key={index} 
                            href={link.href} 
                            onMouseEnter={(e) => handleMouseEnter(e, link.name)}
                            onMouseLeave={handleMouseLeave}
                            className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 rounded-lg transition-all ${pathname === link.href ? 'bg-slate-100 text-slate-700' : ''}`}
                        >
                            <div className="min-w-[20px] flex justify-center">
                                <link.icon size={20} />
                            </div>
                            <p className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} max-sm:hidden`}>
                                {link.name}
                            </p>
                            {pathname === link.href && isSidebarOpen && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 rounded-l"></span>}
                        </Link>
                    ))
                }
            </div>
        </div>
    )
}

export default StoreSidebar