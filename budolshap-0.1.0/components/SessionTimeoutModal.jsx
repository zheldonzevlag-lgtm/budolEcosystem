import React from 'react';

export default function SessionTimeoutModal({ isOpen, onContinue, onLogout, remainingSeconds }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-100 transform transition-all scale-100 animate-fadeIn">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Expiring</h2>
                    <p className="text-gray-500">
                        Your session will expire in <span className="font-bold text-red-500">{remainingSeconds || '< 60'} seconds</span> due to inactivity.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        Would you like to stay logged in?
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onLogout}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                    >
                        Log Out
                    </button>
                    <button
                        onClick={onContinue}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Stay Logged In
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
