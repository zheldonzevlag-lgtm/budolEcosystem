'use client';

import { useRouter } from 'next/navigation';

export default function PaymentCancel() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full border border-gray-200">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Cancelled</h1>
                <p className="text-gray-600 mb-6">You have cancelled the payment process.</p>
                <button
                    onClick={() => router.push('/')}
                    className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-900 transition-colors shadow-md font-medium"
                >
                    Return to Home
                </button>
            </div>
        </div>
    );
}
