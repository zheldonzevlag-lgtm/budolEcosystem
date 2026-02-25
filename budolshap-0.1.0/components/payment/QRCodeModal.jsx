'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import BudolPayText from './BudolPayText';

export default function QRCodeModal({ qrCode, paymentIntentId, orderId, paymentMethod, onClose, onSuccess, onTimeout }) {
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [status, setStatus] = useState('pending');
    const [isImageReady, setIsImageReady] = useState(false);

    // Preload QR image before showing modal
    useEffect(() => {
        if (qrCode?.imageUrl) {
            console.log('🖼️ [QRCodeModal] Preloading QR image:', qrCode.imageUrl);
            const img = new Image();
            img.src = qrCode.imageUrl;
            img.onload = () => {
                console.log('✅ [QRCodeModal] QR image loaded and ready');
                setIsImageReady(true);
            };
            img.onerror = (err) => {
                console.error('❌ [QRCodeModal] Failed to load QR image:', err);
                // Even on error, we might want to show the modal so user can see something is wrong
                // or we could keep it hidden. The user said "dont show if not fully generated".
                // But if it's a broken link, it might never load.
                // For now, let's assume if it fails to load, it's not "fully generated".
            };
        }
    }, [qrCode?.imageUrl]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Timeout reached - trigger timeout callback if still pending
                    setStatus((currentStatus) => {
                        if (currentStatus === 'pending' && onTimeout) {
                            onTimeout();
                        }
                        return currentStatus === 'pending' ? 'timeout' : currentStatus;
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onTimeout]);

    // Polling Logic
    useEffect(() => {
        let isMounted = true;
        let pollTimer;

        const checkStatus = async () => {
            try {
                const providerParam = (paymentMethod === 'BUDOL_PAY' || paymentMethod === 'budolPay') ? '&provider=budolpay' : '';
                const response = await fetch(`/api/paymongo/status?intent_id=${paymentIntentId}${providerParam}`);
                if (!response.ok) return;

                const data = await response.json();

                if (isMounted) {
                    if (data.status === 'succeeded' || data.status === 'COMPLETED' || data.status === 'paid') {
                        setStatus('succeeded');
                        if (onSuccess) onSuccess();
                    } else if (data.status === 'failed' || data.status === 'cancelled') {
                        setStatus('failed');
                    }
                }
            } catch (error) {
                console.error('Error polling payment status:', error);
            }
        };

        // Poll every 3 seconds
        pollTimer = setInterval(checkStatus, 3000);

        // Initial check
        checkStatus();

        return () => {
            isMounted = false;
            clearInterval(pollTimer);
        };
    }, [paymentIntentId, onSuccess]);

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

    if (!isImageReady && status === 'pending') {
        return null; // Don't show the modal until the QR image is fully loaded
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 relative animate-fade-in max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Close Button */}
                <button
                    onClick={() => {
                        if (onClose) onClose();
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white rounded-full p-1"
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
                                `Scan QR Code to Pay`}
                    </h2>
                    <p className="text-xs text-gray-600">
                        {status === 'succeeded' ? 'Redirecting...' :
                            status === 'failed' ? 'Please try again' :
                                <>Use your <BudolPayText text={getPaymentMethodName(paymentMethod)} /> app</>}
                    </p>
                </div>

                {/* Content based on status */}
                {status === 'succeeded' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-green-500">
                        <svg className="w-20 h-20 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                ) : status === 'failed' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-red-500">
                        <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                ) : (
                    <>
                        {/* QR Code */}
                        <div className="bg-white p-2 rounded-xl border-2 border-gray-200 mb-4 max-w-[280px] mx-auto">
                            <img
                                src={qrCode.imageUrl}
                                alt="Payment QR Code"
                                className="w-full h-auto object-contain"
                            />
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
                                <span className="text-gray-600"><BudolPayText text="budolShap" /> Owner:</span>
                                <span className="font-semibold text-green-600 truncate ml-2">Jon Galvez</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Order #:</span>
                                <span className="font-semibold text-gray-800 truncate ml-2">
                                    <BudolPayText text={orderId || "N/A"} />
                                </span>
                            </div>
                            <div className="flex justify-between text-sm pt-1">
                                <span className="text-gray-600 mb-0.5">Reference ID:</span>
                                <span className="text-[12px] text-gray-500 break-all leading-tight bg-gray-100 p-1">
                                    {paymentIntentId}
                                </span>
                            </div>
                        </div>

                        {/* Timer */}
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
                        <li>Select "Scan QR" / "Pay via QR"</li>
                        <li>Scan the code above</li>
                    </ol>
                </div>
            </>
        )}

        {/* Footer */}
        {status === 'pending' && (
            <div className="text-center mb-2">
                <button
                    onClick={() => {
                        if (onClose) onClose();
                    }}
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
