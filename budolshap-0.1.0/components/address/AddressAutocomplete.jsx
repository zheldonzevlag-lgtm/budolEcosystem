'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { useMapSettings } from '@/hooks/useMapSettings';

const AddressAutocomplete = ({ onSelect, placeholder = "Search for your street, building, or area...", initialValue = "" }) => {
    const { mapProvider } = useMapSettings();
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const debounceTimer = useRef(null);

    // Sync query with initialValue when it changes externally
    useEffect(() => {
        if (initialValue !== undefined) {
            setQuery(initialValue);
        }
    }, [initialValue]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchText) => {
        if (!searchText || searchText.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            // Use server-side geocoding API to handle CORS and keys securely
            const response = await fetch(`/api/system/geocode?q=${encodeURIComponent(searchText)}`, {
                headers: { 'Accept-Language': 'en' },
                signal: AbortSignal.timeout(10000) // 10s timeout
            });

            if (!response.ok) {
                throw new Error(`Geocoding error: ${response.status}`);
            }

            const data = await response.json();
            
            // API returns standardized format: { id, display, main, secondary, coordinates, raw }
            // or an array of such objects. The API update ensures it returns an array for 'q'.
            
            let results =Array.isArray(data) ? data : [data];
            
            // Filter out any invalid results just in case
            results = results.filter(item => item && item.coordinates);

            setSuggestions(results);
            setIsOpen(true);
        } catch (error) {
            console.error('Autocomplete error:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        
        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 500);
    };

    const handleSelect = (item) => {
        setQuery(item.display);
        setIsOpen(false);
        if (onSelect) onSelect(item);
    };

    const clearInput = () => {
        setQuery("");
        setSuggestions([]);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loading ? (
                        <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
                    ) : (
                        <Search className="h-5 w-5 text-slate-400" />
                    )}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 3 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="block w-full pl-10 pr-10 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 focus:bg-white focus:border-green-500 focus:ring-0 transition-all text-sm outline-none"
                />
                {query && (
                    <button 
                        onClick={clearInput}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-[4000] w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-72 overflow-y-auto">
                    {suggestions.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-slate-50 last:border-0 flex items-start gap-3 transition-colors"
                        >
                            <div className="mt-1">
                                <MapPin className="h-4 w-4 text-green-500" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-slate-800 line-clamp-1">{item.main}</div>
                                <div className="text-xs text-slate-500 line-clamp-1">{item.secondary || item.display}</div>
                            </div>
                        </button>
                    ))}
                    <div className="px-4 py-2 bg-slate-50 text-[10px] text-slate-400 flex justify-between items-center">
                        <span>Powered by {mapProvider}</span>
                        <span>Select to pin on map</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressAutocomplete;
