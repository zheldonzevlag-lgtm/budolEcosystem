'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * GoogleMapView Component
 * 
 * Wraps the Google Maps JavaScript API to provide a map view that integrates
 * with the application's MapPicker component.
 * 
 * Features:
 * - Native Google Maps tiles
 * - Forward ref for parent control (zoom, flyTo)
 * - Click handling (via internal pan and idle event)
 * - External center updates
 * 
 * @component
 * @param {Object} props
 * @param {Array<number>} props.center - [lat, lng] coordinates
 * @param {Function} props.onCenterChange - Callback when map center changes
 * @param {string} props.apiKey - Google Maps API Key
 */
const GoogleMapView = forwardRef(({ center, onCenterChange, apiKey }, ref) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const isDraggingRef = useRef(false);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
            }
        },
        zoomOut: () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
            }
        },
        flyTo: (coords, zoom) => {
             if (mapInstanceRef.current) {
                mapInstanceRef.current.panTo({ lat: coords[0], lng: coords[1] });
                if (zoom) mapInstanceRef.current.setZoom(zoom);
             }
        }
    }));

    // Load Google Maps Script
    useEffect(() => {
        if (!apiKey) {
            setLoadError("Missing Google Maps API Key");
            return;
        }

        // Check if script already exists
        if (window.google && window.google.maps) {
            setScriptLoaded(true);
            return;
        }

        const scriptId = 'google-maps-script';
        if (document.getElementById(scriptId)) {
            // Script already loading, wait for it
            const checkGoogle = setInterval(() => {
                if (window.google && window.google.maps) {
                    setScriptLoaded(true);
                    clearInterval(checkGoogle);
                }
            }, 100);
            return () => clearInterval(checkGoogle);
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => setLoadError("Failed to load Google Maps script");
        
        document.head.appendChild(script);

        return () => {
            // We usually don't remove the script to avoid reloading it constantly
        };
    }, [apiKey]);

    // Initialize Map
    useEffect(() => {
        if (!scriptLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

        try {
            const map = new window.google.maps.Map(mapContainerRef.current, {
                center: { lat: center[0], lng: center[1] },
                zoom: 15,
                disableDefaultUI: true, // Keep it clean like the Leaflet version
                zoomControl: false,      // We have custom buttons
                clickableIcons: false,
                gestureHandling: 'greedy', // Standard mobile-friendly handling
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }] // Optional: cleaner look
                    }
                ]
            });

            mapInstanceRef.current = map;

            // Event Listeners
            map.addListener('dragstart', () => {
                isDraggingRef.current = true;
            });

            // Click to center
            map.addListener('click', (e) => {
                if (e.latLng) {
                    map.panTo(e.latLng);
                }
            });

            map.addListener('idle', () => {
                // idle fires when map stops moving (after drag or zoom)
                const newCenter = map.getCenter();
                if (newCenter) {
                    // Notify parent of new center
                    // We only notify if the map is idle, which means user stopped dragging
                    onCenterChange([newCenter.lat(), newCenter.lng()]);
                }
                isDraggingRef.current = false;
            });

        } catch (err) {
            console.error("Error initializing Google Map:", err);
            setLoadError("Error initializing map");
        }
    }, [scriptLoaded]); // Init once when script loads

    // Sync Center Prop -> Map
    useEffect(() => {
        if (mapInstanceRef.current && center) {
            const currentCenter = mapInstanceRef.current.getCenter();
            if (!currentCenter) return;

            const lat = currentCenter.lat();
            const lng = currentCenter.lng();
            
            // Calculate distance to see if we need to move
            // Simple check to avoid infinite loops if the update came from the map itself
            const dist = Math.sqrt(Math.pow(lat - center[0], 2) + Math.pow(lng - center[1], 2));

            // Only move if distance is significant (> ~10 meters)
            if (dist > 0.0001) {
                mapInstanceRef.current.panTo({ lat: center[0], lng: center[1] });
            }
        }
    }, [center]);

    if (loadError) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-xl border border-red-100">
                <div className="text-center p-4">
                    <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600">{loadError}</p>
                </div>
            </div>
        );
    }

    if (!scriptLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                    <p className="text-xs text-gray-500">Loading Google Maps...</p>
                </div>
            </div>
        );
    }

    return <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-xl overflow-hidden"
      data-testid="google-map-container"
    />;
});

GoogleMapView.propTypes = {
    center: PropTypes.arrayOf(PropTypes.number).isRequired,
    onCenterChange: PropTypes.func.isRequired,
    apiKey: PropTypes.string.isRequired
};

GoogleMapView.displayName = 'GoogleMapView';

export default GoogleMapView;
