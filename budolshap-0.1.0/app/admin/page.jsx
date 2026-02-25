'use client'
import { dummyAdminDashboardData } from "@/assets/assets"
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import ComplianceShield from "@/components/admin/ComplianceShield"
import { CircleDollarSign, PhilippinePesoIcon, ShoppingBasketIcon, StoreIcon, TagsIcon, Hourglass, ListOrdered } from "lucide-react"
import { useEffect, useState } from "react"

export default function AdminDashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        stores: 0,
        allOrders: [],
        protectionWindowDays: 7,
        stats: {
            pending: 0,
            available: 0,
            payoutQueue: 0
        }
    })

    const fetchDashboardData = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            // Parallel fetch for dashboard data and escrow stats
            const [dashboardRes, escrowRes] = await Promise.all([
                fetch('/api/dashboard/admin', {
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }),
                fetch('/api/dashboard/admin/escrow', {
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            ])

            let data = {}
            let escrowData = { stats: { pending: 0, available: 0, payoutQueue: 0 }, protectionWindowDays: 7 }

            if (dashboardRes.ok) {
                data = await dashboardRes.json()
            } else {
                console.error('Failed to fetch admin dashboard data')
                data = dummyAdminDashboardData
            }

            if (escrowRes.ok) {
                escrowData = await escrowRes.json()
            }

            setDashboardData({
                products: data.products || 0,
                revenue: data.revenue || 0,
                orders: data.orders || 0,
                stores: data.stores || 0,
                allOrders: data.allOrders || [],
                protectionWindowDays: escrowData.protectionWindowDays || 7,
                stats: escrowData.stats || { pending: 0, available: 0, payoutQueue: 0 }
            })

        } catch (error) {
            console.error('Error fetching admin dashboard:', error)
            setDashboardData({ ...dummyAdminDashboardData, stats: { pending: 0, available: 0, payoutQueue: 0 } })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.products.toLocaleString(), icon: ShoppingBasketIcon },
        { title: 'Total Revenue', value: currency + dashboardData.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: PhilippinePesoIcon },
        { title: 'Total Orders', value: dashboardData.orders.toLocaleString(), icon: TagsIcon },
        { title: 'Total Stores', value: dashboardData.stores.toLocaleString(), icon: StoreIcon },
    ]

    const escrowCardsData = [
        { 
            title: 'Total Pending (Escrow)', 
            value: currency + dashboardData.stats.pending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            icon: Hourglass, 
            color: 'text-orange-600', 
            bg: 'bg-orange-100', 
            iconColor: 'text-orange-500', 
            borderColor: 'border-orange-200',
            hint: `Funds currently held in escrow. These are from orders that have been delivered but haven't passed the ${dashboardData.protectionWindowDays}-day protection period yet.`
        },
        { 
            title: 'Ready for Payout', 
            value: currency + dashboardData.stats.available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            icon: PhilippinePesoIcon, 
            color: 'text-green-600', 
            bg: 'bg-green-100', 
            iconColor: 'text-green-600', 
            borderColor: 'border-green-200',
            hint: 'Funds released from escrow and available for withdrawal by sellers. These earnings are safe to disburse.'
        },
        { 
            title: 'Payout Queue', 
            value: dashboardData.stats.payoutQueue + ' Requests', 
            icon: ListOrdered, 
            color: 'text-blue-600', 
            bg: 'bg-blue-100', 
            iconColor: 'text-blue-500', 
            borderColor: 'border-blue-200',
            hint: 'Number of pending withdrawal requests from sellers awaiting your approval to process the transfer.'
        },
    ]

    return (
        <div className="text-slate-500">
            <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

            {/* Main Stats Cards */}
            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg min-w-[240px] flex-1">
                            <div className="flex flex-col gap-3 text-xs">
                                <p>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className="w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
                        </div>
                    ))
                }
            </div>

            {/* Escrow Financial Stats */}
            <div className="flex flex-wrap gap-5 mb-10">
                {
                    escrowCardsData.map((card, index) => (
                        <div key={index} className={`relative group flex items-center gap-10 border p-3 px-6 rounded-lg min-w-[240px] flex-1 ${card.borderColor} transition-all hover:shadow-md cursor-help`}>
                            <div className="flex flex-col gap-3 text-xs">
                                <p className={`uppercase font-bold tracking-wider ${card.color}`}>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className={`w-11 h-11 p-2.5 rounded-full ${card.iconColor} ${card.bg}`} />
                            
                            {/* Hover Hint Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-xl text-center">
                                {card.hint}
                                {/* Tooltip Arrow */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* Bottom Section: Chart & Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
                <div className="lg:col-span-3">
                    <OrdersAreaChart allOrders={dashboardData.allOrders} />
                </div>
                <div className="lg:col-span-1">
                    <ComplianceShield />
                </div>
            </div>
        </div>
    )
}