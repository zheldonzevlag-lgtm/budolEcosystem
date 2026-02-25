'use client';

import { useState } from 'react';

export default function GcashPayButton({ amount, description }) {
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        try {
            const resp = await fetch('/api/paymongo/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, description }),
            });
            const data = await resp.json();

            if (data.checkout_url) {
                // Redirect the shopper to GCash (PayMongo checkout)
                window.location.replace(data.checkout_url);
            } else {
                console.error('Payment Error:', data);
                alert(`Payment Error: ${data.error || 'Unable to start payment.'}`);
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            alert('Network Error: Unable to reach payment server.');
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePay}
            disabled={loading}
            className={`
        relative overflow-hidden group
        bg-gradient-to-r from-blue-600 to-blue-500
        hover:from-blue-500 hover:to-blue-400
        text-white font-bold py-3 px-6 rounded-xl shadow-lg
        transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-70 disabled:cursor-not-allowed
        flex items-center justify-center gap-2 w-full sm:w-auto
      `}
        >
            {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </>
            ) : (
                <>
                    <span className="text-lg">Pay with GCash</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </>
            )}
        </button>
    );
}
