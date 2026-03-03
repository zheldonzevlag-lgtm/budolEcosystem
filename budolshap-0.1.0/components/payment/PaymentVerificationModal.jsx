'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import BudolPayText from './BudolPayText';

export default function PaymentVerificationModal({ isOpen, pollCount }) {
    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full transform transition-all scale-100 animate-in zoom-in-95 duration-200">
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
                <div className="mt-6">
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
