'use client';

import GcashPayButton from '@/components/GcashPayButton';

export default function TestPaymentPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-800">GCash Payment Test</h1>
                <p className="text-gray-600 max-w-md">
                    This is a test page to verify the PayMongo GCash integration without creating an order.
                </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col items-center gap-6">
                <div className="text-center">
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Test Amount</p>
                    <p className="text-4xl font-bold text-gray-900">₱100.00</p>
                </div>

                <GcashPayButton amount={10000} description="Test Payment #001" />

                <p className="text-xs text-gray-400 max-w-xs text-center">
                    Clicking this will redirect you to the PayMongo Sandbox.
                    Use the test credentials provided there.
                </p>
            </div>
        </div>
    );
}
