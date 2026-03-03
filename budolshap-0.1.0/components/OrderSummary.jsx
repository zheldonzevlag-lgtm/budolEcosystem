import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react'
import BudolPayText from './payment/BudolPayText';

import AddressModal from './AddressModal';
import QRCodeModal from './payment/QRCodeModal';
import Loading from './Loading';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { getUser, getToken, setAuth } from '@/lib/auth-client';
import { useAuth } from '@/context/AuthContext';
import { clearCart, deleteItemFromCart } from '@/lib/features/cart/cartSlice';
import { setAddresses } from '@/lib/features/address/addressSlice';
import LalamoveWidget from './LalamoveWidget';
import { playBoxingBell } from '@/lib/soundUtils';
import { validateTransactionLimit } from '@/lib/compliance';


const OrderSummary = ({ totalPrice, items, hasOutOfStock = false, onProcessing }) => {
    const { user: authUser, isAuthenticated } = useAuth();
    const uniqueStoreIds = items ? [...new Set(items.map(item => item.storeId).filter(Boolean))] : [];
    const isMultiStore = uniqueStoreIds.length > 1;
    const currentStoreId = uniqueStoreIds[0];

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const router = useRouter();
    const dispatch = useDispatch();

    const addressList = useSelector(state => state.address.list) || [];

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [isShippingCalculating, setIsShippingCalculating] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [qrData, setQrData] = useState(null);

    const [hasInitializedAddress, setHasInitializedAddress] = useState(false);
    const [shippingMethod, setShippingMethod] = useState('STANDARD');
    const [lalamoveQuote, setLalamoveQuote] = useState(null);

    const hasItems = items && items.length > 0;
    const isLalamoveSelected = shippingMethod === 'LALAMOVE';
    const isLalamoveReady = !isLalamoveSelected || (lalamoveQuote && !isShippingCalculating);
    const hasLalamoveError = isLalamoveSelected && !lalamoveQuote && !isShippingCalculating;
    
    const isPlaceOrderDisabled = 
        !hasItems || 
        hasOutOfStock || 
        isPlacingOrder || 
        isShippingCalculating || 
        !paymentMethod || 
        !shippingMethod || 
        !selectedAddress ||
        hasLalamoveError ||
        (isLalamoveSelected && (isMultiStore || !lalamoveQuote));

    const fetchAddresses = useCallback(async () => {
        const user = getUser();
        if (!user) {
            dispatch(setAddresses([]));
            return;
        }

        setIsLoadingAddresses(true);
        try {
            const token = getToken();
            const response = await fetch(`/api/addresses?userId=${user.id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch addresses");
            }

            dispatch(setAddresses(Array.isArray(data) ? data : []));
        } catch (error) {
            console.error("Error fetching addresses:", error);
            toast.error(error.message || "Failed to load addresses");
            dispatch(setAddresses([]));
        } finally {
            setIsLoadingAddresses(false);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    useEffect(() => {
        if (!hasInitializedAddress && addressList.length > 0) {
            setSelectedAddress(addressList[0]);
            setHasInitializedAddress(true);
        }
    }, [addressList, hasInitializedAddress]);

    const formatAddress = (address) => {
        if (!address) return ''
        return [
            address.houseNumber,
            address.street,
            address.barangay,
            address.city,
            address.district || address.state,
            address.zip,
            address.country
        ].filter(Boolean).join(', ')
    }

    const handleAddressSelect = (event) => {
        const { value } = event.target;
        if (value === '') {
            setSelectedAddress(null);
            return;
        }

        const selected = addressList[Number(value)];
        if (selected) {
            setSelectedAddress(selected);
            setHasInitializedAddress(true);
        }
    };

    const handleCouponCode = async (event) => {
        event.preventDefault();

        if (!couponCodeInput.trim()) {
            toast.error("Please enter a coupon code");
            return;
        }

        try {
            const user = getUser();
            const token = getToken();
            if (!user) {
                toast.error("Please login first");
                router.push('/login?redirect=/cart');
                return;
            }

            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    code: couponCodeInput.trim(),
                    userId: user.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                setCoupon(data);
                toast.success("Coupon applied successfully!");
                setCouponCodeInput('');
            } else {
                toast.error(data.error || "Invalid coupon code");
            }
        } catch (error) {
            console.error("Error validating coupon:", error);
            toast.error("Failed to validate coupon");
        }
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (isPlacingOrder) return;
        if (isShippingCalculating) {
            toast.error("Please wait for shipping calculation to complete");
            return;
        }

        const user = authUser || getUser();
        console.log('🚀 [OrderSummary] handlePlaceOrder started. User:', user?.email, 'AuthUser:', authUser?.email);

        if (!user) {
            console.warn('⚠️ [OrderSummary] No user found. Redirecting to login.');
            toast.error("Please login first");
            router.push('/login?redirect=/cart');
            return;
        }

        if (!selectedAddress) {
            toast.error("Please select or add a delivery address");
            return;
        }

        if (items.length === 0) {
            toast.error("Your cart is empty");
            return;
        }

        // Check if any items are out of stock
        if (hasOutOfStock) {
            toast.error("Some items in your cart are out of stock. Please remove them before placing an order.");
            return;
        }

        setIsPlacingOrder(true);
        if (onProcessing) onProcessing(true);

        const token = getToken();

        try {
            
            // --- KYC COMPLIANCE CHECK (Phase 4) ---
            const kycResponse = await fetch('/api/user/kyc', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const kycData = await kycResponse.json();
            const kycStatus = kycData.kycStatus || 'UNVERIFIED';

            const subtotal = coupon
                ? (totalPrice - (coupon.discount / 100 * totalPrice))
                : totalPrice;
            const shippingCost = shippingMethod === 'LALAMOVE' && lalamoveQuote ? Number(lalamoveQuote.price.amount) : 0;
            const finalAmount = subtotal + shippingCost;

            const limitCheck = validateTransactionLimit(kycStatus, finalAmount);
            if (!limitCheck.allowed) {
                toast.error(limitCheck.reason);
                setIsPlacingOrder(false);
                if (onProcessing) onProcessing(false);
                // Redirect to profile if unverified to encourage KYC
                if (kycStatus === 'UNVERIFIED') {
                    setTimeout(() => router.push('/profile'), 2000);
                }
                return;
            }

            // Prepare order items
            // If Same Day Delivery (LALAMOVE) is selected, double-check that only one store's items are included
            if (shippingMethod === 'LALAMOVE' && isMultiStore) {
                toast.error("Same Day Delivery is not available for items from multiple stores.");
                setIsPlacingOrder(false);
                if (onProcessing) onProcessing(false);
                return;
            }

            const orderItems = items.map(item => ({
                productId: item.productId || item.id,
                variationId: item.variationId || null,
                quantity: item.quantity
            }));

            console.log('📦 [OrderSummary] Creating order via API...');
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    userId: user.id,
                    addressId: selectedAddress.id,
                    orderItems: orderItems,
                    paymentMethod: paymentMethod,
                    isCouponUsed: !!coupon,
                    coupon: coupon || {},
                    shippingCost: shippingCost,
                    shipping: shippingMethod === 'LALAMOVE' && lalamoveQuote ? {
                        provider: 'lalamove',
                        cost: shippingCost,
                        quotationId: lalamoveQuote.quoteId, 
                        quoteId: lalamoveQuote.quoteId,
                        serviceType: lalamoveQuote.serviceType,
                        eta: lalamoveQuote.eta,
                        stops: lalamoveQuote.stops
                    } : (shippingMethod === 'BUD_EXPRESS' ? {
                        provider: 'bud_express'
                    } : {
                        provider: 'standard'
                    })
                })
            });

            console.log('📦 [OrderSummary] /api/orders status:', response.status);
            const data = await response.json();

            if (!response.ok) {
                console.error('❌ [OrderSummary] Order creation failed:', data);
                if (response.status === 401) {
                    toast.error("Your session has expired. Please login again.");
                    router.push('/login?redirect=/cart');
                    return;
                }
                throw new Error(data.error || "Failed to create order");
            }

            // Get the first order ID
            let orderId, orderIds, checkoutId;

            // Handle new response structure { orders: [...], checkoutId: ... }
            if (data.checkoutId && data.orders) {
                checkoutId = data.checkoutId;
                const orders = Array.isArray(data.orders) ? data.orders : [data.orders];
                orderId = orders[0]?.id;
                orderIds = orders.map(o => o.id);
            } else {
                // Handle legacy response structure (array or single object)
                orderId = Array.isArray(data) ? data[0]?.id : data.id;
                orderIds = Array.isArray(data) ? data.map(o => o.id) : [data.id];
            }

            console.log('📦 [OrderSummary] Order created successfully. ID:', orderId);
            if (checkoutId) {
                console.log('📦 [OrderSummary] Master Checkout ID:', checkoutId);
            }
            if (orderIds.length > 1) {
                console.log('📦 [OrderSummary] Multi-store order detected. IDs:', orderIds);
            }

            if (!orderId) {
                console.error("Order ID extraction failed:", data);
                throw new Error("Order ID not found in response");
            }

            // Save Order ID for mock gateway webhooks
            if (typeof window !== 'undefined') {
                localStorage.setItem('lastOrderId', orderId);
            }

            // We use the already calculated subtotal and finalAmount from above (lines 207-211)
            // Use Math.round to convert to centavos for precision in payment processing
            const amountInCentavos = Math.round(Number(finalAmount).toFixed(2) * 100);

            // --- IMMEDIATE CART CLEARANCE STRATEGY ---
            // For ALL payment methods, we update the local cart immediately upon successful order creation.
            // The server cart is handled by the createOrder backend logic.
            // This prevents duplicate orders and ensures the cart is clean for the next transaction.
            
            if (response.ok) {
                console.log('🛒 [OrderSummary] Order created successfully. Updating local cart.');
                
                // 1. Sync session before potentially redirecting
                if (typeof window !== 'undefined' && token && user) {
                    setAuth(token, user);
                }

                // 2. Update Local Cart (Remove purchased items only)
                // For non-async (COD/Direct) payments, clear immediately.
                // For async (GCash/Maya/Card), we wait for successful payment (webhook)
                // to avoid losing the cart if the payment fails/cancels.
                const isAsyncPayment = ['GCASH', 'MAYA', 'PAYMAYA', 'GRAB_PAY', 'QRPH', 'CARD', 'BUDOL_PAY', 'budolPay'].includes(paymentMethod.toUpperCase());
                
                if (!isAsyncPayment && orderItems && orderItems.length > 0) {
                    orderItems.forEach(item => {
                        dispatch(deleteItemFromCart({
                            productId: item.productId,
                            variationId: item.variationId
                        }));
                    });
                    console.log('🛒 [OrderSummary] Local cart updated (purchased items removed for COD).');
                } else if (isAsyncPayment) {
                    console.log('🛒 [OrderSummary] Async payment: Keeping items in cart until success or failure.');
                }
            }

            // --- PAYMENT AGNOSTIC FLOW ---

            // 1. Immediate Success Handlers (COD, etc)
            if (['COD'].includes(paymentMethod)) {
                console.log(`🚚 [OrderSummary] ${paymentMethod} success. Redirecting.`);
                playBoxingBell();
                toast.success("Order placed successfully!");
                if (onProcessing) onProcessing(false);
                router.push('/orders');
                setIsPlacingOrder(false);
                return;
            }

            // 2. Asynchronous Payment Handlers (GCash, Maya, GrabPay, QRPh, BudolPay)
            console.log('💰 [OrderSummary] Initiating payment for method:', paymentMethod);
            const normalizedMethod = paymentMethod.toUpperCase();
            const provider = normalizedMethod === 'BUDOL_PAY' ? 'budolpay' : 'paymongo';
            
            let apiMethod = normalizedMethod.toLowerCase();
            if (normalizedMethod === 'MAYA') apiMethod = 'paymaya';
            else if (normalizedMethod === 'GRAB_PAY') apiMethod = 'grab_pay';
            else if (normalizedMethod === 'QRPH') apiMethod = 'qrph';
            else if (normalizedMethod === 'BUDOL_PAY') apiMethod = 'budolpay';

            const storeNames = items ? [...new Set(items.map(item => item.store?.name || item.storeName || 'budolShap Store').filter(Boolean))] : [];
            const displayStoreName = storeNames.length > 1 ? `${storeNames[0]} +${storeNames.length - 1}` : (storeNames[0] || 'budolShap Store');

            const paymentResponse = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    amount: amountInCentavos,
                    orderId: orderId,
                    orderIds: orderIds, // Pass ALL order IDs to payment gateway
                    checkoutId: checkoutId, // Pass Master Checkout ID
                    method: apiMethod,
                    provider: provider,
                    description: `Order #${orderId} - ${normalizedMethod === 'BUDOL_PAY' ? 'budolPay' : normalizedMethod}`,
                    storeName: displayStoreName,
                    billing: {
                        name: user.name,
                        email: user.email,
                        phone: selectedAddress.phone || '09000000000',
                        address: {
                            line1: selectedAddress.street,
                            line2: selectedAddress.state,
                            city: selectedAddress.city,
                            state: selectedAddress.state,
                            postal_code: selectedAddress.zip,
                            country: 'PH'
                        }
                    }
                })
            });

            console.log('💰 [OrderSummary] /api/payment/checkout status:', paymentResponse.status);
            
            let paymentData;
            const contentType = paymentResponse.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                paymentData = await paymentResponse.json();
            } else {
                const text = await paymentResponse.text();
                console.error("❌ [OrderSummary] Received non-JSON response from checkout:", text.slice(0, 200));
                throw new Error("Received invalid response from payment server.");
            }

            if (!paymentResponse.ok) {
                console.error('❌ [OrderSummary] Payment initiation failed:', paymentData);
                if (paymentResponse.status === 401) {
                    toast.error("Your session has expired. Please login again.");
                    router.push('/login?redirect=/cart');
                    return;
                }
                const errorMsg = paymentData?.error || "Failed to initiate payment";
                throw new Error(errorMsg);
            }

            if (!paymentResponse.ok) {
                const errorMsg = paymentData?.error || "Failed to initiate payment";
                throw new Error(errorMsg);
            }

            console.log('💰 [OrderSummary] Payment Initiated - Full Response:', JSON.stringify(paymentData, null, 2));
            console.log('💰 [OrderSummary] Payment Method:', paymentMethod);
            console.log('💰 [OrderSummary] Has qrCode?', !!paymentData.qrCode);
            console.log('💰 [OrderSummary] Has checkoutUrl?', !!paymentData.checkoutUrl);
            console.log('💰 [OrderSummary] Payment Data Keys:', Object.keys(paymentData));

            if (paymentData.qrCode) {
                console.log('💰 [OrderSummary] QR Code structure:', {
                    hasImageUrl: !!paymentData.qrCode.imageUrl,
                    hasId: !!paymentData.qrCode.id,
                    hasAmount: !!paymentData.qrCode.amount,
                    hasLabel: !!paymentData.qrCode.label,
                    fullQrCode: paymentData.qrCode
                });
            }

            // 3. Handle Payment Response Strategy
            // Extract QR code or Checkout URL
            const qrCode = paymentData.qrCode || paymentData.data?.qrCode || paymentData.response?.qrCode;
            
            // Extract Payment Intent ID (handle various formats from different providers)
            const paymentIntentId = paymentData.paymentIntentId || 
                                  paymentData.id || 
                                  paymentData.reference || 
                                  paymentData.data?.id ||
                                  paymentData.data?.paymentIntentId;

            if (qrCode) {
                // STRATEGY: QR DISPLAY (Maya, GrabPay, QRPH, BudolPay)
                console.log('📱 [OrderSummary] QR Strategy detected:', qrCode);

                // Normalize QR code structure
                let normalizedQrCode;
                
                if (typeof qrCode === 'string') {
                    // String format (budolPay internal)
                    normalizedQrCode = {
                        id: paymentIntentId,
                        amount: amountInCentavos,
                        label: displayStoreName || `Order #${orderId}`,
                        imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`
                    };
                } else {
                    // Object format (PayMongo)
                    normalizedQrCode = {
                        id: qrCode.id || paymentIntentId,
                        amount: qrCode.amount || paymentData.amount || amountInCentavos,
                        label: qrCode.label || displayStoreName || paymentMethod,
                        imageUrl: qrCode.imageUrl || qrCode.image_url || qrCode.qr_code_url
                    };
                }
                
                if (!normalizedQrCode.imageUrl) {
                    console.error('❌ [OrderSummary] QR Code missing image URL:', qrCode);
                    throw new Error("QR code generation failed. Please try again.");
                }

                if (!paymentIntentId) {
                    console.error('❌ [OrderSummary] Payment Intent ID missing for QR flow.');
                    throw new Error("Payment Intent ID missing. Please try again.");
                }

                // Preload QR image before showing modal to avoid flicker
                if (normalizedQrCode.imageUrl) {
                    console.log('🖼️ [OrderSummary] Preloading QR image:', normalizedQrCode.imageUrl);
                    try {
                        await new Promise((resolve, reject) => {
                            const img = new Image();
                            img.src = normalizedQrCode.imageUrl;
                            img.onload = resolve;
                            img.onerror = () => {
                                console.warn('⚠️ [OrderSummary] QR image failed to preload, proceeding anyway');
                                resolve(); // Resolve anyway so we don't block the modal if preloading fails
                            };
                            // Timeout after 10 seconds
                            setTimeout(() => resolve(), 10000);
                        });
                        console.log('✅ [OrderSummary] QR image preloaded');
                    } catch (e) {
                        console.error('❌ [OrderSummary] Image preload error:', e);
                    }
                }

                // Prepare data for the modal
                const qrData = {
                    qrCode: normalizedQrCode,
                    paymentIntentId: paymentIntentId,
                    paymentMethod: paymentMethod,
                    orderId: orderId,
                    amount: amountInCentavos
                };

                console.log('📱 [OrderSummary] Opening modal:', paymentIntentId);
                
                setQrData(qrData);
                setIsPlacingOrder(false);
                return;

            } else if (paymentData.checkoutUrl || paymentData.data?.checkoutUrl) {
                // STRATEGY: REDIRECT (GCash)
                const checkoutUrl = paymentData.checkoutUrl || paymentData.data?.checkoutUrl;
                console.log('🔗 [OrderSummary] Redirect Strategy:', checkoutUrl);
                window.location.replace(checkoutUrl);
                return;

            } else {
                // UNKNOWN STRATEGY
                // For QRPH specifically, if no qrCode is returned, show an error but don't redirect
                if (paymentMethod === 'QRPH') {
                    console.error('❌ [OrderSummary] QRPH payment did not return QR code. Full response:', JSON.stringify(paymentData, null, 2));
                    console.error('❌ [OrderSummary] Payment API Response Status:', paymentResponse.status);
                    console.error('❌ [OrderSummary] Payment API Response Headers:', Object.fromEntries(paymentResponse.headers.entries()));

                    // ROLLBACK: Cancel order
                    if (orderId) {
                        fetch(`/api/orders/${orderId}/cancel`, { 
                            method: 'POST',
                            headers: {
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            }
                        }).catch(e => console.error('Failed to rollback order:', e));
                    }

                    // Show error but keep user on cart page so they can try again
                    toast.error("QRPH payment failed to generate QR code. Please try again or contact support.");
                    setIsPlacingOrder(false);
                    return; // Don't throw, just return to keep user on page
                }
                console.error('❌ [OrderSummary] No valid payment strategy returned. Full response:', JSON.stringify(paymentData, null, 2));
                
                // ROLLBACK: Cancel order
                if (orderId) {
                    fetch(`/api/orders/${orderId}/cancel`, { 
                        method: 'POST',
                        headers: {
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        }
                    }).catch(e => console.error('Failed to rollback order:', e));
                }

                toast.error("Payment provider did not return a valid payment option. Please try again.");
                setIsPlacingOrder(false);
                return; // Don't throw, just return to keep user on page
            }

        } catch (error) {
            console.error("💥 [OrderSummary] Error placing order:", error);
            console.error("💥 [OrderSummary] Error stack:", error.stack);

            // ROLLBACK: If order was created but payment failed, cancel it
            if (typeof window !== 'undefined') {
                const lastOrderId = localStorage.getItem('lastOrderId');
                if (lastOrderId) {
                    console.log('🔄 [OrderSummary] Payment failed. Rolling back order:', lastOrderId);
                    fetch(`/api/orders/${lastOrderId}/cancel`, { 
                        method: 'POST',
                        headers: {
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        }
                    }).catch(e => console.error('Failed to rollback order:', e));
                    localStorage.removeItem('lastOrderId');
                }
            }

            // For QRPH, show error but don't redirect - let user try again
            if (paymentMethod === 'QRPH') {
                toast.error(error.message || "Failed to initiate QRPH payment. Please try again.");
            } else {
                toast.error(error.message || "Failed to place order");
            }

            setIsPlacingOrder(false);
            if (onProcessing) onProcessing(false);
            // Don't redirect on error - let user stay on cart page to retry
        }
    }

    const handleQRSuccess = () => {
        const orderId = qrData?.orderId;
        const intentId = qrData?.paymentIntentId;
        const provider = (qrData?.paymentMethod === 'BUDOL_PAY' || qrData?.paymentMethod === 'budolPay') ? 'budolpay' : 'paymongo';
        
        setQrData(null);
        if (onProcessing) onProcessing(false);
        dispatch(clearCart());
        
        // Redirect to the unified return page to show the "Payment Successful" UI
        router.push(`/payment/return?payment_intent_id=${intentId}&orderId=${orderId}&provider=${provider}`);
    };

    const handleQRCancel = async (orderId) => {
        if (!orderId) return;
        
        try {
            const token = getToken();
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            
            if (response.ok) {
                console.log('✅ [OrderSummary] Order cancelled successfully');
                toast.success("Payment cancelled. Your cart items have been restored.");
            } else {
                console.error('❌ [OrderSummary] Failed to cancel order');
            }
        } catch (error) {
            console.error('❌ [OrderSummary] Error cancelling order:', error);
        } finally {
            setQrData(null);
            if (onProcessing) onProcessing(false);
        }
    };

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            {qrData && (
                <QRCodeModal
                    qrCode={qrData.qrCode}
                    paymentIntentId={qrData.paymentIntentId}
                    orderId={qrData.orderId}
                    paymentMethod={qrData.paymentMethod}
                    onClose={() => handleQRCancel(qrData.orderId)}
                    onSuccess={handleQRSuccess}
                    onTimeout={() => handleQRCancel(qrData.orderId)}
                />
            )}
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>
            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <div className={`grid grid-cols-2 gap-x-6 gap-y-2 ${!hasItems ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Left Column */}
                <div className="flex flex-col gap-3">
                    <div className='flex gap-2 items-center'>
                        <input type="radio" id="COD" name='payment' onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                        <label htmlFor="COD" className='cursor-pointer text-slate-700 font-medium'>COD</label>
                    </div>
                    <div className='flex gap-2 items-center'>
                        <input type="radio" id="BUDOL_PAY" name='payment' onChange={() => setPaymentMethod('BUDOL_PAY')} checked={paymentMethod === 'BUDOL_PAY'} className='accent-gray-500' />
                        <label htmlFor="BUDOL_PAY" className='cursor-pointer text-slate-700 font-bold'><BudolPayText text="budolPay" /></label>
                    </div>
                    <div className='flex gap-2 items-center'>
                        <input type="radio" id="GCASH" name='payment' onChange={() => setPaymentMethod('GCASH')} checked={paymentMethod === 'GCASH'} className='accent-gray-500' />
                        <label htmlFor="GCASH" className='cursor-pointer flex items-center gap-2'>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/GCash_logo.svg/100px-GCash_logo.svg.png" alt="GCash" className="h-4 w-16 rounded-full object-contain" />
                        </label>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-3">
                    <div className='flex gap-2 items-center'>
                        <input type="radio" id="MAYA" name='payment' onChange={() => setPaymentMethod('MAYA')} checked={paymentMethod === 'MAYA'} className='accent-gray-500' />
                        <label htmlFor="MAYA" className='cursor-pointer flex items-center gap-2'>
                            <span className="font-bold text-green-600">Maya</span>
                        </label>
                    </div>
                    <div className='flex gap-2 items-center'>
                        <input type="radio" id="GRAB_PAY" name='payment' onChange={() => setPaymentMethod('GRAB_PAY')} checked={paymentMethod === 'GRAB_PAY'} className='accent-gray-500' />
                        <label htmlFor="GRAB_PAY" className='cursor-pointer flex items-center gap-2'>
                            <span className="font-bold text-emerald-500">GrabPay</span>
                        </label>
                    </div>
                    <div className='flex gap-2 items-center'>
                        <input type="radio" id="QRPH" name='payment' onChange={() => setPaymentMethod('QRPH')} checked={paymentMethod === 'QRPH'} className='accent-gray-500' />
                        <label htmlFor="QRPH" className='cursor-pointer flex items-center gap-2'>
                            <span className="font-bold text-yellow-600">QRPh</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-center'>
                            <p>{formatAddress(selectedAddress)}</p>
                            <SquarePenIcon
                                onClick={() => setSelectedAddress(null)}
                                className='cursor-pointer text-blue-600 hover:text-blue-800 hover:scale-110 transition-all'
                                size={35}
                            />
                        </div>
                    ) : (
                        <div>
                            {
                                addressList.length > 0 ? (
                                    <select
                                        defaultValue=""
                                        className='border border-slate-400 p-2 w-full my-3 outline-none rounded'
                                        onChange={handleAddressSelect}
                                        disabled={isLoadingAddresses}
                                    >
                                        <option value="">Select Address</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={address.id || index} value={index}>{formatAddress(address)}</option>
                                            ))
                                        }
                                    </select>
                                ) : (
                                    !isLoadingAddresses && <p className='text-xs text-slate-400 my-3'>You have no saved addresses yet.</p>
                                )
                            }
                            {isLoadingAddresses && <p className='text-xs text-slate-400 my-3'>Loading addresses...</p>}
                            <button className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => setShowAddressModal(true)} >Add Address <PlusIcon size={18} /></button>
                        </div>
                    )
                }
            </div>

            <div className='pb-4 border-b border-slate-200 mb-4'>
                <p className='text-slate-400 text-xs mb-3'>Shipping Method</p>
                <div className={`flex flex-col gap-2 ${!hasItems ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === 'STANDARD' ? 'border-slate-600 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === 'STANDARD'}
                            onChange={() => setShippingMethod('STANDARD')}
                            className="accent-slate-600"
                        />
                        <div className="flex-1 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700">Standard Delivery</span>
                            <span className="text-xs font-bold text-green-600">Free</span>
                        </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === 'BUD_EXPRESS' ? 'border-slate-600 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === 'BUD_EXPRESS'}
                            onChange={() => setShippingMethod('BUD_EXPRESS')}
                            className="accent-slate-600"
                        />
                        <div className="flex-1 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 text-indigo-600"><BudolPayText text="budolExpress" /></span>
                            <span className="text-xs font-bold text-green-600">Free</span>
                        </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === 'LALAMOVE' ? 'border-slate-600 bg-slate-50' : 'border-slate-200 hover:border-slate-300'} ${isMultiStore ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === 'LALAMOVE'}
                            onChange={() => !isMultiStore && setShippingMethod('LALAMOVE')}
                            className="accent-slate-600"
                            disabled={isMultiStore}
                        />
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-700">Same Day Delivery</span>
                                {shippingMethod !== 'LALAMOVE' && <span className="text-xs text-slate-400">via <span className="text-orange-600 font-bold">Lalamove</span></span>}
                            </div>
                            {isMultiStore && <p className="text-xs text-red-500 mt-1">Not available for multi-store orders</p>}
                        </div>
                    </label>

                    <LalamoveWidget
                        isSelected={shippingMethod === 'LALAMOVE'}
                        deliveryAddress={selectedAddress}
                        items={items}
                        storeId={currentStoreId}
                        onQuoteReceived={setLalamoveQuote}
                        onCalculating={setIsShippingCalculating}
                    />
                </div>
            </div>
            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{totalPrice.toLocaleString()}</p>
                        <p>{shippingMethod === 'LALAMOVE' && lalamoveQuote ? `${currency}${Number(lalamoveQuote.price.amount).toLocaleString()}` : 'Free'}</p>
                        {coupon && <p>{`-${currency}${(coupon.discount / 100 * totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Apply</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => setCoupon(null)} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>{currency}{(() => {
                    const shipping = shippingMethod === 'LALAMOVE' && lalamoveQuote ? Number(lalamoveQuote.price.amount) : 0;
                    const subtotal = coupon ? (totalPrice - (coupon.discount / 100 * totalPrice)) : totalPrice;
                    return (subtotal + shipping).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}</p>
            </div>

            {hasOutOfStock && (
                <div className='mb-3 p-3 bg-red-100 border border-red-300 rounded-lg'>
                    <p className='text-red-700 text-xs font-semibold'>⚠️ Cannot place order</p>
                    <p className='text-red-600 text-xs mt-1'>Some items are out of stock. Please remove them from your cart to continue.</p>
                </div>
            )}

            {isLalamoveSelected && isMultiStore && (
                <div className='mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                    <p className='text-amber-700 text-xs font-semibold'>⚠️ Lalamove Unavailable</p>
                    <p className='text-amber-600 text-xs mt-1'>Same Day Delivery (Lalamove) is not allowed for orders containing items from multiple stores. Please select another shipping method or checkout items from each store separately.</p>
                </div>
            )}

            <button
                onClick={handlePlaceOrder}
                className={`w-full py-2.5 rounded transition-all ${isPlaceOrderDisabled
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-700 text-white hover:bg-slate-900 active:scale-95'
                    }`}
                disabled={isPlaceOrderDisabled}
            >
                {!hasItems ? 'Select items to checkout' : 
                 (hasOutOfStock ? 'Remove Out of Stock Items' : 
                 (!selectedAddress ? 'Select Delivery Address' :
                 (isPlacingOrder ? (['QRPH'].includes(paymentMethod) ? 'Generating QR...' : 'Processing...') : 
                 (isShippingCalculating ? 'Calculating Shipping...' : 
                 (hasLalamoveError ? 'Shipping Calculation Failed' :
                 (isLalamoveSelected && isMultiStore ? 'Lalamove Unavailable for Multi-store' :
                 (isLalamoveSelected && !lalamoveQuote ? 'Waiting for Lalamove...' : 'Place Order')))))))}
            </button>

            {showAddressModal && (
                <AddressModal
                    setShowAddressModal={setShowAddressModal}
                    onAddressesAdded={fetchAddresses}
                />
            )}

            {isPlacingOrder && <Loading />}
        </div>
    )
}

export default OrderSummary
