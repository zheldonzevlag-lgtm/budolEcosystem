'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { XCircle, AlertCircle, RefreshCw, Home, ShoppingBag } from 'lucide-react';
import BudolPayText from './BudolPayText';
import { useRouter } from 'next/navigation';

export default function PaymentFailedModal({ isOpen, status, errorMessage, orderId, onRetryPayment }) {
    const router = useRouter();

    if (!isOpen) return null;

    const isFailed = status === 'failed';
    const isError = status === 'error';

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <div className="mb-6">
                    {isFailed && <XCircle className="w-20 h-20 text-red-500 mx-auto" />}
                    {isError && <AlertCircle className="w-20 h-20 text-red-500 mx-auto" />}
                </div>
                <h1 className="text-3xl font-bold text-red-600 mb-3">
                    {isFailed ? 'Payment Failed' : 'Payment Error'}
                </h1>
                <p className="text-slate-600 mb-2">
                    {isFailed ? 'Your payment could not be completed.' : 'An unexpected error occurred.'}
                </p>
                {errorMessage && (
                    <p className="text-sm text-slate-500 mb-6">{errorMessage}</p>
                )}

                {isFailed && (
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
                )}

                <div className="space-y-3">
                    {isFailed && (
                        <button
                            onClick={() => onRetryPayment(orderId)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Try Again
                        </button>
                    )}
                    <button
                        onClick={() => router.push('/orders')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Check My Orders
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

                {isError && (
                    <p className="text-xs text-slate-500 mt-6">
                        Need help? Contact our support team.
                    </p>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
