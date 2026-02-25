import { NextResponse } from 'next/server';
import { getSystemSettings } from '@/lib/services/systemSettingsService';

/**
 * GET /api/system/geocode
 * query params:
 * - lat, lng: for reverse geocoding
 * - q: for forward geocoding
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const q = searchParams.get('q');

        // Get system settings to determine provider
        const settings = await getSystemSettings();
        const mapProvider = settings.mapProvider || 'OSM';
        const geoapifyApiKey = settings.geoapifyApiKey;

        let result = null;

        // GEOAPIFY Provider
        if (mapProvider === 'GEOAPIFY' && geoapifyApiKey) {
            if (lat && lng) {
                // Reverse Geocoding (Single Result)
                const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${geoapifyApiKey}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Geoapify API error: ${res.status}`);
                const data = await res.json();
                
                if (data.features?.length > 0) {
                    const props = data.features[0].properties;
                    return NextResponse.json({
                        display: props.formatted,
                        main: props.name || props.street || props.suburb || props.city,
                        secondary: props.city || props.county || props.state,
                        address: {
                            city: props.city || props.municipality || props.town || props.village,
                            province: props.state || props.province,
                            barangay: props.suburb || props.neighbourhood || props.village,
                            street: props.street || props.name,
                            zip: props.postcode,
                            district: props.state_district || props.region
                        },
                        raw: props,
                        coordinates: [props.lat, props.lon]
                    });
                }
            } else if (q) {
                // Forward Geocoding (Multiple Results)
                const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&filter=countrycode:ph&limit=5&apiKey=${geoapifyApiKey}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Geoapify API error: ${res.status}`);
                const data = await res.json();

                const results = data.features.map(f => ({
                    id: f.properties.place_id,
                    display: f.properties.formatted,
                    main: f.properties.name || f.properties.street,
                    secondary: f.properties.city || f.properties.county || f.properties.state,
                    address: {
                        city: f.properties.city || f.properties.municipality || f.properties.town || f.properties.village,
                        province: f.properties.state || f.properties.province,
                        barangay: f.properties.suburb || f.properties.neighbourhood || f.properties.village,
                        street: f.properties.street || f.properties.name,
                        zip: f.properties.postcode,
                        district: f.properties.state_district || f.properties.region
                    },
                    raw: f.properties,
                    coordinates: [f.geometry.coordinates[1], f.geometry.coordinates[0]] // [lat, lng]
                }));
                return NextResponse.json(results);
            }
        } 
        // GOOGLE MAPS Provider
        else if (mapProvider === 'GOOGLE_MAPS' && settings.googleMapsApiKey) {
            const apiKey = settings.googleMapsApiKey;
            
            if (lat && lng) {
                // Reverse Geocoding
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.status === 'OK' && data.results.length > 0) {
                    const first = data.results[0];
                    // Extract components
                    const getComponent = (type) => first.address_components.find(c => c.types.includes(type))?.long_name;
                    
                    const streetNumber = getComponent('street_number');
                    const route = getComponent('route');
                    const neighborhood = getComponent('neighborhood');
                    const city = getComponent('locality') || getComponent('administrative_area_level_2');
                    const state = getComponent('administrative_area_level_1');
                    
                    const barangay = getComponent('sublocality_level_1') || getComponent('neighborhood') || getComponent('sublocality');
                    const zip = getComponent('postal_code');
                    const district = getComponent('administrative_area_level_3'); // Optional district

                    const mainText = [streetNumber, route].filter(Boolean).join(' ') || neighborhood || first.formatted_address.split(',')[0];

                    return NextResponse.json({
                        display: first.formatted_address,
                        main: mainText,
                        secondary: [city, state].filter(Boolean).join(', '),
                        address: {
                            city: city,
                            province: state,
                            barangay: barangay,
                            street: [streetNumber, route].filter(Boolean).join(' '),
                            zip: zip,
                            district: district
                        },
                        raw: first,
                        coordinates: [first.geometry.location.lat, first.geometry.location.lng]
                    });
                }
            } else if (q) {
                // Use Places Text Search API for better POI finding (Matches Google Maps behavior)
                // Geocoding API is strictly for addresses, while Places API finds businesses/buildings.
                // Added region=ph to bias results to Philippines
                const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&region=ph&key=${apiKey}`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.status === 'OK') {
                    const results = data.results.map(item => {
                        // Place Text Search results don't have full address_components structure compatible with our form.
                        // We rely on the frontend (MapPicker) to automatically trigger a reverse-geocode 
                        // upon receiving the new coordinates, which will fill the City/Barangay fields.
                        
                        return {
                            id: item.place_id,
                            display: item.formatted_address,
                            main: item.name, // e.g. "One Park Drive"
                            secondary: item.formatted_address,
                            address: null, // Signals frontend to rely on reverse-geocoding for details
                            raw: item,
                            coordinates: [item.geometry.location.lat, item.geometry.location.lng]
                        };
                    });
                    return NextResponse.json(results);
                }
            }
        }
        // RADAR Provider
        else if (mapProvider === 'RADAR' && settings.radarApiKey) {
            const apiKey = settings.radarApiKey;
            const headers = { 'Authorization': apiKey };

            if (lat && lng) {
                // Reverse Geocoding
                const url = `https://api.radar.io/v1/geocode/reverse?coordinates=${lat},${lng}`;
                const res = await fetch(url, { headers });
                const data = await res.json();

                if (data.meta.code === 200 && data.addresses.length > 0) {
                    const addr = data.addresses[0];
                    return NextResponse.json({
                        display: addr.formattedAddress,
                        main: addr.addressLabel || addr.placeLabel || addr.street || 'Unknown Location',
                        secondary: `${addr.city || ''}, ${addr.state || ''}`,
                        address: {
                            city: addr.city,
                            province: addr.state,
                            barangay: addr.neighborhood, // Best effort for Radar
                            street: [addr.number, addr.street].filter(Boolean).join(' '),
                            zip: addr.postalCode,
                            district: addr.county
                        },
                        raw: addr,
                        coordinates: [addr.latitude, addr.longitude]
                    });
                }
            } else if (q) {
                // Forward Geocoding
                const url = `https://api.radar.io/v1/geocode/forward?query=${encodeURIComponent(q)}&country=PH`;
                const res = await fetch(url, { headers });
                const data = await res.json();

                if (data.meta.code === 200) {
                    const results = data.addresses.map(addr => ({
                        id: addr.placeId || `${addr.latitude},${addr.longitude}`,
                        display: addr.formattedAddress,
                        main: addr.addressLabel || addr.placeLabel || addr.street,
                        secondary: `${addr.city || ''}, ${addr.state || ''}`,
                        address: {
                            city: addr.city,
                            province: addr.state,
                            barangay: addr.neighborhood,
                            street: [addr.number, addr.street].filter(Boolean).join(' '),
                            zip: addr.postalCode,
                            district: addr.county
                        },
                        raw: addr,
                        coordinates: [addr.latitude, addr.longitude]
                    }));
                    return NextResponse.json(results);
                }
            }
        }
        // NOMINATIM (OSM) Provider - Default
        else {
            if (lat && lng) {
                // Reverse Geocoding (Single Result)
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'BudolShap/1.0 (budolshap.com)',
                        'Accept-Language': 'en'
                    }
                });
                if (!res.ok) throw new Error(`Nominatim API error: ${res.status}`);
                const item = await res.json();

                if (item && item.address) {
                    return NextResponse.json({
                        display: item.display_name,
                        main: item.address.road || item.address.suburb || item.address.neighbourhood || item.address.hamlet || item.name,
                        secondary: item.address.city || item.address.town || item.address.village || item.address.municipality,
                        address: {
                            city: item.address.city || item.address.town || item.address.municipality || item.address.village,
                            province: item.address.state || item.address.province,
                            barangay: item.address.suburb || item.address.neighbourhood || item.address.hamlet,
                            street: item.address.road,
                            zip: item.address.postcode,
                            district: item.address.state_district || item.address.region
                        },
                        raw: item,
                        coordinates: [parseFloat(item.lat), parseFloat(item.lon)]
                    });
                } else if (item && item.error) {
                    return NextResponse.json({ error: item.error }, { status: 404 });
                }
            } else if (q) {
                // Forward Geocoding (Multiple Results)
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=ph&limit=5&addressdetails=1`;
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'BudolShap/1.0 (budolshap.com)',
                        'Accept-Language': 'en'
                    }
                });
                if (!res.ok) throw new Error(`Nominatim API error: ${res.status}`);
                const data = await res.json();

                const results = data.map(item => ({
                    id: item.place_id,
                    display: item.display_name,
                    main: item.address.road || item.address.suburb || item.address.neighbourhood || item.name,
                    secondary: `${item.address.city || item.address.town || ''}, ${item.address.province || item.address.state || ''}`,
                    address: {
                        city: item.address.city || item.address.town || item.address.municipality || item.address.village,
                        province: item.address.state || item.address.province,
                        barangay: item.address.suburb || item.address.neighbourhood || item.address.hamlet,
                        street: item.address.road,
                        zip: item.address.postcode,
                        district: item.address.state_district || item.address.region
                    },
                    raw: item,
                    coordinates: [parseFloat(item.lat), parseFloat(item.lon)]
                }));
                return NextResponse.json(results);
            }
        }

        return NextResponse.json({ error: 'No address found or missing parameters' }, { status: 404 });

    } catch (error) {
        console.error('[Geocode API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
