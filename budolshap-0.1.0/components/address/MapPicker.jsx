'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2, Search, AlertCircle, Plus, Minus } from 'lucide-react';
import { useMapSettings } from '@/hooks/useMapSettings';
import GoogleMapView from './GoogleMapView';

// Fix for default marker icons in Leaflet - only run on client
if (typeof window !== 'undefined') {
    const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });

    L.Marker.prototype.options.icon = DefaultIcon;
}

// Map Events Component
function MapEvents({ onMoveEnd, onClick }) {
    const map = useMapEvents({
        moveend: () => {
            const center = map.getCenter();
            onMoveEnd([center.lat, center.lng]);
        },
        click: (e) => {
            onClick([e.latlng.lat, e.latlng.lng]);
        }
    });
    return null;
}

// Map Center Updater
function MapCenterUpdater({ center }) {
    const map = useMap();
    
    useEffect(() => {
        // Force multiple invalidations to ensure map tiles load correctly
        // especially when parent container size changes or section expands
        const timer1 = setTimeout(() => map.invalidateSize(), 100);
        const timer2 = setTimeout(() => map.invalidateSize(), 500);
        const timer3 = setTimeout(() => map.invalidateSize(), 1000);
        
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [map]);

    useEffect(() => {
        if (center) {
            const currentCenter = map.getCenter();
            const targetCenter = L.latLng(center[0], center[1]);
            
            if (currentCenter.distanceTo(targetCenter) > 1) {
                map.setView(center, map.getZoom());
            }
        }
    }, [center, map]);
    return null;
}

/**
 * @component
 * @param {Object} props
 * @param {Array<number>} props.initialCenter - [lat, lng]
 * @param {Function} props.onLocationChange - Callback with location details
 * @param {string} props.height - Container height (default: "300px")
 */
const MapPicker = ({ initialCenter = [14.5995, 120.9842], onLocationChange, height = "300px" }) => {
    const { mapProvider, geoapifyApiKey, googleMapsApiKey, radarApiKey } = useMapSettings();
    const [map, setMap] = useState(null); // Leaflet Map Instance
    const googleMapRef = useRef(null); // Google Map Ref
    
    // Determine if we should show Google Maps (only if provider selected)
    const showGoogleMap = mapProvider === 'GOOGLE_MAPS';

    const [center, setCenter] = useState(initialCenter);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isFirstRender = useRef(true);
    const lastInitialCenter = useRef(initialCenter);
    const lastGeocodeTime = useRef(0);

    // Custom Green Icon to match theme
    const GreenIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="color: #10b981; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3" fill="white"></circle>
                </svg>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });

    const reverseGeocode = useCallback(async (coords) => {
        if (!coords || !Array.isArray(coords) || coords.length < 2 || coords[0] === undefined || coords[1] === undefined) {
            console.warn("[MapPicker] Invalid coordinates provided to reverseGeocode:", coords);
            return;
        }

        // Simple rate limiting: max 1 request per 1.5 seconds for Nominatim
        const now = Date.now();
        const isCommercialProvider = (mapProvider === 'GEOAPIFY' && geoapifyApiKey) || 
                                     (mapProvider === 'GOOGLE_MAPS' && googleMapsApiKey) || 
                                     (mapProvider === 'RADAR' && radarApiKey);

        if (!isCommercialProvider && (now - lastGeocodeTime.current < 1500)) {
            console.log("[MapPicker] Geocoding skipped (rate limit)");
            return;
        }
        lastGeocodeTime.current = now;

        setLoading(true);
        setError(null);
        try {
            let result = null;
            // Use internal API to handle providers, secrets, and CORS/User-Agent
            const url = `/api/system/geocode?lat=${coords[0]}&lng=${coords[1]}`;

            console.log(`[MapPicker] Fetching address for: ${coords[0]}, ${coords[1]}`);

            const res = await fetch(url, {
                headers: {
                    'Accept-Language': 'en',
                },
                // Add a timeout to fetch
                signal: AbortSignal.timeout(10000) 
            });

            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error("Too many requests. Please wait a moment.");
                }
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Geocoding API error (${res.status})`);
            }

            const data = await res.json();
            
            // API returns standardized format
            if (data && data.display) {
                result = {
                    ...data,
                    coordinates: coords
                };
            }
            
            if (result) {
                setAddress(result);
                if (onLocationChange) onLocationChange(result);
            } else {
                setError("No address found for this location");
                // Still notify about coordinate change even if reverse geocode fails
                if (onLocationChange) onLocationChange({ coordinates: coords });
            }
        } catch (err) {
            console.error("[MapPicker] Reverse geocoding error:", err);
            if (err.name === 'TimeoutError') {
                setError("Geocoding request timed out");
            } else if (err.message === 'Failed to fetch') {
                setError("Unable to connect to geocoding service. Please check your internet connection.");
            } else {
                setError(err.message);
            }
            // Still notify about coordinate change even if reverse geocode fails
            if (onLocationChange) onLocationChange({ coordinates: coords });
        } finally {
            setLoading(false);
        }
    }, [onLocationChange]);

    // Sync internal center with initialCenter prop only when initialCenter itself changes
    useEffect(() => {
        if (initialCenter) {
            const prevInitial = L.latLng(lastInitialCenter.current[0], lastInitialCenter.current[1]);
            const nextInitial = L.latLng(initialCenter[0], initialCenter[1]);
            
            // If the initialCenter prop has changed (e.g. from search)
            if (prevInitial.distanceTo(nextInitial) > 1) {
                lastInitialCenter.current = initialCenter;
                setCenter(initialCenter);
                reverseGeocode(initialCenter);
            }
        }
    }, [initialCenter, reverseGeocode]);

    // Initial reverse geocode
    useEffect(() => {
        if (isFirstRender.current) {
            // Only geocode if we don't have an address yet (e.g. initial mount)
            if (!address) {
                reverseGeocode(initialCenter);
            }
            isFirstRender.current = false;
        }
    }, [initialCenter, reverseGeocode, address]); // Added address to deps to be safe

    const handleMoveEnd = (newCoords) => {
        const currentCenter = L.latLng(center[0], center[1]);
        const nextCenter = L.latLng(newCoords[0], newCoords[1]);
        
        // Only update if the distance is significant (more than 1 meter)
        if (currentCenter.distanceTo(nextCenter) > 1) {
            setCenter(newCoords);
            reverseGeocode(newCoords);
        }
    };

    const handleMapClick = (newCoords) => {
        const currentCenter = L.latLng(center[0], center[1]);
        const nextCenter = L.latLng(newCoords[0], newCoords[1]);
        
        // Only update if the distance is significant (more than 1 meter)
        if (currentCenter.distanceTo(nextCenter) > 1) {
            setCenter(newCoords);
            reverseGeocode(newCoords);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = [position.coords.latitude, position.coords.longitude];
                    setCenter(coords);
                    reverseGeocode(coords);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setLoading(false);
                }
            );
        }
    };

    // Determine Tile Layer URL
    const getTileLayer = () => {
        if (mapProvider === 'GEOAPIFY' && geoapifyApiKey) {
            return `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoapifyApiKey}`;
        }
        if (mapProvider === 'RADAR' && radarApiKey) {
            return `https://api.radar.io/maps/styles/radar-default-v1/{z}/{x}/{y}.png?publishableKey=${radarApiKey}`;
        }
        if (mapProvider === 'GOOGLE_MAPS' && googleMapsApiKey) {
            // Note: Direct tile access is not standard for Google Maps. 
            // Proper implementation requires the Google Maps JavaScript API (google-map-react or @react-google-maps/api).
            // For now, falling back to OSM to avoid breaking the UI while keeping the geocoding provider active.
            console.warn("[MapPicker] Google Maps tile layer requires JS API integration. Using OSM tiles as fallback.");
            return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        }
        // Fallback to OSM
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    };

    return (
        <div style={{ height: height === '100%' ? '100%' : height }} className="relative w-full rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm h-full">
            <div className="z-0 h-full w-full">
                {showGoogleMap ? (
                    <GoogleMapView
                        ref={googleMapRef}
                        center={center}
                        onCenterChange={handleMoveEnd}
                        apiKey={googleMapsApiKey}
                    />
                ) : (
                    <MapContainer 
                        center={center} 
                        zoom={15} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        scrollWheelZoom={true}
                        ref={setMap}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url={getTileLayer()}
                        />
                        <MapEvents onMoveEnd={handleMoveEnd} onClick={handleMapClick} />
                        <MapCenterUpdater center={center} />
                    </MapContainer>
                )}
            </div>

            {/* Center Pin Overlay (Shopee Style) - Fixed at the center of the map container */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+4px)] pointer-events-none z-[2000]">
                <div className="flex flex-col items-center">
                    <div className={`transition-transform duration-200 ${loading ? '-translate-y-2' : 'translate-y-0'}`}>
                        <div className="relative group">
                            {/* Outer Glow */}
                            <div className="absolute inset-0 bg-green-400/20 blur-xl rounded-full scale-150"></div>
                            
                            {/* Pin Icon */}
                            <div className="relative">
                                <MapPin className="h-8 w-8 md:h-10 md:w-10 text-green-600 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]" strokeWidth={2.5} />
                                {/* Inner circle for better visibility - matching smaller size */}
                                <div className="absolute top-[9px] left-[9px] md:top-[11px] md:left-[11px] h-3 w-3 md:h-4 md:w-4 flex items-center justify-center">
                                    <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-green-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Point Shadow */}
                    <div className="h-1.5 w-4 bg-black/30 rounded-[100%] blur-[1px] mt-1 scale-x-110"></div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col gap-2 md:gap-3 z-[2000]">
                {/* Zoom Controls - Hidden on mobile as pinch-to-zoom is standard */}
                <div className="hidden md:flex flex-col rounded-xl md:rounded-2xl overflow-hidden border-2 border-green-600 bg-white/10 backdrop-blur-sm">
                    <button 
                        type="button"
                        onClick={() => showGoogleMap ? googleMapRef.current?.zoomIn() : map?.zoomIn()}
                        className="p-2 md:p-2.5 text-green-600 hover:bg-green-50/20 transition-all flex items-center justify-center border-b-2 border-green-600"
                        title="Zoom In"
                    >
                        <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </button>
                    <button 
                        type="button"
                        onClick={() => showGoogleMap ? googleMapRef.current?.zoomOut() : map?.zoomOut()}
                        className="p-2 md:p-2.5 text-green-600 hover:bg-green-50/20 transition-all flex items-center justify-center"
                        title="Zoom Out"
                    >
                        <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </button>
                </div>

                <button 
                    type="button"
                    onClick={getCurrentLocation}
                    className="p-2.5 md:p-3 text-green-600 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-green-50/20 active:scale-95 transition-all flex items-center justify-center border-2 border-green-600 z-[2001]"
                    title="Get Current Location"
                >
                    {loading ? <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" /> : <Navigation className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                </button>
            </div>

            {/* Address/Error Overlay - Removed as it obstructs the map view. Address info should be displayed in the search input */}
            {/* 
            {(address || error) && (
                <div className="absolute top-4 left-4 right-4 z-[1001]">
                    ...
                </div>
            )}
            */}

            {/* Loading Indicator - Minimalist overlay */}
            {loading && (
                <div className="absolute top-4 right-4 z-[1001] bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-green-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Geocoding...</span>
                </div>
            )}

            {/* Error Indicator - Minimalist overlay */}
            {error && (
                <div className="absolute top-4 left-4 right-4 z-[1001] bg-red-50/95 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-red-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-tight">{error}</span>
                    </div>
                    <button 
                        onClick={() => reverseGeocode(center)}
                        className="text-[9px] font-black text-red-700 hover:underline uppercase"
                    >
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
};

export default MapPicker;
