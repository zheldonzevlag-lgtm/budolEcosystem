'use client'
import Loading from "@/components/Loading"
import Image from "next/image"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { RefreshCcw, Search, Calendar, DollarSign, User, Store, MapPin, CheckCircle, X, AlertTriangle, MessageSquare, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useSearch } from "@/context/SearchContext"

export default function AdminReturns() {
    const { searchQuery, updateSearchQuery } = useSearch()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [returns, setReturns] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    const fetchReturns = async () => {
        try {
            setLoading(true)
            let url = `/api/admin/returns?page=${page}&limit=20&`
            if (statusFilter !== 'all') url += `status=${statusFilter}&`
            if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(url, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setReturns(data.returns || [])
                setPagination(data.pagination)
            } else {
                setReturns([])
            }
        } catch (error) {
            console.error("Error fetching returns:", error)
            setReturns([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchReturns()
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [statusFilter, page, searchQuery])

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700'
            case 'APPROVED': return 'bg-blue-100 text-blue-700'
            case 'BOOKING_REQUESTED': return 'bg-orange-100 text-orange-700'
            case 'BOOKED': return 'bg-sky-100 text-sky-700'
            case 'PICKED_UP': return 'bg-purple-100 text-purple-700'
            case 'SHIPPED':
            case 'IN_TRANSIT': return 'bg-indigo-100 text-indigo-700'
            case 'OUT_FOR_DELIVERY': return 'bg-violet-100 text-violet-700'
            case 'DELIVERED': return 'bg-cyan-100 text-cyan-700 border border-cyan-200'
            case 'RECEIVED': return 'bg-emerald-100 text-emerald-700'
            case 'REFUNDED': return 'bg-green-100 text-green-700'
            case 'DISPUTED': return 'bg-red-100 text-red-700 border border-red-200'
            case 'CANCELLED': return 'bg-gray-100 text-gray-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    if (loading && page === 1 && !returns.length) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Return & Refund Requests</h1>
                    <p className="text-slate-500 text-sm mt-1">Global management of all customer returns</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value)
                            setPage(1)
                        }}
                        className="bg-white px-4 py-2 rounded-xl outline-none border border-slate-200 text-sm font-medium shadow-sm focus:ring-2 focus:ring-green-500/20 transition-all"
                    >
                        <option value="all">All Statuses</option>
                        <optgroup label="Pending Action">
                            <option value="PENDING">Pending Approval</option>
                            <option value="BOOKING_REQUESTED">To Book Courier</option>
                        </optgroup>
                        <optgroup label="In Progress">
                            <option value="APPROVED">Return Authorized</option>
                            <option value="BOOKED">Courier Booked</option>
                            <option value="PICKED_UP">Picked Up</option>
                            <option value="SHIPPED">In Transit</option>
                            <option value="DELIVERED">Arrived at Store</option>
                        </optgroup>
                        <optgroup label="Resolved">
                            <option value="RECEIVED">Received by Seller</option>
                            <option value="REFUNDED">Refunded</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="DISPUTED">Disputed</option>
                        </optgroup>
                    </select>

                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                        <Search size={18} className="text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search Return ID or User..."
                            value={searchQuery}
                            onChange={(e) => {
                                updateSearchQuery(e.target.value)
                                setPage(1)
                            }}
                            className="bg-transparent outline-none w-64 text-slate-800"
                        />
                    </div>
                </div>
            </div>

            {returns.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {returns.map((ret) => (
                        <div key={ret.id} className={`bg-white border rounded-lg shadow-sm p-6 ${ret.status === 'DISPUTED' ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'}`}>
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <RefreshCcw size={20} className={ret.status === 'DISPUTED' ? 'text-rose-600' : 'text-slate-600'} />
                                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                            Return #{ret.id}
                                            {ret.status === 'DISPUTED' && <AlertTriangle size={16} className="text-rose-600" />}
                                        </h3>
                                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(ret.status)}`}>
                                            {ret.status.replace('_', ' ')}
                                        </span>
                                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${ret.type === 'RETURN_ITEM' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                            {ret.type === 'RETURN_ITEM' ? 'Return & Refund' : 'Refund Only'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-start gap-2">
                                            <User size={16} className="text-slate-500 mt-0.5" />
                                            <div>
                                                <p className="text-slate-500 text-xs">Buyer</p>
                                                <p className="font-medium text-slate-800">{ret.order?.user?.name}</p>
                                                <p className="text-xs text-slate-400">{ret.order?.user?.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <Store size={16} className="text-slate-500 mt-0.5" />
                                            <div>
                                                <p className="text-slate-500 text-xs">Store</p>
                                                <p className="font-medium text-slate-800">{ret.order?.store?.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <Calendar size={16} className="text-slate-500 mt-0.5" />
                                            <div>
                                                <p className="text-slate-500 text-xs">Requested On</p>
                                                <p className="font-medium text-slate-800">{formatManilaTime(ret.createdAt, { dateStyle: 'short' })}</p>
                                                <p className="text-xs text-slate-400">{formatManilaTime(ret.createdAt, { timeStyle: 'short' })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <div className="flex items-start gap-2 mb-3">
                                            <div className="p-2 bg-slate-50 rounded text-slate-600">
                                                <MessageSquare size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-semibold">Reason</p>
                                                <p className="text-sm text-slate-800 font-medium">{ret.reason.replace(/_/g, ' ')}</p>
                                                {ret.description && <p className="text-xs text-slate-500 mt-1 italic">"{ret.description}"</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 bg-slate-50/50 p-3 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-600">Refund Amount:</span>
                                                <span className="text-lg font-bold text-green-600">{currency}{ret.refundAmount}</span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={`/admin/orders?search=${ret.orderId}`}
                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                >
                                                    View Order <ExternalLink size={12} />
                                                </Link>
                                                <Link
                                                    href={`/admin/returns/${ret.id}`}
                                                    className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition"
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl mt-8">
                    <RefreshCcw size={48} className="text-slate-200 mb-4" />
                    <p className="text-slate-400">No return requests found</p>
                </div>
            )}

            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm">Page {page} of {pagination.totalPages}</span>
                    <button
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
