'use client';

import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import BudolPayText from './BudolPayText';

/**
 * QRCodeModal – displays the QR payment code and manages the payment lifecycle.
 *
 * WHY onClose/onTimeout are called from here and not from OrderSummary state:
 *   This modal is self-contained. The parent (OrderSummary) passes callbacks
 *   that are closures capturing the gateway identifiers at the TIME the modal
 *   is mounted. This is the safest pattern — no async state-reading needed.
 *
 * WHY we always render (no isImageReady gate):
 *   The old gate caused a critical bug: if the QR image failed to load, the modal
 *   returned null — leaving a PENDING gateway transaction with no way to cancel it.
 *   We now always show the modal (with a spinner while loading) so the user ALWAYS
 *   has a Cancel button available, guaranteeing the cancel flow can be triggered.
 */
export default function QRCodeModal({ qrCode, paymentIntentId, orderId, paymentMethod, onClose, onSuccess, onTimeout }) {
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [status, setStatus] = useState('pending');
    const [isImageReady, setIsImageReady] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Use a ref to track whether onTimeout has already fired — prevents double-firing
    // when both the timeout state update and the interval cleanup race.
    const timeoutFiredRef = useRef(false);

    // -----------------------------------------------------------------------
    // QR Image Preload
    // WHY: We try to preload for a smooth UX but we NO LONGER gate the modal
    //      on this. Modal always shows so the Cancel button is always accessible.
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (qrCode?.imageUrl) {
            const img = new Image();
            img.src = qrCode.imageUrl;
            img.onload = () => {
                console.log('✅ [QRCodeModal] QR image loaded');
                setIsImageReady(true);
            };
            img.onerror = () => {
                console.warn('⚠️ [QRCodeModal] QR image failed to load – showing error state');
                setImageError(true);
                setIsImageReady(true); // Mark ready anyway so spinner stops
            };
        } else {
            setImageError(true);
            setIsImageReady(true);
        }
    }, [qrCode?.imageUrl]);

    // -----------------------------------------------------------------------
    // Countdown Timer
    // WHY: Stores the callback in a ref so the interval does not re-register
    //      every render when onTimeout changes reference.
    // -----------------------------------------------------------------------
    const onTimeoutRef = useRef(onTimeout);
    useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setStatus((currentStatus) => {
                        if (currentStatus === 'pending' && !timeoutFiredRef.current) {
                            timeoutFiredRef.current = true;
                            // Call via ref to always use the latest version of the callback
                            if (onTimeoutRef.current) onTimeoutRef.current();
                        }
                        return currentStatus === 'pending' ? 'timeout' : currentStatus;
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []); // Only runs once on mount

    // -----------------------------------------------------------------------
    // Payment Status Polling
    // WHY: Polls the gateway every 3 seconds to detect when the user scans and
    //      pays in the budolPay app, so the UI can update to "Payment Successful".
    // -----------------------------------------------------------------------
    const onSuccessRef = useRef(onSuccess);
    useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);

    useEffect(() => {
        if (!paymentIntentId) return;

        let isMounted = true;
        const checkStatus = async () => {
            try {
                const providerParam = (paymentMethod === 'BUDOL_PAY' || paymentMethod === 'budolPay') ? '&provider=budolpay' : '';
                const response = await fetch(`/api/paymongo/status?intent_id=${paymentIntentId}${providerParam}`);
                if (!response.ok || !isMounted) return;

                const data = await response.json();
                if (!isMounted) return;

                if (data.status === 'succeeded' || data.status === 'COMPLETED' || data.status === 'paid') {
                    setStatus('succeeded');
                    if (onSuccessRef.current) onSuccessRef.current();
                } else if (data.status === 'failed' || data.status === 'cancelled') {
                    setStatus('failed');
                }
            } catch (error) {
                if (isMounted) console.error('[QRCodeModal] Error polling payment status:', error);
            }
        };

        const pollTimer = setInterval(checkStatus, 3000);
        checkStatus(); // Initial check immediately

        return () => {
            isMounted = false;
            clearInterval(pollTimer);
        };
    }, [paymentIntentId, paymentMethod]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPaymentMethodName = (method) => {
        const names = {
            'MAYA': 'Maya',
            'GRAB_PAY': 'GrabPay',
            'QRPH': 'QRPh / InstaPay',
            'BUDOL_PAY': 'budolPay'
        };
        return names[method] || method;
    };

    // WHY: Modal ALWAYS renders — even while the image is loading.
    // The old code returned null until isImageReady, which meant the Cancel button
    // was invisible and the user had no way to cancel → gateway stayed PENDING forever.
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 relative animate-fade-in max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                {/* Close Button — ALWAYS visible so user can always cancel */}
                <button
                    onClick={() => { if (onClose) onClose(); }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white rounded-full p-1"
                    aria-label="Close payment modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-4 mt-2">
                    <p className="text-2xl font-bold mb-3">
                        <BudolPayText text="budolShap" />
                        <span className="text-green-500 text-4xl">.</span>
                    </p>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">
                        {status === 'succeeded' ? 'Payment Successful!' :
                            status === 'failed' ? 'Payment Failed' :
                                status === 'timeout' ? 'Payment Expired' :
                                    'Scan QR Code to Pay'}
                    </h2>
                    <p className="text-xs text-gray-600">
                        {status === 'succeeded' ? 'Redirecting...' :
                            status === 'failed' ? 'Please try again' :
                                status === 'timeout' ? 'This QR code has expired' :
                                    <><span>Use your </span><BudolPayText text={getPaymentMethodName(paymentMethod)} /><span> app</span></>}
                    </p>
                </div>

                {/* Success State */}
                {status === 'succeeded' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-green-500">
                        <svg className="w-20 h-20 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                /* Failed / Timeout State */
                ) : status === 'failed' || status === 'timeout' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-red-500">
                        <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-500 mt-3">
                            {status === 'timeout' ? 'The payment window has expired.' : 'Payment could not be completed.'}
                        </p>
                    </div>

                /* Pending State — QR Display */
                ) : (
                    <>
                        {/* QR Code or Loading/Error state */}
                        <div className="bg-white p-2 rounded-xl border-2 border-gray-200 mb-4 max-w-[280px] mx-auto min-h-[200px] flex items-center justify-center">
                            {!isImageReady ? (
                                /* Spinner while QR image loads — user can still cancel */
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <div className="w-10 h-10 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
                                    <p className="text-xs">Generating QR code...</p>
                                </div>
                            ) : imageError ? (
                                /* QR image failed — show error but keep Cancel button visible */
                                <div className="flex flex-col items-center gap-2 text-red-400 p-4 text-center">
                                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                                    </svg>
                                    <p className="text-xs text-gray-500">QR code failed to load.<br />Please cancel and try again.</p>
                                </div>
                            ) : (
                                <img
                                    src={qrCode.imageUrl}
                                    alt="Payment QR Code"
                                    className="w-full h-auto object-contain"
                                />
                            )}
                        </div>

                        {/* Payment Details */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Amount:</span>
                                <span className="font-semibold text-gray-800">
                                    ₱{(qrCode.amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Store Name:</span>
                                <span className="font-semibold text-gray-800 truncate ml-2">{qrCode.label}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Order #:</span>
                                <span className="font-semibold text-gray-800 truncate ml-2">
                                    <BudolPayText text={orderId || 'N/A'} />
                                </span>
                            </div>
                            <div className="flex justify-between text-sm pt-1">
                                <span className="text-gray-600 mb-0.5">Reference ID:</span>
                                <span className="text-[12px] text-gray-500 break-all leading-tight bg-gray-100 p-1">
                                    {paymentIntentId}
                                </span>
                            </div>
                        </div>

                        {/* Countdown Timer */}
                        <div className="text-center mb-4">
                            <p className="text-xs text-gray-600 mb-1">Time remaining:</p>
                            <p className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-green-600'}`}>
                                {formatTime(timeLeft)}
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-left">
                            <h3 className="font-semibold text-blue-900 mb-1">How to pay:</h3>
                            <ol className="list-decimal list-inside space-y-0.5 text-blue-800">
                                <li>Open your <BudolPayText text={getPaymentMethodName(paymentMethod)} /> app in your mobile device</li>
                                <li>Select &quot;Scan QR&quot; / &quot;Pay via QR&quot;</li>
                                <li>Scan the code above</li>
                            </ol>
                        </div>
                    </>
                )}

                {/* Cancel Button — only shown while payment is still pending */}
                {status === 'pending' && (
                    <div className="text-center mb-2">
                        <button
                            onClick={() => { if (onClose) onClose(); }}
                            className="text-sm text-blue-600 font-bold hover:text-rose-500 transition-colors"
                        >
                            Cancel Payment
                        </button>
                    </div>
                )}

                {/* Branding */}
                <div className="text-center mt-2 pb-1">
                    <p className="text-xl font-bold mb-3">
                        <BudolPayText text="budolShap" />
                        <span className="text-green-500 text-4xl">.</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
