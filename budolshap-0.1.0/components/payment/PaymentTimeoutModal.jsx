'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, Home, ShoppingBag, RefreshCw } from 'lucide-react';
import BudolPayText from './BudolPayText';
import { useRouter } from 'next/navigation';

export default function PaymentTimeoutModal({ isOpen, onClose, onRetryVerification, orderId }) {
    const router = useRouter();

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-8 w-8" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Timeout</h2>
                    <p className="text-gray-500">
                        Payment verification is taking longer than expected. Your payment may still be processing.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800 mb-6">
                    <h3 className="font-semibold mb-2">What to do:</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Check your orders page in a few minutes</li>
                        <li>Check your email for confirmation</li>
                        <li>Contact support if charged but no order</li>
                    </ul>
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
                        onClick={() => onRetryVerification(orderId)}
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

                <div className="mt-6 text-center">
                    <p className="text-xl font-bold">
                        <BudolPayText text="budolShap" />
                        <span className="text-slate-800">.</span>
                    </p>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
