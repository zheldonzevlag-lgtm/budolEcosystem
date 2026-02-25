'use client'
import Loading from "@/components/Loading"
import Image from "next/image"
import { useEffect, useState, use } from "react"
import { toast } from "react-hot-toast"
import {
    RefreshCcw, ArrowLeft, Calendar, DollarSign, User, Store,
    MapPin, CheckCircle, X, AlertTriangle, MessageSquare,
    ExternalLink, Package, Shield, Info, Image as ImageIcon
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatManilaTime } from "@/lib/dateUtils"

export default function AdminReturnDetails({ params }) {
    const { returnId } = use(params)
    const router = useRouter()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [returnData, setReturnData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [resolving, setResolving] = useState(false)
    const [adminNotes, setAdminNotes] = useState('')
    const [showMediationModal, setShowMediationModal] = useState(false)
    const [selectedResolution, setSelectedResolution] = useState(null)

    const fetchReturnDetails = async () => {
        try {
            setLoading(true)
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(`/api/admin/returns/${returnId}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setReturnData(data)
                setAdminNotes(data.arbitrationNotes || '')
            } else {
                toast.error("Failed to load return details")
                router.push('/admin/returns')
            }
        } catch (error) {
            console.error("Error fetching return details:", error)
            toast.error("An error occurred while loading details")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReturnDetails()
    }, [returnId])

    const handleResolve = async () => {
        if (!selectedResolution) return

        try {
            setResolving(true)
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(`/api/admin/returns/${returnId}/resolve`, {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resolution: selectedResolution,
                    adminNotes
                })
            })

            if (response.ok) {
                toast.success("Dispute resolved successfully")
                setShowMediationModal(false)
                fetchReturnDetails()
            } else {
                const error = await response.json()
                toast.error(error.message || "Failed to resolve dispute")
            }
        } catch (error) {
            console.error("Error resolving dispute:", error)
            toast.error("Failed to resolve dispute")
        } finally {
            setResolving(false)
        }
    }

    const getStatusBadge = (status) => {
        const colors = {
            'PENDING': 'bg-amber-100 text-amber-600 border-amber-200',
            'APPROVED': 'bg-blue-100 text-blue-600 border-blue-200',
            'BOOKED': 'bg-sky-100 text-sky-600 border-sky-200',
            'PICKED_UP': 'bg-purple-100 text-purple-600 border-purple-200',
            'SHIPPED': 'bg-purple-100 text-purple-600 border-purple-200',
            'IN_TRANSIT': 'bg-indigo-100 text-indigo-600 border-indigo-200',
            'OUT_FOR_DELIVERY': 'bg-violet-100 text-violet-600 border-violet-200',
            'DELIVERED': 'bg-cyan-100 text-cyan-600 border-cyan-200',
            'RECEIVED': 'bg-emerald-100 text-emerald-600 border-emerald-200',
            'COMPLETED': 'bg-green-100 text-green-600 border-green-200',
            'REJECTED': 'bg-red-100 text-red-600 border-red-200',
            'DISPUTED': 'bg-rose-100 text-rose-600 border-rose-300 animate-pulse',
            'REFUNDED': 'bg-emerald-100 text-emerald-600 border-emerald-200',
            'CANCELLED': 'bg-slate-100 text-slate-600 border-slate-200'
        }
        return (
            <span className={`px-3 py-1 text-xs rounded-full font-bold border ${colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {status.replace('_', ' ')}
            </span>
        )
    }

    if (loading) return <Loading />
    if (!returnData) return null

    const images = Array.isArray(returnData.images) ? returnData.images : JSON.parse(returnData.images || '[]')

    return (
        <div className="text-slate-700 mb-28 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/returns" className="p-2 hover:bg-slate-100 rounded-full transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            Return Details <span className="text-slate-400 font-normal">#{returnData.id}</span>
                        </h1>
                        <p className="text-sm text-slate-500">Associated with Order #{returnData.orderId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(returnData.status)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Return Info & Evidence */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Return Summary */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <RefreshCcw size={18} className="text-primary" /> Return Summary
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Reason</p>
                                <p className="text-sm font-semibold">{returnData.reason.replace(/_/g, ' ')}</p>
                                {returnData.description && <p className="text-sm text-slate-500 mt-2 italic">"{returnData.description}"</p>}
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Return Type</p>
                                <p className={`text-sm font-bold ${returnData.type === 'RETURN_ITEM' ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {returnData.type === 'RETURN_ITEM' ? 'Return & Refund' : 'Refund Only'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Refund Amount</p>
                                <p className="text-xl font-black text-green-600">{currency}{returnData.refundAmount}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Requested On</p>
                                <p className="text-sm font-semibold">{formatManilaTime(returnData.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Evidence Viewer */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <ImageIcon size={18} className="text-primary" /> Evidence Provided
                        </h2>
                        {images.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-100 group">
                                        <Image
                                            src={img}
                                            alt={`Evidence ${idx + 1}`}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform cursor-pointer"
                                            onClick={() => window.open(img, '_blank')}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <ImageIcon size={32} className="text-slate-300 mb-2" />
                                <p className="text-sm text-slate-400">No images provided</p>
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Package size={18} className="text-primary" /> Order Items
                        </h2>
                        <div className="space-y-3">
                            {returnData.order?.orderItems?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                    <div className="relative w-12 h-12 rounded border border-slate-200 overflow-hidden bg-white">
                                        <Image
                                            src={item.product?.images?.[0] || '/placeholder-product.png'}
                                            alt={item.product?.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">{item.product?.name}</p>
                                        <p className="text-xs text-slate-500">Qty: {item.quantity} × {currency}{item.price}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-800">{currency}{item.price * item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Party Info & Actions */}
                <div className="space-y-6">
                    {/* Buyer & Store Info */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center gap-2">
                                <User size={14} /> Buyer Information
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                    {returnData.order?.user?.image ? (
                                        <Image src={returnData.order.user.image} alt="" width={40} height={40} />
                                    ) : (
                                        <User size={20} className="text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{returnData.order?.user?.name}</p>
                                    <p className="text-xs text-slate-500">{returnData.order?.user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <h3 className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center gap-2">
                                <Store size={14} /> Store Information
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                    {returnData.order?.store?.logo ? (
                                        <Image src={returnData.order.store.logo} alt="" width={40} height={40} />
                                    ) : (
                                        <Store size={20} className="text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{returnData.order?.store?.name}</p>
                                    <Link href={`/admin/stores?search=${returnData.order?.storeId}`} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                                        View Store <ExternalLink size={8} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dispute Info if applicable */}
                    {returnData.status === 'DISPUTED' && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-rose-800 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} /> Dispute Active
                            </h2>
                            <p className="text-sm text-rose-700 mb-4">
                                The seller has rejected or disputed this return request. Admin mediation is required to resolve the deadlock.
                            </p>
                            {returnData.sellerReason && (
                                <div className="bg-white/50 p-3 rounded-lg border border-rose-100 mb-4">
                                    <p className="text-xs font-bold text-rose-800 uppercase mb-1">Seller's Objection</p>
                                    <p className="text-sm text-rose-900 italic">"{returnData.sellerReason}"</p>
                                </div>
                            )}
                            <button
                                onClick={() => setShowMediationModal(true)}
                                className="w-full py-3 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-200"
                            >
                                Mediate Dispute
                            </button>
                        </div>
                    )}

                    {/* Admin Resolution Display */}
                    {returnData.status === 'REFUNDED' && returnData.adminId && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                <CheckCircle size={18} /> Admin Resolved
                            </h2>
                            <p className="text-sm text-emerald-700 mb-3">
                                This dispute was resolved in favor of the <strong>Buyer</strong>.
                            </p>
                            {returnData.arbitrationNotes && (
                                <div className="bg-white/50 p-3 rounded-lg border border-emerald-100">
                                    <p className="text-xs font-bold text-emerald-800 uppercase mb-1">Admin Notes</p>
                                    <p className="text-sm text-emerald-900 italic">"{returnData.arbitrationNotes}"</p>
                                </div>
                            )}
                        </div>
                    )}

                    {returnData.status === 'REJECTED' && returnData.adminId && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <Shield size={18} /> Admin Resolved
                            </h2>
                            <p className="text-sm text-slate-700 mb-3">
                                This dispute was resolved in favor of the <strong>Seller</strong>.
                            </p>
                            {returnData.arbitrationNotes && (
                                <div className="bg-white/50 p-3 rounded-lg border border-slate-200">
                                    <p className="text-xs font-bold text-slate-800 uppercase mb-1">Admin Notes</p>
                                    <p className="text-sm text-slate-900 italic">"{returnData.arbitrationNotes}"</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Address Info */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center gap-2">
                            <MapPin size={14} /> Delivery Address
                        </h3>
                        <p className="text-sm font-bold text-slate-800">{returnData.order?.address?.street}</p>
                        <p className="text-sm text-slate-600">{returnData.order?.address?.city}, {returnData.order?.address?.state} {returnData.order?.address?.zip}</p>
                        <p className="text-sm text-slate-600">{returnData.order?.address?.phone}</p>
                    </div>
                </div>
            </div>

            {/* Mediation Modal */}
            {showMediationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50">
                            <h3 className="text-xl font-black text-rose-800 flex items-center gap-2">
                                <Shield size={22} /> Dispute Mediation
                            </h3>
                            <button onClick={() => setShowMediationModal(false)} className="text-rose-400 hover:text-rose-600 transition">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                                <Info size={20} className="text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    <strong>Warning:</strong> Admin actions are final and trigger immediate financial movement.
                                    Refunding the buyer will pull funds from the escrow lock. Rejecting the return will release
                                    funds to the seller.
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase mb-3 block">Select Resolution</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => setSelectedResolution('REFUND_BUYER')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedResolution === 'REFUND_BUYER' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <p className="font-bold text-slate-800">Full Refund to Buyer</p>
                                        <p className="text-xs text-slate-500 mt-1">Accept the buyer's claim and return {currency}{returnData.refundAmount} to their wallet.</p>
                                    </button>

                                    <button
                                        onClick={() => setSelectedResolution('REJECT_RETURN')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedResolution === 'REJECT_RETURN' ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <p className="font-bold text-slate-800">Reject Return Request</p>
                                        <p className="text-xs text-slate-500 mt-1">Side with the seller and release the payment to their store balance.</p>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Arbitration Notes (Internal/Public)</label>
                                <textarea
                                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-sm"
                                    placeholder="Explain the reasoning behind this decision..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setShowMediationModal(false)}
                                className="flex-1 py-3 px-6 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResolve}
                                disabled={!selectedResolution || resolving}
                                className="flex-[2] py-3 px-6 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {resolving ? 'Processing...' : 'Execute Decision'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
