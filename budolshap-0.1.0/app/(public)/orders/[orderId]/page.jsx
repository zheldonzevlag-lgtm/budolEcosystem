'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useRealtimeOrderDetail } from '@/hooks/useRealtimeOrderDetail';
import { ArrowLeftIcon, MapIcon, PackageIcon, TruckIcon, ExternalLink, ShieldCheckIcon, MessageSquareIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react';
import Loading from '@/components/Loading';
import OrderHeader from '@/components/OrderHeader';
import OrderProgressTracker from '@/components/OrderProgressTracker';
import TrackingTimeline from '@/components/TrackingTimeline';
import UniversalTrackingMap from '@/components/UniversalTrackingMap';
import OrderItemsList from '@/components/OrderItemsList';
import OrderAddressInfo from '@/components/OrderAddressInfo';
import PaymentProofUpload from '@/components/payment/PaymentProofUpload';
import { useAuth } from '@/context/AuthContext';
import ReturnRequestModal from '@/components/orders/ReturnRequestModal';
import BudolPayText from '@/components/payment/BudolPayText';
import toast from 'react-hot-toast';
import { formatManilaTime } from "@/lib/dateUtils";

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('tracking');
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    const { order, isLoading: orderLoading, error: swrError, mutate } = useRealtimeOrderDetail({
        orderId: params.orderId,
        userId: user?.id
    });

    useEffect(() => {
        if (swrError) {
            setError(swrError.info?.error || swrError.message);
        } else if (order?.error) {
            setError(order.error);
        }
    }, [swrError, order]);

    const loading = authLoading || orderLoading;
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        // Wait for auth to initialize
        if (authLoading) return;

        if (!user) {
            router.push('/');
            return;
        }
    }, [router, user, authLoading]);

    useEffect(() => {
        if (order) {
            setLastRefreshed(new Date());
        }
    }, [order]);

    // Handle unauthorized access
    useEffect(() => {
        if (order && user && order.userId !== user.id) {
            setError('Unauthorized access');
        }
    }, [order, user]);

    // Auto-sync Lalamove status for active orders
    useEffect(() => {
        if (!order || !user) return;

        const activeStatuses = [
            'ORDER_PLACED', 'PAID', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
            // Add Return Statuses to keep polling during return process
            'RETURN_APPROVED', 'RETURN_REQUESTED', 'RETURN_DISPUTED'
        ];
        const isActive = activeStatuses.includes(order.status);

        // Also check if there's an active return specifically (since order status might be RETURN_APPROVED forever until resolved)
        const hasActiveReturn = order.returns?.some(r => ['BOOKED', 'PICKED_UP', 'IN_TRANSIT'].includes(r.status));

        if ((isActive || hasActiveReturn) && (
            (order.shipping?.provider === 'lalamove' && order.shipping?.bookingId && order.shipping.bookingId !== 'PENDING') ||
            (hasActiveReturn && order.returns?.[0]?.returnShipping?.provider === 'lalamove')
        )) {
            const interval = setInterval(async () => {
                try {
                    const syncResponse = await fetch(`/api/orders/${params.orderId}/sync-lalamove`, { method: 'POST' });
                    if (syncResponse.ok) {
                        const syncData = await syncResponse.json();
                        console.log('[Order Page] Lalamove sync result:', syncData);
                        // If status changed, mutate() will be called eventually by polling or the hook
                        // But we can call it manually here to be sure
                        mutate();
                    }
                } catch (err) {
                    console.error('[Order Page] Failed to sync Lalamove:', err);
                }
            }, 30000); // Sync every 30 seconds instead of 10 to be more gentle

            return () => clearInterval(interval);
        }
    }, [order?.status, order?.shipping?.bookingId, params.orderId, user, mutate]);

    // Show loading if either auth is loading or data is loading (unless we have an error)
    if (authLoading || (loading && !error)) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-slate-600 mb-4">{error}</h2>
                    <button
                        onClick={() => router.push('/orders')}
                        className="text-blue-600 hover:underline"
                    >
                        ← Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-slate-600">Order not found</h2>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'tracking', label: 'Tracking History', icon: TruckIcon },
        { id: 'items', label: 'Order Items', icon: PackageIcon },
        { id: 'address', label: 'Delivery Details', icon: MapIcon },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 min-h-[70vh]">
            {/* Top Navigation & Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <button
                    onClick={() => router.push('/orders')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeftIcon size={20} />
                    <span className="font-medium">Back to Orders</span>
                </button>

                {['ORDER_PLACED', 'PAID', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 self-start md:self-auto">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="font-medium">Live Updates Active</span>
                        {lastRefreshed && (
                            <span className="text-slate-500 text-xs border-l border-green-200 pl-2 ml-1">
                                Updated {formatManilaTime(lastRefreshed, { timeStyle: 'short' })}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Order Header */}
            <OrderHeader order={order} />

            {/* Return Instructions Card (budolShap-style) */}
            {order.status === 'RETURN_APPROVED' && order.returns?.[0]?.type === 'RETURN_AND_REFUND' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <TruckIcon size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-blue-800 text-sm">Return Instructions</h4>
                            {order.returns[0].status === 'APPROVED' ? (
                                <p className="text-xs text-blue-600 mt-1">
                                    Your return request has been approved. Please click <strong>"Request Return Pickup"</strong> to notify the seller that you are ready for pickup. The seller will then book the Lalamove courier.
                                </p>
                            ) : order.returns[0].status === 'BOOKING_REQUESTED' ? (
                                <p className="text-xs text-blue-600 mt-1">
                                    Pickup requested! We've notified the seller to book the Lalamove courier. Please wait for the tracking information to appear here.
                                </p>
                            ) : order.returns[0].trackingNumber ? (
                                <div className="mt-2 space-y-2">
                                    <p className="text-xs text-blue-600">
                                        {['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(order.returns[0].status)
                                            ? 'Package picked up by courier!'
                                            : 'Return courier booked!'} Tracking Number: <strong>{order.returns[0].trackingNumber}</strong>
                                    </p>
                                    <p className="text-[10px] text-blue-500 italic">
                                        Please ensure the item is securely packed before the rider arrives.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-blue-600 mt-1">
                                    Your return request is in progress. Please follow the instructions above.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* BudolShap-style Guarantee Banner & Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <ShieldCheckIcon className="text-orange-500" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="whitespace-nowrap"><BudolPayText text="budolShap" /> <span className="text-orange-600"> Guarantee</span></span>
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                                {['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED', 'REFUNDED'].includes(order.status)
                                    ? "Funds are safely held in escrow until the return/refund process is complete."
                                    : order.status === 'DELIVERED'
                                        ? `Funds will be released to the seller in ${order.protectionWindowDays || 7} days unless you request a Return/Refund.`
                                        : `Get the items you ordered or get your money back. Protected by escrow for ${order.protectionWindowDays || 7} days after delivery.`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {order.status === 'DELIVERED' && (
                            <>
                                <button
                                    onClick={() => setShowReturnModal(true)}
                                    disabled={isUpdating}
                                    className="flex-1 md:flex-none px-6 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    Return / Refund
                                </button>
                                <button
                                    onClick={handleOrderReceived}
                                    disabled={isUpdating}
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isUpdating ? 'Updating...' : 'Order Received'}
                                </button>
                            </>
                        )}
                        {['SHIPPED', 'DELIVERED'].includes(order.status) && !order.isGuaranteeExtended && (
                            <div className="relative group flex-1 md:flex-none">
                                <button
                                    onClick={handleExtendGuarantee}
                                    disabled={isUpdating}
                                    className="w-full px-6 py-2.5 bg-orange-50 text-orange-600 border border-orange-200 font-bold text-sm rounded-lg hover:bg-orange-100 transition-all disabled:opacity-50"
                                >
                                    {isUpdating ? 'Extending...' : 'Extend Guarantee'}
                                </button>
                                {/* Custom Tooltip Hint */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-lg p-2 shadow-xl z-30 whitespace-nowrap animate-in fade-in zoom-in duration-200">
                                    Extend <BudolPayText text="budolShap" /> Guarantee by 3 days
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                </div>
                            </div>
                        )}
                        {['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED'].includes(order.status) && (
                            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100 w-full md:w-auto text-center">
                                    Return / Refund in Progress
                                </div>

                                {order.status === 'RETURN_APPROVED' && order.returns?.[0]?.type === 'RETURN_AND_REFUND' && order.returns?.[0]?.status === 'APPROVED' && (
                                    <button
                                        onClick={handleRequestReturnPickup}
                                        disabled={isUpdating}
                                        className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <TruckIcon size={18} />
                                        {isUpdating ? 'Requesting...' : 'Request Return Pickup'}
                                    </button>
                                )}

                                {order.returns?.[0]?.trackingNumber && (
                                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                        <a
                                            href={order.returns[0].returnShipping?.shareLink || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold text-sm rounded-lg hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink size={18} />
                                            Track Return Parcel
                                        </a>
                                        <a
                                            href={`/shipping/waybill/${order.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-white text-slate-700 border border-slate-200 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <PackageIcon size={18} />
                                            Print Waybill
                                        </a>
                                    </div>
                                )}

                                {order.returns?.[0]?.status === 'PENDING' && order.returns?.[0]?.sellerAction === 'OFFER_PARTIAL' && (
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => handleRespondToPartialOffer('ACCEPT')}
                                            disabled={isUpdating}
                                            className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white font-bold text-xs rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                                        >
                                            Accept ₱{order.returns[0].refundAmount}
                                        </button>
                                        <button
                                            onClick={() => handleRespondToPartialOffer('REJECT')}
                                            disabled={isUpdating}
                                            className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-200 font-bold text-xs rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                                        >
                                            Reject Offer
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2
                                ${isActive
                                    ? 'border-green-600 text-green-700 bg-green-50/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }
                            `}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'tracking' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Payment Proof Upload for non-COD unpaid orders or pending verification */}
                        {((!order.isPaid && order.paymentMethod !== 'COD') || order.status === 'PENDING_VERIFICATION') && (
                            <PaymentProofUpload
                                order={order}
                                onUploaded={() => {
                                    // Refresh order data
                                    fetch(`/api/orders/${params.orderId}`)
                                        .then(res => res.json())
                                        .then(data => mutate(data));
                                }}
                            />
                        )}

                        {/* Progress Tracker */}
                        <OrderProgressTracker order={order} />

                        {/* Universal Tracking Map - Handles all providers dynamically */}
                        <UniversalTrackingMap order={order} />

                        {/* Tracking Timeline */}
                        <TrackingTimeline order={order} />
                    </div>
                )}

                {activeTab === 'items' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <OrderItemsList order={order} />
                    </div>
                )}

                {activeTab === 'address' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <OrderAddressInfo order={order} />
                    </div>
                )}
            </div>
            {showReturnModal && (
                <ReturnRequestModal
                    order={order}
                    onClose={() => setShowReturnModal(false)}
                    onSuccess={() => {
                        // Refresh order data
                        fetch(`/api/orders/${params.orderId}`)
                            .then(res => res.json())
                            .then(data => mutate(data));
                    }}
                />
            )}
        </div>
    );

    async function handleOrderReceived() {
        if (!confirm("Confirming you have received your order. This will release payment to the seller. Proceed?")) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/orders/${order.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'COMPLETED' })
            });

            if (response.ok) {
                const data = await response.json();
                mutate(data);
                toast.success("Order marked as completed!");
            } else {
                throw new Error("Failed to update status");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleExtendGuarantee() {
        if (!confirm("Extend budolShap Guarantee by 3 days? This can only be done once.")) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/orders/${order.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'EXTEND_GUARANTEE' })
            });

            if (response.ok) {
                const data = await response.json();
                mutate(data);
                toast.success("Guarantee extended successfully!");
            } else {
                const error = await response.json();
                throw new Error(error.error || "Failed to extend guarantee");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleRequestReturnPickup() {
        if (!confirm("This will notify the seller that you are ready for the item to be picked up. The seller will then book the Lalamove courier. Proceed?")) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/orders/${order.id}/return/request-pickup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    returnId: order.returns[0].id
                })
            });

            if (response.ok) {
                toast.success("Return pickup requested! The seller will book the courier soon.");
                // Refresh order data
                const updatedRes = await fetch(`/api/orders/${order.id}`);
                const updatedData = await updatedRes.json();
                mutate(updatedData);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || "Failed to request return pickup");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleRespondToPartialOffer(action) {
        const message = action === 'ACCEPT'
            ? `Accept the partial refund offer of ₱${order.returns[0].refundAmount}? This will close the return request and refund the amount to you.`
            : "Reject the partial refund offer? This will move the request to dispute/arbitration.";

        if (!confirm(message)) return;

        setIsUpdating(true);
        try {
            // We'll need to implement this endpoint or use an existing one
            const response = await fetch(`/api/orders/${order.id}/return/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    returnId: order.returns[0].id,
                    action: action // 'ACCEPT' or 'REJECT'
                })
            });

            if (response.ok) {
                toast.success(action === 'ACCEPT' ? "Partial refund accepted!" : "Offer rejected.");
                // Refresh order data
                const updatedRes = await fetch(`/api/orders/${order.id}`);
                const updatedData = await updatedRes.json();
                mutate(updatedData);
            } else {
                const error = await response.json();
                throw new Error(error.message || "Failed to respond to offer");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUpdating(false);
        }
    }
}

export const dynamic = 'force-dynamic';
