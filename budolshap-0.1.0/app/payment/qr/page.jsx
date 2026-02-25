'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QRCodeModal from '@/components/payment/QRCodeModal';
import BudolPayText from '@/components/payment/BudolPayText';

function QRPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [qrData, setQrData] = useState(null);

    useEffect(() => {
        // Get QR data from localStorage
        const storedData = localStorage.getItem('qrPaymentData');
        
        // Extract from URL if localStorage is missing
        const piFromUrl = searchParams.get('payment_intent_id') || searchParams.get('reference');
        const orderIdFromUrl = searchParams.get('orderId');
        const amountFromUrl = searchParams.get('amount');
        const providerFromUrl = searchParams.get('provider');
        const storeNameFromUrl = searchParams.get('storeName');

        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                console.log('📱 [QRPaymentPage] Loaded QR Data from Storage:', parsedData.paymentIntentId);
                setQrData(parsedData);
            } catch (error) {
                console.error('Error parsing QR data:', error);
                if (!piFromUrl) {
                    router.push('/orders?tab=TO_PAY');
                }
            }
        } 
        
        // If storage is empty but we have URL data, reconstruct the payment view
        if (!storedData && piFromUrl) {
            console.log('📱 [QRPaymentPage] Recovering state from URL params:', piFromUrl);
            
            const recoveredData = {
                paymentIntentId: piFromUrl,
                orderId: orderIdFromUrl,
                paymentMethod: providerFromUrl === 'budolpay' ? 'budolPay' : 'QRPH', // Default to QRPH if unknown
                amount: amountFromUrl ? parseInt(amountFromUrl) : 0,
                qrCode: {
                    imageUrl: providerFromUrl === 'budolpay' 
                        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify({
                            type: 'budolpay_payment',
                            orderId: orderIdFromUrl,
                            amount: amountFromUrl ? parseInt(amountFromUrl) / 100 : 0,
                            storeName: storeNameFromUrl || 'budolShap Store', // Priority identifier
                            merchant: 'Budol Ecosystem',
                            paymentIntentId: piFromUrl
                          }))}`
                        : null, 
                    amount: amountFromUrl ? parseInt(amountFromUrl) : 0,
                    label: storeNameFromUrl || 'budolShap Store'
                }
            };

            // If PayMongo and no image, we might need to fetch it or redirect
            if (providerFromUrl !== 'budolpay' && !recoveredData.qrCode.imageUrl) {
                console.warn('⚠️ [QRPaymentPage] Missing QR image for PayMongo. Redirecting to return for check.');
                router.push(`/payment/return?payment_intent_id=${piFromUrl}&orderId=${orderIdFromUrl || ''}`);
                return;
            }

            // Preload image if it's budolPay (we generate the URL ourselves)
            if (recoveredData.qrCode.imageUrl) {
                const img = new Image();
                img.src = recoveredData.qrCode.imageUrl;
                img.onload = () => setQrData(recoveredData);
            } else {
                setQrData(recoveredData);
            }
        } else if (!storedData && !piFromUrl) {
            console.warn('⚠️ [QRPaymentPage] No QR data found in localStorage or URL');
            // Don't redirect immediately, show error state
            setQrData({ error: true });
            // router.push('/orders?tab=TO_PAY');
        }
    }, [router, searchParams]);

    if (qrData?.error) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <div className="text-center">
                    <p className="text-red-600 font-bold text-xl">Payment Data Missing</p>
                    <p className="text-gray-600">Could not load <BudolPayText text="budolPay" /> details.</p>
                    <button 
                        onClick={() => router.push('/orders')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go to Orders
                    </button>
                </div>
            </div>
        );
    }

    if (!qrData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Loading <BudolPayText text="budolPay" />...</p>
                </div>
            </div>
        );
    }

    const handleSuccess = async () => {
        console.log('✅ [QRPaymentPage] Payment successful! Redirecting to return page...');
        localStorage.removeItem('qrPaymentData');
        const provider = (qrData?.paymentMethod === 'BUDOL_PAY' || qrData?.paymentMethod === 'budolPay') ? 'budolpay' : 'paymongo';
        router.push(`/payment/return?payment_intent_id=${qrData.paymentIntentId}&orderId=${qrData.orderId}&provider=${provider}`);
    };

    const handleClose = () => {
        console.log('📱 [QRPaymentPage] Payment closed by user');
        localStorage.removeItem('qrPaymentData');
        router.push('/orders?tab=TO_PAY');
    };

    const handleTimeout = () => {
        console.log('📱 [QRPaymentPage] Payment timed out');
        localStorage.removeItem('qrPaymentData');
        router.push('/orders?tab=TO_PAY');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <QRCodeModal
                qrCode={qrData.qrCode}
                paymentIntentId={qrData.paymentIntentId}
                orderId={qrData.orderId}
                paymentMethod={qrData.paymentMethod}
                onClose={handleClose}
                onSuccess={handleSuccess}
                onTimeout={handleTimeout}
            />
        </div>
    );
}

export default function QRPaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Loading payment page...</p>
                </div>
            </div>
        }>
            <QRPaymentContent />
        </Suspense>
    );
}
