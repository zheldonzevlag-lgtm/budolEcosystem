'use client'
import Loading from "@/components/Loading"
import Image from "next/image"
import BudolPayText from "@/components/payment/BudolPayText"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { Package, Search, Calendar, DollarSign, User, Store, MapPin, CheckCircle, X } from "lucide-react"
import { formatManilaTime } from "@/lib/dateUtils"
import { useSearch } from "@/context/SearchContext"

export default function AdminOrders() {
    const { searchQuery, updateSearchQuery } = useSearch()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)
    const [verifyingOrder, setVerifyingOrder] = useState(null)
    const [verificationLoading, setVerificationLoading] = useState(false)

    const fetchOrders = async () => {
        try {
            setLoading(true)
            let url = `/api/admin/orders?page=${page}&limit=20&`
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
                let ordersData = []
                if (data.orders) {
                    ordersData = data.orders
                    setPagination(data.pagination)
                } else {
                    ordersData = Array.isArray(data) ? data : []
                }

                setOrders(ordersData)
            } else {
                setOrders([])
            }
        } catch (error) {
            console.error("Error fetching orders:", error)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const updateOrderStatus = async (orderId, status) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })

            if (response.ok) {
                setOrders(orders.map(order =>
                    order.id === orderId ? { ...order, status } : order
                ))
                toast.success('Order status updated')
            } else {
                toast.error("Failed to update order status")
            }
        } catch (error) {
            console.error("Error updating order:", error)
            toast.error("Failed to update order status")
        }
    }

    const handleVerifyPayment = async (orderId, action) => {
        try {
            setVerificationLoading(true)
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(`/api/admin/orders/${orderId}/verify-payment`, {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            })

            if (response.ok) {
                const data = await response.json()
                setOrders(orders.map(order =>
                    order.id === orderId ? { ...order, status: data.status, isPaid: data.isPaid } : order
                ))
                toast.success(`Payment ${action === 'approve' ? 'approved' : 'rejected'}`)
                setVerifyingOrder(null)
            } else {
                toast.error("Failed to verify payment")
            }
        } catch (error) {
            console.error("Error verifying payment:", error)
            toast.error("Failed to verify payment")
        } finally {
            setVerificationLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [statusFilter, page, searchQuery])

    const getStatusColor = (status) => {
        switch (status) {
            case 'ORDER_PLACED':
                return 'bg-blue-100 text-blue-600'
            case 'PROCESSING':
                return 'bg-yellow-100 text-yellow-600'
            case 'SHIPPED':
                return 'bg-purple-100 text-purple-600'
            case 'DELIVERED':
                return 'bg-green-100 text-green-600'
            case 'PENDING_VERIFICATION':
                return 'bg-amber-100 text-amber-600'
            default:
                return 'bg-slate-100 text-slate-600'
        }
    }

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl">Manage <span className="text-slate-800 font-medium">Orders</span></h1>

                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-100 px-4 py-2 rounded-lg outline-none border border-slate-200"
                    >
                        <option value="all">All Orders</option>
                        <option value="ORDER_PLACED">Order Placed</option>
                        <option value="PENDING_VERIFICATION">Pending Verification</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                    </select>

                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                        <Search size={18} className="text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => updateSearchQuery(e.target.value)}
                            className="bg-transparent outline-none w-64"
                        />
                    </div>
                </div>
            </div>

            {orders.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Package size={20} className="text-slate-600" />
                                        <h3 className="text-sm font-semibold text-slate-800">Order # <BudolPayText text={order.id} /></h3>
                                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                        {order.isPaid ? (
                                            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">
                                                Paid
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600 font-medium">
                                                Unpaid
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-start gap-2">
                                            <User size={16} className="text-slate-500 mt-0.5" />
                                            <div>
                                                <p className="text-slate-500">Customer</p>
                                                <p className="font-medium text-slate-800">{order.user?.name}</p>
                                                <p className="text-xs text-slate-400">{order.user?.email}</p>
                                                {order.paymentId && (
                                                    <p className="text-xs text-slate-400 mt-1 font-mono break-all">{order.paymentId}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <Store size={16} className="text-slate-500 mt-0.5" />
                                            <div>
                                                <p className="text-slate-500">Store</p>
                                                <p className="font-medium text-slate-800">{order.store?.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <MapPin size={16} className="text-slate-500 mt-0.5" />
                                            <div>
                                                <p className="text-slate-500">Address</p>
                                                <p className="font-medium text-slate-800">{order.address?.street}</p>
                                                <p className="text-xs text-slate-400">{order.address?.city}, {order.address?.state}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <p className="text-sm text-slate-500 mb-2">Order Items:</p>
                                        <div className="space-y-2">
                                            {order.orderItems?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                                                    <span>{item.product?.name || 'Unknown Product'} x {item.quantity}</span>
                                                    <span className="font-medium">{currency}{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                                            <span className="font-semibold text-slate-800">Total:</span>
                                            <span className="text-lg font-bold text-green-600">{currency}{order.total}</span>
                                        </div>
                                    </div>

                                    {/* Lalamove Info */}
                                    {order.shipping && order.shipping.provider === 'lalamove' && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 bg-blue-50/50 p-3 rounded">
                                            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                                                <Image src="/lalamove-logo.png" alt="Lalamove" width={100} height={100} className="object-contain" />
                                                <span>Delivery</span>
                                            </div>
                                            <div className="text-sm text-slate-600 grid grid-cols-2 gap-2">
                                                <p>Service: {order.shipping.serviceType}</p>
                                                <p>Quote ID: <BudolPayText text={order.shipping.quoteId} /></p>
                                                {order.shipping.shareLink && (
                                                    <div className="col-span-2">
                                                        <a href={order.shipping.shareLink} target="_blank" className="text-blue-600 underline">Track Delivery</a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4 mt-4">
                                        <div className="flex items-start gap-2">
                                            <Calendar size={16} className="text-slate-500 mt-0.5" />
                                            <div>
                                                <p className="text-slate-500">Date</p>
                                                <p className="font-medium text-slate-800">{formatManilaTime(order.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="text-xs text-slate-400 font-mono">
                                                Order ID: <BudolPayText text={order.id} />
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 min-w-[200px]">
                                    <select
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                        className="px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm bg-slate-50 focus:border-slate-400 transition-colors"
                                    >
                                        <option value="ORDER_PLACED">Order Placed</option>
                                        <option value="PROCESSING">Processing</option>
                                        <option value="SHIPPED">Shipped</option>
                                        <option value="DELIVERED">Delivered</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>

                                    {order.status === 'PENDING_VERIFICATION' && (
                                        <button
                                            onClick={() => setVerifyingOrder(order)}
                                            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm"
                                        >
                                            Verify Payment
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No orders found</h1>
                </div>
            )}

            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-4 mt-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-slate-50"
                    >
                        Previous
                    </button>
                    <span className="flex items-center text-slate-600">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-slate-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Verification Modal */}
            {verifyingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Verify Payment Proof</h3>
                            <button
                                onClick={() => setVerifyingOrder(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Submitted Receipt</p>
                                    <div className="aspect-[3/4] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden relative group">
                                        {verifyingOrder.paymentProof?.imageUrl ? (
                                            <a href={verifyingOrder.paymentProof.imageUrl} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={verifyingOrder.paymentProof.imageUrl}
                                                    alt="Payment proof"
                                                    className="w-full h-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300"
                                                />
                                            </a>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                <DollarSign size={40} className="mb-2" />
                                                <p>No image uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs text-slate-400 text-center italic">Click image to view full size</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Order Details</p>
                                        <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Order ID:</span>
                                                <span className="font-mono text-slate-700">#<BudolPayText text={verifyingOrder.id} /></span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Subtotal:</span>
                                                <span className="text-slate-700">{currency}{Number(verifyingOrder.total - (verifyingOrder.shippingCost || 0)).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Shipping Fee:</span>
                                                <span className="text-green-600 font-medium">{verifyingOrder.shippingCost > 0 ? `${currency}${Number(verifyingOrder.shippingCost).toLocaleString()}` : 'FREE'}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                                                <span className="text-slate-500">Amount to Verify:</span>
                                                <span className="font-bold text-green-600">{currency}{verifyingOrder.total.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Payment Method:</span>
                                                <span className="font-bold text-slate-700">
                                                    {verifyingOrder.paymentMethod === 'BUDOL_PAY' ? (
                                                        <BudolPayText text="budolPay" />
                                                    ) : verifyingOrder.paymentMethod === 'BUDOL_CARE' ? (
                                                        <BudolPayText text="budolCare" />
                                                    ) : (
                                                        verifyingOrder.paymentMethod
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Submission Details</p>
                                        <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase">Reference Number</p>
                                                <p className="font-bold text-slate-800 break-all">
                                                    <BudolPayText text={verifyingOrder.paymentProof?.refNumber || 'N/A'} />
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase">Buyer's Notes</p>
                                                <p className="text-slate-700">{verifyingOrder.paymentProof?.notes || 'No notes provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase">Submitted At</p>
                                                <p className="text-slate-700">{verifyingOrder.paymentProof?.createdAt ? formatManilaTime(verifyingOrder.paymentProof.createdAt) : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                            Check the <strong>Reference Number</strong> and <strong>Amount</strong> against your payment provider dashboard (GCash/Maya/Bank) before approving.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                            <button
                                onClick={() => handleVerifyPayment(verifyingOrder.id, 'reject')}
                                disabled={verificationLoading}
                                className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                Reject Payment
                            </button>
                            <button
                                onClick={() => handleVerifyPayment(verifyingOrder.id, 'approve')}
                                disabled={verificationLoading}
                                className="flex-[2] py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {verificationLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle size={20} />
                                )}
                                Approve & Mark as Paid
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

