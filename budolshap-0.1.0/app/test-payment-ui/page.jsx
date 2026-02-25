'use client';

import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

export default function TestPaymentPage() {
    // Mock Data
    const mockUser = {
        name: 'Test Shopper',
        email: 'shopper@example.com',
        phone: '09171234567'
    };

    const mockBilling = {
        name: 'Test Shopper',
        email: 'shopper@example.com',
        phone: '09171234567',
        address: {
            line1: 'Unit 123 Test Bldg',
            city: 'Makati',
            state: 'Metro Manila',
            postal_code: '1200',
            country: 'PH'
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex items-center justify-center">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
                    Payment UI Test
                </h1>

                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                    <p><strong>Total Amount:</strong> ₱500.00</p>
                    <p><strong>User:</strong> {mockUser.name}</p>
                </div>

                <PaymentMethodSelector
                    amount={50000} // 500.00
                    description="Test Payment for Order #123"
                    user={mockUser}
                    billing={mockBilling}
                />
            </div>
        </div>
    );
}
