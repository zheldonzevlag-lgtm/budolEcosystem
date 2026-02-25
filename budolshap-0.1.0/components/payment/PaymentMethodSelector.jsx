'use client';

import { useState } from 'react';
import Image from 'next/image';

const PAYMENT_METHODS = [
    {
        id: 'gcash',
        name: 'GCash',
        // In a real app, use local assets. For now using text or reliable CDNs if available, 
        // but for this implementation we will use simple styling or placeholders if assets are missing.
        icon: '/assets/icons/gcash.png',
        color: 'from-blue-600 to-blue-500'
    },
    {
        id: 'paymaya',
        name: 'Maya',
        icon: '/assets/icons/maya.png',
        color: 'from-green-600 to-green-500'
    },
    {
        id: 'grab_pay',
        name: 'GrabPay',
        icon: '/assets/icons/grab.png',
        color: 'from-emerald-500 to-emerald-400'
    },
    {
        id: 'qrph',
        name: 'QRPh',
        description: 'Scan with any PH Bank/Wallet',
        icon: '/assets/icons/qrph.png',
        color: 'from-yellow-600 to-yellow-500'
    }
];

export default function PaymentMethodSelector({ amount, description, billing, user }) {
    const [selectedMethod, setSelectedMethod] = useState('gcash');
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        if (!selectedMethod) return;
        setLoading(true);

        try {
            const response = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount, // Amount in centavos
                    method: selectedMethod,
                    provider: 'paymongo', // Defaulting to PayMongo as per current adaptability
                    description,
                    billing: billing || {
                        name: user?.name || 'Guest',
                        email: user?.email || 'guest@example.com',
                        phone: user?.phone || '09000000000',
                        address: {
                            line1: 'N/A',
                            city: 'Manila',
                            state: 'Metro Manila',
                            postal_code: '1000',
                            country: 'PH'
                        }
                    }
                })
            });

            const data = await response.json();

            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error(data.error || 'Failed to initialize payment');
            }
        } catch (error) {
            console.error('Payment Error:', error);
            alert(error.message || 'An error occurred while processing your payment.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Select Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => (
                    <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`
                            relative cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all duration-200
                            ${selectedMethod === method.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'}
                        `}
                    >
                        {/* Radio Circle */}
                        <div className={`
                            w-5 h-5 rounded-full border flex items-center justify-center shrink-0
                            ${selectedMethod === method.id ? 'border-blue-500' : 'border-gray-400'}
                        `}>
                            {selectedMethod === method.id && (
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                            )}
                        </div>

                        {/* Label */}
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-800 dark:text-gray-100">
                                {method.name}
                            </span>
                            {method.description && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {method.description}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handlePay}
                disabled={loading}
                className={`
                    w-full mt-6 py-4 rounded-xl text-white font-bold text-lg shadow-lg
                    transform transition-all duration-200
                    bg-gradient-to-r ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.color || 'from-blue-600 to-blue-500'}
                    hover:brightness-110 active:scale-[0.98]
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
                    flex items-center justify-center gap-2
                `}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing...</span>
                    </>
                ) : (
                    <span>Pay with {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}</span>
                )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
                Secured by PayMongo. Your payment data is encrypted.
            </p>
        </div>
    );
}
