'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, AlertCircle, RefreshCw, Home, ShoppingBag } from 'lucide-react';
import Loading from '@/components/Loading';
import BudolPayText from '@/components/payment/BudolPayText';

function PendingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [orderId, setOrderId] = useState(null);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        const id = searchParams.get('orderId');
        if (id) {
            setOrderId(id);
            fetchOrderDetails(id);
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    const fetchOrderDetails = async (id) => {
        try {
            const response = await fetch(`/api/orders/${id}`);
            if (response.ok) {
                const data = await response.json();
                setOrder(data);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRetryPayment = async () => {
        if (!orderId) return;

        setRetrying(true);
        try {
            // Redirect back to checkout with the order ID
            router.push(`/checkout?orderId=${orderId}&retry=true`);
        } catch (error) {
            console.error('Error retrying payment:', error);
            setRetrying(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="mb-6">
                    <Clock className="w-20 h-20 text-amber-500 mx-auto animate-pulse" />
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-3">
                    Payment Pending
                </h1>

                <p className="text-slate-600 mb-6">
                    Your payment is being processed. This may take a few moments.
                </p>

                {order && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-600">Order ID:</span>
                            <span className="font-medium text-slate-800"><BudolPayText text={order.id} /></span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-600">Amount:</span>
                            <span className="font-medium text-slate-800">
                                ₱{order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Status:</span>
                            <span className="font-medium text-amber-600">
                                {order.paymentStatus || 'Pending'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-left text-sm text-blue-800">
                            <p className="font-medium mb-1">What's happening?</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-700">
                                <li>Your order has been created</li>
                                <li>Payment is being verified</li>
                                <li>You'll receive an email confirmation</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/orders')}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        View My Orders
                    </button>

                    {orderId && (
                        <button
                            onClick={handleRetryPayment}
                            disabled={retrying}
                            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className={`w-5 h-5 ${retrying ? 'animate-spin' : ''}`} />
                            {retrying ? 'Redirecting...' : 'Retry Payment'}
                        </button>
                    )}

                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Return to Home
                    </button>
                </div>

                <p className="text-xs text-slate-500 mt-6">
                    If payment doesn't complete within 15 minutes, it will be automatically cancelled.
                </p>
            </div>
        </div>
    );
}

export default function PaymentPending() {
    return (
        <Suspense fallback={<Loading />}>
            <PendingContent />
        </Suspense>
    );
}
