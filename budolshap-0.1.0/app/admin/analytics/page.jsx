'use client'

import { useState, useEffect } from 'react'
import { BarChart3Icon, PhilippinePesoIcon, ShoppingCartIcon, StoreIcon, UsersIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/admin/analytics', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                setAnalytics(data)
            } else {
                toast.error('Failed to load analytics')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="p-6">
                <p className="text-red-500">Failed to load analytics</p>
            </div>
        )
    }

    // Reusable Stat Card Component
    function StatCard({ title, value, icon: Icon, color, hint }) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between group relative">
                <div>
                    <p className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-1">
                        {title}
                        {hint && (
                            <span className="cursor-help text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                        )}
                    </p>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>

                {/* Tooltip */}
                {hint && (
                    <div className="absolute top-full left-6 mt-2 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 w-64">
                        <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl relative">
                            {/* Triangle Arrow */}
                            <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-800 transform rotate-45"></div>
                            <p className="font-medium mb-0.5">{title}</p>
                            <p className="text-slate-300 leading-relaxed">{hint}</p>
                        </div>
                    </div>
                )}
            </div>
        )
    }
    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <BarChart3Icon className="w-8 h-8 text-emerald-500" />
                <h1 className="text-3xl font-bold">Platform Analytics</h1>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total GMV"
                    value={`₱${analytics.overview.totalGMV.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                    icon={PhilippinePesoIcon}
                    color="bg-emerald-500"
                    hint="Gross Merchandise Value: The total monetary value of all goods sold through the platform before any deductions."
                />
                <StatCard
                    title="Total Commission"
                    value={`₱${analytics.overview.totalCommission.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                    icon={PhilippinePesoIcon}
                    color="bg-blue-500"
                    hint="Revenue earned by the platform (5% fee deducted from every successful order)."
                />
                <StatCard
                    title="Total Orders"
                    value={analytics.overview.totalOrders}
                    icon={ShoppingCartIcon}
                    color="bg-purple-500"
                    hint="The total number of orders placed on the platform."
                />
                <StatCard
                    title="Active Stores"
                    value={analytics.overview.activeStores}
                    icon={StoreIcon}
                    color="bg-orange-500"
                />
            </div>

            {/* Users & Stores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-emerald-500" />
                        Users
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Users</span>
                            <span className="font-semibold text-lg">{analytics.users.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Buyers</span>
                            <span className="font-semibold text-lg">{analytics.users.buyers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Sellers</span>
                            <span className="font-semibold text-lg">{analytics.users.sellers}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <StoreIcon className="w-6 h-6 text-emerald-500" />
                        Stores
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Stores</span>
                            <span className="font-semibold text-lg">{analytics.stores.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Active Stores</span>
                            <span className="font-semibold text-lg">{analytics.stores.active}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Pending Verification</span>
                            <span className="font-semibold text-lg text-yellow-600">{analytics.stores.pendingVerification}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payouts & Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <PhilippinePesoIcon className="w-6 h-6 text-emerald-500" />
                        Pending Payouts
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Requests</span>
                            <span className="font-semibold text-lg">{analytics.payouts.pending}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Amount</span>
                            <span className="font-semibold text-lg">₱{analytics.payouts.pendingAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <ShoppingCartIcon className="w-6 h-6 text-emerald-500" />
                        Recent Activity (30 Days)
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Orders</span>
                            <span className="font-semibold text-lg">{analytics.orders.last30Days}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">GMV</span>
                            <span className="font-semibold text-lg">₱{analytics.orders.last30DaysGMV.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">Order Status Breakdown</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analytics.orders.byStatus.map((item) => (
                        <div key={item.status} className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-gray-600 text-sm mb-1">{item.status.replace('_', ' ')}</p>
                            <p className="text-2xl font-bold">{item._count}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
