import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ClockIcon, RefreshCwIcon, AlertCircleIcon } from 'lucide-react';

const LalamoveWidget = ({ deliveryAddress, items, onQuoteReceived, isSelected, storeId, onCalculating }) => {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Initializing...');
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [usingDefaultPickup, setUsingDefaultPickup] = useState(false);
    const debounceTimerRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Debounced quote fetching
    useEffect(() => {
        if (isSelected && deliveryAddress) {
            // Clear existing timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Debounce for 500ms to avoid excessive API calls
            if (onCalculating) onCalculating(true);
            debounceTimerRef.current = setTimeout(() => {
                fetchQuote();
            }, 500);
        } else if (!isSelected) {
            setQuote(null);
            onQuoteReceived(null);
            setError(null);
            setRetryCount(0);
            if (onCalculating) onCalculating(false);
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [isSelected, deliveryAddress, storeId]);

    // Geocode address with caching
    const geocodeAddress = useCallback(async (addressObj, addressId = null) => {
        setLoadingMessage('Finding location...');

        console.log('[Geocoding] Address object received:', addressObj);

        // Check if coordinates already exist
        if (addressObj.latitude && addressObj.longitude) {
            console.log('[Geocoding] Using cached coordinates:', { lat: addressObj.latitude, lng: addressObj.longitude });
            return {
                lat: addressObj.latitude,
                lng: addressObj.longitude
            };
        }

        // Geocode using Nominatim
        // Try multiple query formats for better success rate
        // Support both StoreAddress model fields (detailedAddress, district) and legacy fields (street, state)
        const detailedAddr = addressObj.detailedAddress || addressObj.street;
        const regionOrState = addressObj.district || addressObj.province || addressObj.state;
        const addressParts = [
            detailedAddr,
            addressObj.barangay,
            addressObj.city,
            regionOrState,
            "Philippines"
        ].filter(Boolean);

        const queries = [
            // Full address
            addressParts.join(', '),
            // Without detailed address
            [addressObj.barangay, addressObj.city, "Philippines"].filter(Boolean).join(', '),
            // Just city and barangay
            [addressObj.barangay, addressObj.city, "Philippines"].filter(Boolean).join(', '),
            // Just city
            [addressObj.city, "Philippines"].filter(Boolean).join(', ')
        ];

        let data = null;
        let lastError = null;

        for (const queryStr of queries) {
            try {
                console.log('[Geocoding] Trying query:', queryStr);
                const query = encodeURIComponent(queryStr);

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
                    {
                        signal: abortControllerRef.current?.signal,
                        headers: {
                            'User-Agent': 'BudolShap/1.0'
                        }
                    }
                );

                if (!response.ok) {
                    console.warn('[Geocoding] HTTP error:', response.status);
                    continue;
                }

                const result = await response.json();
                console.log('[Geocoding] Result:', result);

                if (result && result.length > 0) {
                    data = result;
                    console.log('[Geocoding] Success with query:', queryStr);
                    break;
                }
            } catch (err) {
                console.warn('[Geocoding] Query failed:', queryStr, err);
                lastError = err;
            }
        }

        if (!data || data.length === 0) {
            console.error('[Geocoding] All queries failed. Last error:', lastError);
            throw new Error("Unable to find this address. Please check and try again.");
        }

        const coordinates = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };

        console.log('[Geocoding] Final coordinates:', coordinates);

        // Cache coordinates in database if addressId is provided
        if (addressId) {
            try {
                await fetch(`/api/addresses/${addressId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        latitude: coordinates.lat,
                        longitude: coordinates.lng
                    })
                });
                console.log('[Geocoding Cache] Saved coordinates for address:', addressId);
            } catch (cacheError) {
                console.warn('[Geocoding Cache] Failed to save coordinates:', cacheError);
                // Don't fail the quote if caching fails
            }
        }

        return coordinates;
    }, []);

    // Retry logic with exponential backoff
    const retryWithBackoff = useCallback(async (fn, maxRetries = 3) => {
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries) throw error;

                const delay = Math.min(1000 * Math.pow(2, i), 5000); // Max 5 seconds
                setLoadingMessage(`Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                setRetryCount(i + 1);
            }
        }
    }, []);

    const fetchQuote = async () => {
        // Abort any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);
        setQuote(null);
        setRetryCount(0);
        setLoadingMessage('Initializing...');
        onQuoteReceived(null);
        if (onCalculating) onCalculating(true);

        try {
            // Calculate total weight (default 1kg per item if not specified)
            const totalWeight = items.reduce((acc, item) => acc + (item.weight || 1), 0);

            // Geocode delivery address with caching
            setLoadingMessage('Locating delivery address...');
            const deliveryCoords = await geocodeAddress(deliveryAddress, deliveryAddress.id);

            // Default pickup (fallback if store fetch fails)
            let pickup = {
                address: "Glorietta 4, Ayala Center, Makati, Metro Manila",
                coordinates: { lat: 14.5505, lng: 121.0260 },
                contactName: "BudolShap Store",
                contactPhone: "+639170000000"
            };

            // Fetch store details if available
            if (storeId) {
                try {
                    setLoadingMessage('Getting store location...');
                    const storeRes = await fetch(`/api/stores/${storeId}`, {
                        signal: abortControllerRef.current.signal
                    });

                    if (storeRes.ok) {
                        const contentType = storeRes.headers.get("content-type");
                        if (contentType && contentType.includes("application/json")) {
                            const storeData = await storeRes.json();

                            // Check if we have a structured default address (New System)
                            const defaultAddress = storeData.addresses && storeData.addresses.length > 0 ? storeData.addresses[0] : null;

                            if (defaultAddress) {
                                console.log('[Store Location] Found structured default address:', defaultAddress);
                                // Construct full address string using StoreAddress model fields
                                const fullStoreAddress = [
                                    defaultAddress.detailedAddress || defaultAddress.street,
                                    defaultAddress.barangay,
                                    defaultAddress.city,
                                    defaultAddress.district || defaultAddress.province || defaultAddress.state,
                                    defaultAddress.zip || defaultAddress.postalCode,
                                    defaultAddress.country
                                ].filter(Boolean).join(', ');

                                // Use stored coordinates from the Address model if available, otherwise geocode
                                if (defaultAddress.latitude && defaultAddress.longitude) {
                                    pickup = {
                                        address: fullStoreAddress,
                                        coordinates: {
                                            lat: defaultAddress.latitude,
                                            lng: defaultAddress.longitude
                                        },
                                        contactName: storeData.name,
                                        contactPhone: defaultAddress.phone || storeData.contact || "+639170000000"
                                    };
                                } else {
                                    // We need to geocode this new address
                                    setLoadingMessage('Locating store address...');
                                    try {
                                        const storeCoords = await geocodeAddress(defaultAddress, defaultAddress.id);
                                        pickup = {
                                            address: fullStoreAddress,
                                            coordinates: storeCoords,
                                            contactName: storeData.name,
                                            contactPhone: defaultAddress.phone || storeData.contact || "+639170000000"
                                        };
                                    } catch (geoErr) {
                                        console.warn('[Store Location] Failed to geocode structured address:', geoErr);
                                    }
                                }
                            }

                            // Fallback to Legacy System if no pickup set yet
                            if (pickup.address === "Glorietta 4, Ayala Center, Makati, Metro Manila") {
                                if (storeData.latitude && storeData.longitude) {
                                    pickup = {
                                        address: storeData.address,
                                        coordinates: { lat: storeData.latitude, lng: storeData.longitude },
                                        contactName: storeData.name,
                                        contactPhone: storeData.contact || "+639170000000"
                                    };
                                } else if (storeData.address) {
                                    try {
                                        const geocodeRes = await fetch(`/api/stores/${storeId}/geocode`, {
                                            method: 'PATCH',
                                            signal: abortControllerRef.current.signal
                                        });

                                        if (geocodeRes.ok) {
                                            const gData = await geocodeRes.json();
                                            if (gData.success && gData.coordinates) {
                                                pickup = {
                                                    address: storeData.address,
                                                    coordinates: gData.coordinates,
                                                    contactName: storeData.name,
                                                    contactPhone: storeData.contact || "+639170000000"
                                                };
                                            }
                                        }
                                    } catch (geError) {
                                        console.warn('[Store Location] Geocoding error:', geError);
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    if (e.name === 'AbortError') throw e;
                    console.warn('Failed to fetch store details:', e);
                }
            }

            // Check if we are using the default pickup
            const isDefault = pickup.address === "Glorietta 4, Ayala Center, Makati, Metro Manila";
            setUsingDefaultPickup(isDefault);

            // Fetch quote with retry logic
            setLoadingMessage('Calculating delivery cost...');
            const quoteData = await retryWithBackoff(async () => {
                const response = await fetch('/api/shipping/lalamove/quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pickup: pickup,
                        delivery: {
                            address: [
                                deliveryAddress.houseNumber,
                                deliveryAddress.street,
                                deliveryAddress.barangay,
                                deliveryAddress.city,
                                deliveryAddress.state
                            ].filter(Boolean).join(', '),
                            coordinates: deliveryCoords,
                            contactName: deliveryAddress.name,
                            contactPhone: deliveryAddress.phone
                        },
                        package: {
                            weight: totalWeight,
                            description: `Order of ${items.length} items`
                        }
                    }),
                    signal: abortControllerRef.current.signal
                });

                // Robust JSON parsing
                const contentType = response.headers.get("content-type");
                let data;
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    console.error('[Lalamove Quote API] Received non-JSON response:', text.substring(0, 500));
                    throw new Error(`Server returned non-JSON response (${response.status}).`);
                }

                if (!response.ok) {
                    console.error('[Lalamove Quote API Error Response]', {
                        status: response.status,
                        statusText: response.statusText,
                        data: data
                    });

                    if (response.status === 408 || response.status === 504) {
                        throw new Error("Request timed out. Please try again.");
                    } else if (response.status === 503) {
                        throw new Error("Lalamove service temporarily unavailable.");
                    } else {
                        // Extract error message from various possible formats
                        const errorMessage = data?.error || data?.message || (typeof data === 'string' ? data : null) || 'Failed to get delivery quote';
                        throw new Error(errorMessage);
                    }
                }

                return data;
            });

            setQuote(quoteData.quote);
            onQuoteReceived(quoteData.quote);
            setLoadingMessage('');

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Quote request aborted');
                return;
            }

            console.error('[Lalamove Quote Error]', err);

            let errorMessage = err.message;
            if (err.message.includes('fetch')) {
                errorMessage = "Network error. Please check your connection and try again.";
            } else if (err.message.includes('timeout')) {
                errorMessage = "Request timed out. Please try again.";
            } else if (err.message.includes('temporarily unavailable')) {
                errorMessage = "Lalamove service is temporarily unavailable. Please try again in a few minutes.";
            } else if (err.message.includes('An invalid response was received from the upstream server')) {
                errorMessage = "Lalamove service is currently experiencing upstream server issues. Please try again in a few minutes.";
            } else if (err.message.includes('Failed to get shipping quote') || err.message.includes('non-JSON response')) {
                errorMessage = "Unable to calculate delivery cost. Service might be down.";
            }

            setError(errorMessage);
            onQuoteReceived(null);
        } finally {
            setLoading(false);
            setLoadingMessage('');
            if (onCalculating) onCalculating(false);
        }
    };


    if (!isSelected) return null;

    return (
        <div className="mt-3 p-4 border border-indigo-100 bg-indigo-50/50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between text-indigo-900 mb-3">
                <div className="flex items-center gap-2">
                    <Image src="/lalamove-logo.png" alt="Lalamove" width={120} height={120} className="object-contain" />
                    <span className="font-semibold text-sm">Delivery</span>
                </div>
                {quote && !loading && (
                    <button
                        onClick={fetchQuote}
                        className="text-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                        title="Refresh Quote"
                        disabled={loading}
                    >
                        <RefreshCwIcon size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                )}
            </div>

            {loading && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-indigo-600 py-2">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                        <span>{loadingMessage}</span>
                    </div>
                    {retryCount > 0 && (
                        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                            <div className="flex items-center gap-1.5">
                                <AlertCircleIcon size={12} />
                                <span>Retry attempt {retryCount} of 3...</span>
                            </div>
                        </div>
                    )}
                    {/* Progress skeleton */}
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-indigo-100 rounded w-3/4"></div>
                        <div className="h-4 bg-indigo-100 rounded w-1/2"></div>
                    </div>
                </div>
            )}

            {error && (
                <div className="text-xs text-red-600 bg-red-50 p-3 rounded border border-red-100">
                    <div className="flex items-start gap-2">
                        <AlertCircleIcon size={14} className="mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium">Delivery Unavailable</p>
                            <p className="mt-0.5 opacity-80">{error}</p>
                            <button
                                onClick={fetchQuote}
                                className="text-indigo-600 underline mt-2 hover:text-indigo-800 font-medium"
                                disabled={loading}
                            >
                                {loading ? 'Retrying...' : 'Try Again'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {usingDefaultPickup && !loading && quote && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 mb-2">
                    <div className="flex items-start gap-1.5">
                        <AlertCircleIcon size={12} className="mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Using Default Pickup</p>
                            <p className="opacity-90">Store location could not be verified on map. Calculated from Glorietta 4 (Default).</p>
                        </div>
                    </div>
                </div>
            )}

            {quote && !loading && (
                <div className="space-y-2 animate-in fade-in duration-300">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500">Delivery Fee</span>
                        <span className="font-bold text-indigo-700 text-lg">{quote.price.currency} {quote.price.amount}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 bg-white/60 p-2 rounded">
                        <div className="flex items-center gap-1.5">
                            <ClockIcon size={14} className="text-indigo-500" />
                            <span>Estimated Arrival</span>
                        </div>
                        <span className="font-medium">
                            {quote.estimatedDeliveryTime
                                ? new Date(quote.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Calculating...'}
                        </span>
                    </div>
                    {quote.distance && (
                        <div className="text-xs text-slate-500 text-center pt-1">
                            Distance: {(Number(quote.distance.value) / 1000).toFixed(1)} km
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LalamoveWidget;
