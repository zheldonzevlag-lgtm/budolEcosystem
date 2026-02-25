'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Home, ShoppingBag, Clock } from 'lucide-react';
import Loading from '@/components/Loading';
import { useDispatch } from 'react-redux';
import { clearCart, deleteItemFromCart } from '@/lib/features/cart/cartSlice';
import { getUser } from '@/lib/auth-client';
import { playBoxingBell } from '@/lib/soundUtils';
import BudolPayText from '@/components/payment/BudolPayText';

function ReturnContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useDispatch();
    const [status, setStatus] = useState('checking'); // checking | succeeded | failed | error | timeout
    const [intentId, setIntentId] = useState(null);
    const [orderId, setOrderId] = useState(null);
    const [order, setOrder] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [pollCount, setPollCount] = useState(0);
    const [retrying, setRetrying] = useState(false);
    const MAX_POLLS = 30; // 30 polls × 2 seconds = 60 seconds max

    useEffect(() => {
        // PayMongo might return 'payment_intent_id' or 'payment_intent'
        const pi = searchParams.get('payment_intent_id') || searchParams.get('payment_intent');
        const oid = searchParams.get('orderId');
        const provider = searchParams.get('provider');

        if (pi) {
            setIntentId(pi);
            if (oid) setOrderId(oid);
            pollStatus(pi, oid, 0, provider);
        } else {
            // If no intent ID is found, check if we have an orderId to recover
            if (oid) {
                setOrderId(oid);
                fetchOrderDetails(oid);
                setStatus('error');
                setErrorMessage('Payment verification link is incomplete. Please check your order status.');
            } else {
                setStatus('error');
                setErrorMessage('No payment information found. Please contact support if you were charged.');
            }
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
        }
    };

    const pollStatus = async (id, oid, count = 0, provider = null) => {
        if (count >= MAX_POLLS) {
            setStatus('timeout');
            setErrorMessage('Payment verification is taking longer than expected. Please check your orders page.');
            if (oid) fetchOrderDetails(oid);
            return;
        }

        try {
            const providerParam = provider ? `&provider=${provider}` : '';
            const resp = await fetch(`/api/paymongo/status?intent_id=${id}${providerParam}`);

            if (!resp.ok) {
                throw new Error(`API returned ${resp.status}`);
            }

            const data = await resp.json();

            if (data.error) {
                setStatus('error');
                setErrorMessage(data.error);
                return;
            }

            if (data.status === 'succeeded') {
                let latestOrder = null;

                // Payment succeeded, now update the order in our database
                try {
                    const updateResp = await fetch('/api/orders/update-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ intentId: id, status: 'succeeded' })
                    });

                    if (updateResp.ok) {
                        const orderData = await updateResp.json();
                        latestOrder = orderData.order;
                        setOrder(orderData.order);
                        setOrderId(orderData.order?.id);
                    }
                } catch (updateError) {
                    console.error('Error updating order:', updateError);
                    // Still show success even if update fails
                }

                // Update Cart Logic (Remove purchased items only)
                try {
                    const purchasedOrder = latestOrder || order;
                    if (purchasedOrder && purchasedOrder.orderItems) {
                        console.log('🛒 [Payment Return] Removing purchased items from cart:', purchasedOrder.orderItems);
                        
                        // 1. Remove items from local Redux state
                        purchasedOrder.orderItems.forEach(item => {
                            dispatch(deleteItemFromCart({
                                productId: item.productId,
                                variationId: item.variationId
                            }));
                        });

                        // Note: Server-side cart cleanup is handled by createOrder/webhook logic.
                        // We do NOT want to wipe the server cart here, as that would remove unpurchased items.
                        console.log('🛒 [Payment Return] Local cart updated (purchased items removed)');
                    }
                } catch (err) {
                    console.error('🛒 [Payment Return] Failed to update cart:', err);
                }

                setStatus('succeeded');
            } else if (data.status === 'failed' || data.status === 'cancelled') {
                setStatus('failed');
                setErrorMessage('The payment was declined or cancelled.');
                if (oid) fetchOrderDetails(oid);
            } else if (data.status === 'awaiting_payment_method' || data.status === 'awaiting_next_action') {
                // Still waiting for user action
                console.log(`[Payment Return] Status is ${data.status}. Retrying... (${count}/${MAX_POLLS})`);
                setPollCount(count + 1);
                setTimeout(() => pollStatus(id, oid, count + 1, provider), 2000);
            } else {
                // Still processing/pending
                console.log(`[Payment Return] Status is ${data.status}. Retrying... (${count}/${MAX_POLLS})`);
                setPollCount(count + 1);
                setTimeout(() => pollStatus(id, oid, count + 1, provider), 2000);
            }
        } catch (e) {
            console.error('Payment status check error:', e);

            // Retry a few times before giving up
            if (count < 3) {
                setTimeout(() => pollStatus(id, oid, count + 1, provider), 3000);
            } else {
                setStatus('error');
                setErrorMessage('Unable to verify payment status. Please check your orders page or contact support.');
                if (oid) fetchOrderDetails(oid);
            }
        }
    };

    const handleRetryPayment = async () => {
        if (!orderId && !order?.id) {
            router.push('/checkout');
            return;
        }

        setRetrying(true);
        router.push(`/checkout?orderId=${orderId || order.id}&retry=true`);
    };

    if (status === 'checking') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-3">Verifying Payment</h1>
                    <p className="text-slate-600 mb-4">Please wait while we confirm your transaction...</p>
                    <div className="text-sm text-slate-500">
                        This may take a few moments
                    </div>
                    {pollCount > 10 && (
                        <div className="mt-4 text-sm text-amber-600">
                            Still processing... ({Math.round((pollCount * 2) / 60)} min)
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (status === 'succeeded') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="mb-6">
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto animate-bounce" />
                    </div>
                    <h1 className="text-3xl font-bold text-green-600 mb-3">Payment Successful!</h1>
                    <p className="text-slate-600 mb-6">Your payment has been processed successfully.</p>

                    {order && (
                        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-600">Order ID:</span>
                                <span className="font-medium text-slate-800 text-right break-all ml-4"><BudolPayText text={order.id} /></span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="font-medium text-slate-600">Reference ID:</span>
                                <span className="font-mono text[10px] text-slate-800 text-right break-all ml-4"><BudolPayText text={intentId} /></span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-600">Payment Method:</span>
                                <span className="font-medium text-slate-800">
                                    {order.paymentMethod === 'BUDOL_PAY' || order.paymentMethod === 'budolPay' ? (
                                        <BudolPayText text="budolPay" />
                                    ) : (
                                        order.paymentMethod
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-600">Subtotal:</span>
                                <span className="font-medium text-slate-800">
                                    ₱{(order.total - (order.shippingCost || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-600">Shipping Fee:</span>
                                <span className="font-medium text-slate-800">
                                    ₱{(order.shipping?.cost || order.shippingCost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            {order.shipping?.shippingDiscount > 0 && (
                                <div className="flex justify-between mb-1 text-xs">
                                    <span className="text-green-600 ml-4">↳ Seller Subsidy:</span>
                                    <span className="font-medium text-green-600">
                                        -₱{order.shipping.shippingDiscount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            {order.shipping?.voucherAmount > 0 && (
                                <div className="flex justify-between mb-2 text-xs">
                                    <span className="text-blue-600 ml-4">↳ Shipping Voucher:</span>
                                    <span className="font-medium text-blue-600">
                                        -₱{order.shipping.voucherAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between mb-2 pt-2 border-t border-slate-200">
                                <span className="text-slate-900 font-semibold">Total Paid:</span>
                                <span className="font-bold text-slate-900">
                                    ₱{order.total?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Status:</span>
                                <span className="font-medium text-green-600">Paid</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                playBoxingBell();
                                router.push('/orders?tab=TO_SHIP');
                            }}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            View My Orders
                        </button>
                        <button
                            onClick={() => {
                                playBoxingBell();
                                router.push('/');
                            }}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Continue Shopping
                        </button>
                    </div>

                    <div className="mt-6">
                        <p className="text-xl font-bold">
                            <BudolPayText text="budolShap" />
                            <span className="text-slate-800">.</span>
                        </p>
                    </div>

                    <p className="text-xs text-slate-500 mt-4">
                        You will receive an email confirmation shortly.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-rose-100 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="mb-6">
                        <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-600 mb-3">Payment Failed</h1>
                    <p className="text-slate-600 mb-2">Your payment could not be completed.</p>
                    {errorMessage && (
                        <p className="text-sm text-slate-500 mb-6">{errorMessage}</p>
                    )}

                    {order && (
                        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-600">Order ID:</span>
                                <span className="font-medium text-slate-800 text-right break-all ml-4"><BudolPayText text={order.id} /></span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-600">Reference ID:</span>
                                <span className="font-medium text-slate-800 text-right break-all ml-4"><BudolPayText text={intentId} /></span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-600">Subtotal:</span>
                                <span className="font-medium text-slate-800">
                                    ₱{(order.total - (order.shippingCost || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-600">Shipping Fee:</span>
                                <span className="font-medium text-slate-800">
                                    ₱{(order.shipping?.cost || order.shippingCost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            {order.shipping?.shippingDiscount > 0 && (
                                <div className="flex justify-between mb-1 text-xs">
                                    <span className="text-green-600 ml-4">↳ Seller Subsidy:</span>
                                    <span className="font-medium text-green-600">
                                        -₱{order.shipping.shippingDiscount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            {order.shipping?.voucherAmount > 0 && (
                                <div className="flex justify-between mb-2 text-xs">
                                    <span className="text-blue-600 ml-4">↳ Shipping Voucher:</span>
                                    <span className="font-medium text-blue-600">
                                        -₱{order.shipping.voucherAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between mb-2 pt-2 border-t border-slate-200">
                                <span className="text-slate-600">Total Amount:</span>
                                <span className="font-medium text-slate-800">
                                    ₱{order.total?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Status:</span>
                                <span className="font-medium text-red-600">Payment Failed</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-left text-sm text-blue-800">
                                <p className="font-medium mb-1">Common reasons:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Insufficient GCash balance</li>
                                    <li>Payment was cancelled</li>
                                    <li>Transaction timeout</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleRetryPayment}
                            disabled={retrying}
                            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className={`w-5 h-5 ${retrying ? 'animate-spin' : ''}`} />
                            {retrying ? 'Redirecting...' : 'Try Again'}
                        </button>
                        <button
                            onClick={() => router.push('/orders')}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            View Orders
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Return to Home
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-xl font-bold">
                            <BudolPayText text="budolShap" />
                            <span className="text-slate-800">.</span>
                        </p>
                    </div>

                    <p className="text-xs text-slate-500 mt-6">
                        Need help? Contact our support team.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'timeout') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="mb-6">
                        <Clock className="w-20 h-20 text-amber-500 mx-auto" />
                    </div>
                    <h1 className="text-3xl font-bold text-amber-600 mb-3">Verification Timeout</h1>
                    <p className="text-slate-600 mb-6">
                        Payment verification is taking longer than expected. Your payment may still be processing.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-left text-sm text-blue-800">
                                <p className="font-medium mb-1">What to do:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Check your orders page in a few minutes</li>
                                    <li>Check your email for confirmation</li>
                                    <li>Contact support if charged but no order</li>
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
                            Check My Orders
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Retry Verification
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Return to Home
                        </button>
                    </div>

                    <div className="text-right mt-6">
                        <p className="text-2xl font-bold">
                            <BudolPayText text="budolShap" />
                            <span className="text-slate-800">.</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                <div className="mb-6">
                    <AlertCircle className="w-20 h-20 text-gray-500 mx-auto" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-3">Unable to Verify Payment</h1>
                <p className="text-slate-600 mb-2">We encountered an issue verifying your payment.</p>
                {errorMessage && (
                    <p className="text-sm text-slate-500 mb-6">{errorMessage}</p>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-left text-sm text-amber-800">
                            <p className="font-medium mb-1">Don't worry!</p>
                            <p className="text-amber-700">
                                If you were charged, your payment is safe. Check your orders page or contact support for assistance.
                            </p>
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
                    {(orderId || order?.id) && (
                        <button
                            onClick={handleRetryPayment}
                            disabled={retrying}
                            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
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

                <div className="text-right mt-6">
                    <p className="text-2xl font-bold">
                        <BudolPayText text="budolShap" />
                        <span className="text-slate-800">.</span>
                    </p>
                </div>

                <p className="text-xs text-slate-500 mt-6">
                    Need immediate help? Contact support with your transaction details.
                </p>
            </div>
        </div>
    );
}

export default function PaymentReturn() {
    return (
        <Suspense fallback={<Loading />}>
            <ReturnContent />
        </Suspense>
    );
}
