'use client'
import PageTitle from "@/components/PageTitle"
import Loading from "@/components/Loading"
import { useEffect, useState, Suspense, useRef, useMemo } from "react";
import OrderItem from "@/components/OrderItem";
import { getUser } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
import { useRealtimeBuyerOrders } from "@/hooks/useRealtimeBuyerOrders";
import QRCodeModal from "@/components/payment/QRCodeModal";
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

function OrdersContent() {

    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'ALL';

    const [page, setPage] = useState(1);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [qrData, setQrData] = useState(null);
    const [isRepaying, setIsRepaying] = useState(false);
    const [displayOrders, setDisplayOrders] = useState([]);
    const observerTarget = useRef(null);
    const { user } = useAuth();
    const { searchQuery } = useSearch();

    const handleRepay = async (order) => {
        if (isRepaying) return;
        setIsRepaying(true);
        const toastId = toast.loading("Initializing Payment...");

        try {
            const response = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Math.round(order.total * 100), // Convert to centavos
                    method: order.paymentMethod,
                    billing: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone || '0000000000'
                    },
                    description: `Payment for Order ${order.id}`,
                    orderId: order.id,
                    storeName: order.store?.name || 'budolShap Store'
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Payment initiation failed');

            if (data.qrCode) {
                toast.dismiss(toastId);
                
                // Normalize QR data
                let normalizedQrCode;
                const qrCode = data.qrCode;
                const amountInCentavos = Math.round(order.total * 100);
                const paymentIntentId = data.paymentIntentId || data.id;

                if (typeof qrCode === 'string') {
                    // String format (budolPay internal)
                    normalizedQrCode = {
                        id: paymentIntentId,
                        amount: amountInCentavos,
                        label: order.store?.name || `Order #${order.id}`,
                        imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`
                    };
                } else {
                    // Object format (PayMongo)
                    normalizedQrCode = {
                        id: qrCode.id || paymentIntentId,
                        amount: qrCode.amount || amountInCentavos,
                        label: qrCode.label || order.store?.name || order.paymentMethod,
                        imageUrl: qrCode.imageUrl || qrCode.image_url || qrCode.qr_code_url
                    };
                }

                // Preload image before showing modal
                if (normalizedQrCode.imageUrl) {
                    const img = new Image();
                    img.src = normalizedQrCode.imageUrl;
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve; // Continue even on error
                        setTimeout(resolve, 5000); // Timeout after 5s
                    });
                }

                setQrData({
                    qrCode: normalizedQrCode,
                    paymentIntentId: paymentIntentId,
                    paymentMethod: order.paymentMethod,
                    orderId: order.id
                });
            } else if (data.checkoutUrl) {
                toast.dismiss(toastId);
                toast.loading("Redirecting...");
                window.location.href = data.checkoutUrl;
            }

        } catch (error) {
            console.error("Repayment Error:", error);
            toast.dismiss(toastId);
            toast.error(error.message || "Failed to initiate payment");
        } finally {
            setIsRepaying(false);
        }
    };

    const handleQRSuccess = () => {
        const intentId = qrData?.paymentIntentId;
        const provider = (qrData?.paymentMethod === 'BUDOL_PAY' || qrData?.paymentMethod === 'budolPay') ? 'budolpay' : 'paymongo';
        
        // Find the order that was just paid to get its ID
        // Note: In Orders page, the QR data doesn't explicitly store orderId in the root, 
        // but it's often in the label or we can pass it when setting qrData
        const orderId = qrData?.orderId || qrData?.qrCode?.id; 

        setQrData(null);
        
        // Redirect to unified success screen
        const url = `/payment/return?payment_intent_id=${intentId}${orderId ? `&orderId=${orderId}` : ''}&provider=${provider}`;
        window.location.href = url;
    };

    // Memoize Tab Filters to prevent unnecessary re-renders of the orders hook
    const filters = useMemo(() => {
        switch (activeTab) {
            case 'TO_PAY':
                return { isPaid: 'false', paymentStatus: '', status: 'ORDER_PLACED,PENDING_VERIFICATION' };
            case 'TO_SHIP':
                return { status: 'PAID,PROCESSING' };
            case 'TO_RECEIVE':
                return { status: 'SHIPPED,IN_TRANSIT' };
            case 'COMPLETED':
                return { status: 'DELIVERED' };
            case 'CANCELLED':
                return { isCancelledTab: 'true' };
            case 'RETURN_REFUND':
                return { status: 'RETURN_REQUESTED,RETURN_APPROVED,RETURN_DISPUTED,REFUNDED' };
            default:
                return {};
        }
    }, [activeTab]);

    const { orders, pagination, isLoading } = useRealtimeBuyerOrders({
        userId: user?.id,
        page,
        limit: 10,
        search: searchQuery,
        ...filters
    });

    // Auto-sync Lalamove orders
    useEffect(() => {
        if (!orders || orders.length === 0) return

        // Find active Lalamove orders that need syncing
        const activeLalamoveOrders = orders.filter(order =>
            order.shipping?.provider === 'lalamove' &&
            order.shipping?.bookingId &&
            ['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status)
        )

        if (activeLalamoveOrders.length === 0) return

        console.log(`[Auto-Sync] Found ${activeLalamoveOrders.length} active Lalamove orders. Syncing...`)

        const syncAll = async () => {
            for (const order of activeLalamoveOrders) {
                try {
                    await fetch(`/api/orders/${order.id}/sync-lalamove`, { method: 'POST' })
                } catch (err) {
                    console.error(`Failed to auto-sync order ${order.id}:`, err)
                }
            }
        }

        const interval = setInterval(syncAll, 15000) // Every 15 seconds

        return () => clearInterval(interval)
    }, [orders])

    // Reset pagination when tab changes or search query changes
    useEffect(() => {
        setPage(1);
        setDisplayOrders([]);
    }, [activeTab, searchQuery]);

    useEffect(() => {
        if (!isLoading && orders) {
            // Only update if references are actually different to prevent unnecessary cycles
            if (page === 1) {
                setDisplayOrders(prev => prev !== orders ? orders : prev);
            } else {
                setDisplayOrders(prev => {
                    const existingIds = new Set(prev.map(o => o.id));
                    const newUniqueOrders = orders.filter(o => !existingIds.has(o.id));
                    if (newUniqueOrders.length === 0) return prev;
                    return [...prev, ...newUniqueOrders];
                });
            }
        }
    }, [orders, isLoading, page]);

    // Infinite Scroll Implementation (BudolShap style)
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !isLoading && pagination?.page < pagination?.totalPages) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [isLoading, pagination]);

    const loading = (isLoading && page === 1) || !mounted;

    const tabs = [
        { id: 'ALL', label: 'All' },
        { id: 'TO_PAY', label: 'To Pay' },
        { id: 'TO_SHIP', label: 'To Ship' },
        { id: 'TO_RECEIVE', label: 'To Receive' },
        { id: 'COMPLETED', label: 'Completed' },
        { id: 'CANCELLED', label: 'Cancelled' },
        { id: 'RETURN_REFUND', label: 'Return/Refund' },
    ];

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-[70vh] mx-4 md:mx-6">
            <div className="my-6 md:my-10 max-w-7xl mx-auto">
                <PageTitle heading="My Orders" text={`Manage and track your orders`} linkText={'Go to home'} />

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-4 md:mb-6 overflow-x-auto scrollbar-hide sticky top-0 bg-white z-10 -mx-4 px-4 md:mx-0 md:px-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 md:px-6 py-2 md:py-3 text-[13px] md:text-sm font-medium whitespace-nowrap transition-colors border-b-4 ${activeTab === tab.id
                                ? 'border-green-600 text-green-700 bg-green-50'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {displayOrders.length > 0 ? (
                    <>
                        <table className="w-full text-slate-500 table-auto border-separate border-spacing-y-1 md:border-spacing-y-4">
                            <thead className="hidden md:table-header-group">
                                <tr className="text-slate-600">
                                    <th className="text-left whitespace-nowrap px-4 py-2">Product</th>
                                    <th className="text-left whitespace-nowrap px-4 py-2">Store Name</th>
                                    {/* Total Price column removed as per request */}
                                    <th className="text-left whitespace-nowrap px-4 py-2">Order Status</th>
                                    <th className="text-left whitespace-nowrap px-4 py-2">Payment Status</th>
                                    <th className="text-left whitespace-nowrap px-4 py-2">Delivery Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayOrders.map((order) => (
                                    <OrderItem order={order} key={order.id} onRepay={handleRepay} />
                                ))}
                            </tbody>
                        </table>

                        {/* Infinite Scroll Trigger (Sentinel) */}
                        <div ref={observerTarget} className="h-10 w-full flex items-center justify-center mb-10">
                            {isLoading && page > 1 && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    Loading more...
                                </div>
                            )}
                            {!isLoading && pagination?.page >= pagination?.totalPages && displayOrders.length > 0 && (
                                <div className="text-slate-400 text-[12px] italic">
                                    You've reached the end of your order history
                                </div>
                            )}
                        </div>

                        {/* Desktop: Still show traditional pagination if desired for power users, 
                            but for this BudolShap flow we'll stick to infinite scroll for both or hide it.
                            Let's keep infinite scroll for both as it's modern. */}
                    </>
                ) : !isLoading ? (
                    <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-400">
                        <h2 className="text-xl font-medium mb-2">No orders found</h2>
                        <p className="text-sm">There are no orders in this tab.</p>
                    </div>
                ) : (
                    <div className="min-h-[40vh] flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {qrData && (
                <QRCodeModal
                    qrCode={qrData.qrCode}
                    paymentIntentId={qrData.paymentIntentId}
                    orderId={qrData.orderId}
                    paymentMethod={qrData.paymentMethod}
                    onClose={() => setQrData(null)}
                    onSuccess={handleQRSuccess}
                />
            )}
        </div>
    )
}

export default function Orders() {
    return (
        <Suspense fallback={<Loading />}>
            <OrdersContent />
        </Suspense>
    );
}