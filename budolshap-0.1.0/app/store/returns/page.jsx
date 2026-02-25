'use client'
import { useEffect, useState } from "react"
import Image from "next/image"
import Loading from "@/components/Loading"
import toast from "react-hot-toast"
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Eye, PackageCheck, X, ExternalLink, Banknote, Truck } from "lucide-react"
import { useRealtimeReturns } from "@/hooks/useRealtimeReturns"
import { useAuth } from "@/context/AuthContext"
import { formatManilaTime, getManilaDateString } from "@/lib/dateUtils"
import BudolPayText from "@/components/payment/BudolPayText"

export default function StoreReturns() {
    const { user, isLoading: authLoading } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₱'
    const [storeId, setStoreId] = useState(null)
    const [activeTab, setActiveTab] = useState('ALL')
    const { returns, isLoading, mutate } = useRealtimeReturns({ storeId })
    const [selectedReturn, setSelectedReturn] = useState(null)
    const [isActionModalOpen, setIsActionModalOpen] = useState(false)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [amountRange, setAmountRange] = useState({ min: '', max: '' })
    const [selectedTypes, setSelectedTypes] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [actionType, setActionType] = useState('')
    const [actionReason, setActionReason] = useState('')
    const [partialAmount, setPartialAmount] = useState('')

    const tabs = [
        { id: 'ALL', label: 'All', statuses: [] },
        { id: 'NEW_REQUEST', label: 'New Request', statuses: ['PENDING'] },
        { id: 'IN_PROGRESS', label: 'In Progress', statuses: ['APPROVED', 'BOOKING_REQUESTED', 'BOOKED', 'PICKED_UP', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
        { id: 'TO_RECEIVE', label: 'To Receive', statuses: ['DELIVERED'] },
        { id: 'COMPLETED', label: 'Completed', statuses: ['RECEIVED', 'REFUNDED'] },
        { id: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED'] },
        { id: 'DISPUTED', label: 'Disputed', statuses: ['DISPUTED'] },
    ]


    // Initial Store Fetch
    useEffect(() => {
        const initStore = async () => {
            if (authLoading) return;

            if (!user) {
                // Let StoreLayout handle redirect
                return
            }
            try {
                const res = await fetch(`/api/stores/user/${user.id}`)
                if (res.ok) {
                    const store = await res.json()
                    if (store) {
                        setStoreId(store.id)
                    } else {
                        toast.error("Store not found")
                    }
                }
            } catch (err) {
                console.error("Failed to load store", err)
            }
        }
        initStore()
    }, [authLoading, user])

    // Auto-sync active Lalamove returns
    useEffect(() => {
        if (!returns || !returns.length) return;

        // Filter returns that are active and use Lalamove
        const activeReturns = returns.filter(r =>
            ['BOOKED', 'PICKED_UP', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(r.status) &&
            r.returnShipping?.bookingId
        );

        if (activeReturns.length === 0) return;

        console.log(`[AutoSync] Monitoring ${activeReturns.length} active returns...`);

        const interval = setInterval(() => {
            activeReturns.forEach(ret => {
                // Fire and forget sync to keep UI fresh
                // The sync endpoint will trigger realtime events 'return-updated' which we listen to
                fetch(`/api/orders/${ret.orderId}/sync-lalamove`, { method: 'POST' })
                    .then(res => {
                        if (res.ok) console.log(`[AutoSync] Synced return for order ${ret.orderId}`);
                    })
                    .catch(err => console.error('[AutoSync] Failed', err));
            });
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [returns]);

    const handleAction = async () => {
        if (!selectedReturn) return
        setIsProcessing(true)
        try {
            const res = await fetch(`/api/store/returns/${selectedReturn.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: actionType,
                    reason: actionReason,
                    partialAmount: actionType === 'OFFER_PARTIAL' ? parseFloat(partialAmount) : undefined
                })
            })

            if (res.ok) {
                toast.success(`Return ${actionType.toLowerCase()}ed successfully`)
                setIsActionModalOpen(false)
                setSelectedReturn(null)
                setActionReason('')
                setPartialAmount('')
                mutate()
            } else {
                const data = await res.json()
                toast.error(data.error || "Action failed")
            }
        } catch (err) {
            console.error("Action error:", err)
            toast.error("An error occurred")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleBookReturn = async (ret) => {
        if (!confirm("Confirm booking return shipping? This will book a courier to pick up the item from the customer.")) return;

        setIsProcessing(true);
        const toastId = toast.loading("Booking return shipping...");

        try {
            const res = await fetch('/api/shipping/lalamove/book-return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: ret.orderId,
                    returnId: ret.id,
                    provider: 'lalamove',
                    serviceType: 'MOTORCYCLE'
                })
            });

            if (res.ok) {
                toast.success("Return shipping booked successfully!", { id: toastId });
                mutate();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to book return shipping", { id: toastId });
            }
        } catch (err) {
            console.error("Booking error:", err);
            toast.error("An error occurred during booking", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

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
            case 'DISPUTED': return 'bg-red-100 text-red-700'
            case 'CANCELLED': return 'bg-gray-100 text-gray-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getDeliveryStatusLabel = (shipping) => {
        if (!shipping?.status) return 'Booked';

        const status = shipping.status.toUpperCase();
        if (status === 'ON_GOING' || status === 'ON_THE_WAY' || status === 'IN_TRANSIT') {
            return 'In Transit';
        }
        if (status === 'PICKED_UP') return 'Picked Up';
        if (status === 'COMPLETED' || status === 'DELIVERED' || status === 'FINISHED') return 'Delivered';
        if (status === 'ASSIGNING_DRIVER') return 'Finding Driver';
        if (status === 'PICKUP_IN_PROGRESS') return 'Driver heading to Pickup';

        return status.replace(/_/g, ' ');
    }

    // Calculate statistics
    const stats = {
        all: returns.length,
        newRequest: returns.filter(r => r.status === 'PENDING').length,
        toBook: returns.filter(r => r.status === 'BOOKING_REQUESTED').length,
        booked: returns.filter(r => r.status === 'BOOKED').length,
        inTransit: returns.filter(r => ['PICKED_UP', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(r.status)).length,
        arrived: returns.filter(r => r.status === 'DELIVERED').length,
        completed: returns.filter(r => ['RECEIVED', 'REFUNDED'].includes(r.status)).length,
        cancelled: returns.filter(r => r.status === 'CANCELLED').length,
        disputed: returns.filter(r => r.status === 'DISPUTED').length,
    }

    const toggleTypeSelection = (type) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }

    const filteredReturns = returns.filter(ret => {
        // Tab filtering
        if (activeTab !== 'ALL') {
            const currentTab = tabs.find(t => t.id === activeTab);
            if (!currentTab?.statuses.includes(ret.status)) return false;
        }

        // Search filtering
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesId = ret.id.toLowerCase().includes(searchLower) || ret.orderId.toLowerCase().includes(searchLower);
            const matchesCustomer = ret.order?.user?.name?.toLowerCase().includes(searchLower) ||
                ret.order?.user?.email?.toLowerCase().includes(searchLower);
            if (!matchesId && !matchesCustomer) return false;
        }

        // Date range filter
        if (dateRange.start || dateRange.end) {
            const returnDate = new Date(ret.createdAt)
            if (dateRange.start && returnDate < new Date(dateRange.start)) return false
            if (dateRange.end && returnDate > new Date(dateRange.end)) return false
        }

        // Amount range filter
        if (amountRange.min || amountRange.max) {
            if (amountRange.min && ret.refundAmount < parseFloat(amountRange.min)) return false
            if (amountRange.max && ret.refundAmount > parseFloat(amountRange.max)) return false
        }

        // Type filter
        if (selectedTypes.length > 0) {
            if (!selectedTypes.includes(ret.type)) return false
        }

        return true;
    });

    const handleExportCSV = () => {
        if (filteredReturns.length === 0) {
            toast.error("No data to export")
            return
        }

        const exportData = filteredReturns.map(ret => ({
            'Return ID': ret.id,
            'Order ID': ret.orderId,
            'Customer': ret.order?.user?.name || 'N/A',
            'Refund Amount': ret.refundAmount,
            'Type': ret.type,
            'Status': ret.status,
            'Reason': ret.reason,
            'Courier': ret.returnShipping?.provider || 'N/A',
            'Tracking ID': ret.returnShipping?.bookingId || 'N/A',
            'Date': formatManilaTime(ret.createdAt, { dateStyle: 'short' })
        }))

        const csv = [
            Object.keys(exportData[0]).join(','),
            ...exportData.map(row => Object.values(row).map(field =>
                typeof field === 'string' && field.includes(',') ? `"${field}"` : field
            ).join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `returns_${getManilaDateString()}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Returns exported successfully!')
    }

    if (isLoading && !returns.length) return <Loading />

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto mb-20">
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-2xl text-slate-500">Store <span className="text-slate-800 font-medium">Returns & Refunds</span></h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                        <ExternalLink size={16} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => mutate()}
                        disabled={isLoading}
                        className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-slate-400 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">New Request</p>
                            <p className="text-2xl font-bold text-amber-700 mt-1">{stats.newRequest}</p>
                        </div>
                        <div className="bg-amber-200 rounded-full p-3">
                            <AlertCircle size={20} className="text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Needs Booking</p>
                            <p className="text-2xl font-bold text-orange-700 mt-1">{stats.toBook}</p>
                        </div>
                        <div className="bg-orange-200 rounded-full p-3">
                            <Truck size={20} className="text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-sky-600 font-medium uppercase tracking-wide">Courier Booked</p>
                            <p className="text-2xl font-bold text-sky-700 mt-1">{stats.booked}</p>
                        </div>
                        <div className="bg-sky-200 rounded-full p-3 text-sky-600">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">In Transit</p>
                            <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.inTransit}</p>
                        </div>
                        <div className="bg-indigo-200 rounded-full p-3">
                            <Truck size={20} className="text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-cyan-600 font-medium uppercase tracking-wide">Arrived at Store</p>
                            <p className="text-2xl font-bold text-cyan-700 mt-1">{stats.arrived}</p>
                        </div>
                        <div className="bg-cyan-200 rounded-full p-3">
                            <PackageCheck size={20} className="text-cyan-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-rose-600 font-medium uppercase tracking-wide">Disputed</p>
                            <p className="text-2xl font-bold text-rose-700 mt-1">{stats.disputed}</p>
                        </div>
                        <div className="bg-rose-200 rounded-full p-3 text-rose-600 flex items-center justify-center font-bold text-sm">
                            R&R
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="mb-4 flex gap-2 flex-wrap items-center">
                <div className="flex-1 min-w-[300px]">
                    <input
                        type="text"
                        placeholder="Search by order ID, return ID or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                    />
                </div>

                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Advanced Filters
                </button>

                {(searchTerm || dateRange.start || dateRange.end || amountRange.min || amountRange.max || selectedTypes.length > 0) && (
                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setDateRange({ start: '', end: '' })
                            setAmountRange({ min: '', max: '' })
                            setSelectedTypes([])
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                                />
                                <span className="self-center text-slate-500 text-xs">to</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Refund Range ({currency})</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={amountRange.min}
                                    onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                                />
                                <span className="self-center text-slate-500 text-xs">to</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={amountRange.max}
                                    onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.includes('RETURN_AND_REFUND')}
                                        onChange={() => toggleTypeSelection('RETURN_AND_REFUND')}
                                        className="rounded border-slate-300 text-slate-600"
                                    />
                                    <span className="text-sm">Return + Refund</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.includes('REFUND_ONLY')}
                                        onChange={() => toggleTypeSelection('REFUND_ONLY')}
                                        className="rounded border-slate-300 text-slate-600"
                                    />
                                    <span className="text-sm">Refund Only</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filteredReturns.length}</span> results
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-4 flex gap-2 flex-wrap">
                <button
                    onClick={() => setActiveTab('ALL')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ALL'
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                >
                    All Requests ({stats.all})
                </button>
                <button
                    onClick={() => setActiveTab('NEW_REQUEST')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'NEW_REQUEST'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                >
                    <AlertCircle size={14} /> New Request ({stats.newRequest})
                </button>
                <button
                    onClick={() => setActiveTab('IN_PROGRESS')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'IN_PROGRESS'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                >
                    <Truck size={14} /> In Progress ({stats.toBook + stats.booked + stats.inTransit})
                </button>
                <button
                    onClick={() => setActiveTab('TO_RECEIVE')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'TO_RECEIVE'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                        }`}
                >
                    <PackageCheck size={14} /> To Receive ({stats.arrived})
                </button>
                <button
                    onClick={() => setActiveTab('COMPLETED')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'COMPLETED'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                >
                    <CheckCircle size={14} /> Completed ({stats.completed})
                </button>
                <button
                    onClick={() => setActiveTab('CANCELLED')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'CANCELLED'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                >
                    <XCircle size={14} /> Cancelled ({stats.cancelled})
                </button>
                <button
                    onClick={() => setActiveTab('DISPUTED')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'DISPUTED'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                >
                    <AlertCircle size={14} /> Disputed ({stats.disputed})
                </button>
            </div>

            {filteredReturns.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-500 text-lg">No return requests found</p>
                    {activeTab !== 'ALL' && (
                        <button
                            onClick={() => setActiveTab('ALL')}
                            className="mt-4 text-blue-600 hover:text-blue-700 underline"
                        >
                            View all requests
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-md shadow border border-gray-200 bg-white">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        disabled
                                        className="rounded border-slate-300 text-slate-400 cursor-not-allowed"
                                    />
                                </th>
                                <th className="px-4 py-3">Sr. No.</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Refund Total</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Delivery</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredReturns.map((ret, index) => (
                                <tr
                                    key={ret.id}
                                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                    onClick={() => {
                                        setSelectedReturn(ret);
                                        setIsDetailsModalOpen(true);
                                    }}
                                >
                                    <td className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            disabled
                                            className="rounded border-slate-300 text-slate-400 cursor-not-allowed"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-green-600 font-medium whitespace-nowrap">
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="font-medium text-slate-800">{ret.order?.user?.name || 'Anonymous'}</div>
                                        <div className="text-xs text-slate-500">#<BudolPayText text={ret.orderId} /></div>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                                        {currency}{ret.refundAmount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${ret.type === 'RETURN_AND_REFUND' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {ret.type === 'RETURN_AND_REFUND' ? 'Return + Refund' : 'Refund Only'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(ret.status)}`}>
                                            {ret.status === 'BOOKING_REQUESTED' ? 'Pending Booking' :
                                                ret.status === 'BOOKED' ? 'Courier Booked' :
                                                    ret.status === 'PICKED_UP' ? 'Picked Up' :
                                                        ret.status === 'SHIPPED' ? 'In Transit' :
                                                            ret.status === 'DELIVERED' ? 'Arrived at Store' :
                                                                ret.status === 'REFUNDED' ? 'Returned & Refunded' :
                                                                    ret.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {ret.returnShipping?.bookingId ? (
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 text-xs font-medium text-blue-700">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${['BOOKED', 'PICKED_UP', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(ret.status) && !['REFUNDED', 'RECEIVED'].includes(ret.status) ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></span>
                                                    {getDeliveryStatusLabel(ret.returnShipping)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono mt-1">ID: {ret.returnShipping.bookingId}</span>
                                            </div>
                                        ) : ret.status === 'BOOKING_REQUESTED' ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBookReturn(ret);
                                                }}
                                                disabled={isProcessing}
                                                className="flex items-center gap-1.5 px-3 py-1 bg-orange-600 text-white text-[10px] font-bold uppercase rounded hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                <Truck size={10} />
                                                Book Courier
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                                        <div className="font-medium">{formatManilaTime(ret.createdAt, { dateStyle: 'medium' })}</div>
                                        <div className="text-[10px] text-slate-400">
                                            {formatManilaTime(ret.createdAt, { timeStyle: 'short' })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1">
                                            {ret.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReturn(ret);
                                                            setActionType('ACCEPT');
                                                            setIsActionModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="Accept"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReturn(ret);
                                                            setActionType('REJECT');
                                                            setIsActionModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {ret.status === 'DELIVERED' && ret.type === 'RETURN_AND_REFUND' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedReturn(ret);
                                                        setActionType('RECEIVE');
                                                        setIsActionModalOpen(true);
                                                    }}
                                                    className="relative px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded hover:bg-blue-700 transition-all shadow-md flex items-center gap-1 overflow-visible group active:scale-95"
                                                    title="Confirm parcel received"
                                                >
                                                    {/* Notification Badge with Ping Animation */}
                                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white border-2 border-blue-600"></span>
                                                    </span>
                                                    <PackageCheck size={12} className="group-hover:rotate-12 transition-transform" />
                                                    Receive
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedReturn(ret);
                                                    setIsDetailsModalOpen(true);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsModalOpen && selectedReturn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Return Request Details</h2>
                                <p className="text-slate-500 text-sm">Order #{selectedReturn.orderId.substring(0, 8)}</p>
                            </div>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedReturn.status)}`}>
                                        {selectedReturn.status === 'BOOKING_REQUESTED' ? 'Pending Booking' :
                                            selectedReturn.status === 'BOOKED' ? 'Courier Booked' :
                                                selectedReturn.status === 'PICKED_UP' ? 'Picked Up' :
                                                    selectedReturn.status === 'SHIPPED' ? 'In Transit' :
                                                        selectedReturn.status === 'DELIVERED' ? 'Arrived at Store' :
                                                            selectedReturn.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Type</p>
                                    <p className="text-sm font-semibold text-slate-700">
                                        {selectedReturn.type === 'RETURN_AND_REFUND' ? 'Return Item & Refund' : 'Refund Only'}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Refund Amount</p>
                                    <p className="text-lg font-bold text-green-600">{currency}{selectedReturn.refundAmount.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Reason</p>
                                    <p className="text-sm font-semibold text-slate-700">{selectedReturn.reason.replace(/_/g, ' ')}</p>
                                </div>
                            </div>

                            {selectedReturn.images && selectedReturn.images.length > 0 && (
                                <div>
                                    <p className="text-sm font-bold text-slate-700 mb-3">Evidence Images</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {selectedReturn.images.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                                                <img
                                                    src={img}
                                                    alt={`Evidence ${idx + 1}`}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                                    onClick={() => window.open(img, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Return Tracking Info */}
                            {selectedReturn.returnShipping && (
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-slate-700">Return Tracking Info</p>
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <PackageCheck className="text-blue-600" size={20} />
                                                <span className="font-bold text-blue-800 text-sm">Lalamove Delivery</span>
                                            </div>
                                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                                                {selectedReturn.returnShipping.status || 'BOOKED'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-blue-600 font-medium mb-1 uppercase tracking-tighter">Tracking ID</p>
                                                <p className="font-bold text-slate-700">{selectedReturn.returnShipping.bookingId}</p>
                                            </div>
                                            {selectedReturn.returnShipping.driverInfo && (
                                                <div>
                                                    <p className="text-blue-600 font-medium mb-1 uppercase tracking-tighter">Rider</p>
                                                    <p className="font-bold text-slate-700">{selectedReturn.returnShipping.driverInfo.name}</p>
                                                    <p className="text-slate-500">{selectedReturn.returnShipping.driverInfo.phone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedReturn.sellerNote && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                    <p className="text-xs text-amber-600 uppercase font-bold mb-1">Seller Note</p>
                                    <p className="text-sm text-amber-800">{selectedReturn.sellerNote}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => window.open(`/store/orders?search=${selectedReturn.orderId}`, '_blank')}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 flex items-center gap-2"
                            >
                                <ExternalLink size={16} />
                                View Order
                            </button>
                            {selectedReturn.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setActionType('REJECT');
                                            setIsDetailsModalOpen(false);
                                            setIsActionModalOpen(true);
                                        }}
                                        className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType('ACCEPT');
                                            setIsDetailsModalOpen(false);
                                            setIsActionModalOpen(true);
                                        }}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
                                    >
                                        Accept Request
                                    </button>
                                </>
                            )}
                            {['APPROVED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'RECEIVED'].includes(selectedReturn.status) && selectedReturn.type === 'RETURN_AND_REFUND' && (
                                <button
                                    onClick={() => {
                                        setActionType('RECEIVE');
                                        setIsDetailsModalOpen(false);
                                        setIsActionModalOpen(true);
                                    }}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <PackageCheck size={18} />
                                    Receive & Refund
                                </button>
                            )}
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modal */}
            {isActionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">
                                {actionType === 'RECEIVE' ? 'Confirm Parcel Receipt' :
                                    actionType === 'OFFER_PARTIAL' ? 'Offer Partial Refund' :
                                        `${actionType === 'ACCEPT' ? 'Accept' : 'Reject'} Return Request`}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                {actionType === 'RECEIVE' ? 'Confirming receipt will finalize the refund to the buyer.' :
                                    actionType === 'OFFER_PARTIAL' ? 'Suggest a partial refund amount to the buyer without requiring a return.' :
                                        `Are you sure you want to ${actionType.toLowerCase()} this request for Order #${selectedReturn?.orderId.substring(0, 8)}?`}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {actionType === 'OFFER_PARTIAL' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Partial Refund Amount ({currency})
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                                        <input
                                            type="number"
                                            value={partialAmount}
                                            onChange={(e) => setPartialAmount(e.target.value)}
                                            className="w-full pl-8 rounded-lg border-slate-200 focus:ring-amber-500 focus:border-amber-500 text-sm font-bold"
                                            placeholder="0.00"
                                            max={selectedReturn?.refundAmount}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 italic">
                                        Max: {currency}{selectedReturn?.refundAmount.toLocaleString()} (Full refund)
                                    </p>
                                </div>
                            )}

                            {(actionType === 'REJECT' || actionType === 'ACCEPT' || actionType === 'OFFER_PARTIAL') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {actionType === 'OFFER_PARTIAL' ? 'Note to Buyer' : 'Reason / Note (Optional)'}
                                    </label>
                                    <textarea
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        className="w-full border-slate-200 focus:ring-green-500 focus:border-green-500 text-sm p-3"
                                        rows="3"
                                        placeholder="Add a reason for your action..."
                                    ></textarea>
                                </div>
                            )}

                            {actionType === 'ACCEPT' && selectedReturn?.type === 'REFUND_ONLY' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                    <p className="text-xs text-amber-700">
                                        Accepting a <strong>Refund Only</strong> request will immediately deduct {currency}{selectedReturn?.refundAmount.toLocaleString()} from your wallet.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsActionModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={isProcessing}
                                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-all ${actionType === 'REJECT'
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : actionType === 'OFFER_PARTIAL'
                                        ? 'bg-amber-500 hover:bg-amber-600'
                                        : 'bg-green-600 hover:bg-green-700'
                                    } disabled:opacity-50`}
                            >
                                {isProcessing ? 'Processing...' : `Confirm ${actionType === 'RECEIVE' ? 'Receipt' : actionType === 'OFFER_PARTIAL' ? 'Offer' : actionType.charAt(0) + actionType.slice(1).toLowerCase()}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
