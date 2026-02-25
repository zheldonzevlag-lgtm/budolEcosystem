'use client'
import Link from "next/link"
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import BudolPayText from '@/components/payment/BudolPayText';

const AdminNavbar = () => {
    const { user, logout } = useAuth()

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
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all bg-white">
            <Link href="/" target="_blank" className="relative text-4xl font-semibold text-slate-700">
                <BudolPayText text="budolShap" />
                <span className="text-green-600 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-13 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                    Admin
                </p>
            </Link>
            <div className="flex items-center gap-4">
                {user && (
                    <div className="flex items-center gap-2 text-slate-600">
                        {user.image ? (
                            <img src={user.image} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                        ) : (
                            <User size={18} />
                        )}
                        <span className="hidden sm:inline font-medium">{user.name}</span>
                    </div>
                )}
                <Link
                    href="/"
                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-md transition"
                >
                    Home
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition text-sm"
                >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </div>
    )
}

export default AdminNavbar