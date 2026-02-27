'use client'
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { toast } from "react-hot-toast"
import Image from "next/image"
import { assets } from "@/assets/assets"

const StoreNavbar = ({ storeInfo, user }) => {
    const { logout } = useAuth()

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
                        onClick={() => {
                            toast.dismiss(t.id)
                            logout()
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

    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <Link href="/" className="relative shrink-0 flex items-center">
                <img
                    src="https://res.cloudinary.com/dasfwpg7x/image/upload/v1772205112/budolshap/assets/budolshap_logo_bag_trans.png"
                    alt="budolShap"
                    className="h-10 w-auto select-none sm:hidden"
                    draggable="false"
                />
                <img
                    src="https://res.cloudinary.com/dasfwpg7x/image/upload/v1771164945/budolshap/assets/budolshap_logo_transparent.png"
                    alt="budolShap"
                    className="hidden sm:block h-12 sm:h-16 lg:h-20 w-auto select-none"
                    draggable="false"
                />
                <p className="absolute hidden sm:flex text-[9px] sm:text-[10px] font-semibold top-3 sm:top-3 -right-3 sm:-right-4 px-1 sm:px-2 py-0.5 rounded-full items-center gap-1 text-white bg-green-500">
                    Store
                </p>
            </Link>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                    <Image
                        src={storeInfo?.logo || assets.upload_area}
                        className="w-7 h-7 rounded-full object-cover shadow-sm"
                        alt=""
                        width={28}
                        height={28}
                    />
                    <p className="text-sm font-medium text-slate-700">{user?.name || storeInfo?.name}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm font-semibold text-red-500 hover:text-red-600 transition"
                >
                    Logout
                </button>
            </div>
        </div>
    )
}

export default StoreNavbar
