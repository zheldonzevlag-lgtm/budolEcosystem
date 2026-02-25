'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { z } from 'zod';
import { MapPin, User, Phone, Tag, Info, AlertCircle, Loader2, Settings, ChevronDown, ChevronUp, Navigation, Eye, EyeOff } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';

// Import MapPicker dynamically with SSR disabled to avoid "window is not defined" errors
const MapPicker = dynamic(() => import('./MapPicker'), {
    ssr: false,
    loading: () => (
        <div className="w-full bg-slate-50 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-slate-100 animate-pulse" style={{ height: '240px' }}>
            <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
            <span className="text-xs font-medium text-slate-400">Loading Map...</span>
        </div>
    )
});

const COUNTRY_CODES = [
    { code: '+63', country: 'PH' },
    { code: '+1', country: 'US' },
    { code: '+44', country: 'UK' },
    { code: '+65', country: 'SG' },
    { code: '+81', country: 'JP' },
    { code: '+86', country: 'CN' },
    { code: '+61', country: 'AU' },
    { code: '+971', country: 'AE' },
]

const AddressFormManager = ({
    initialData = {},
    onSave,
    onCancel,
    isLoading = false,
    mode = 'address'
}) => {
    const isProfileMode = mode === 'profile'
    const isStoreMode = mode === 'store'

    // Helper to format phone number as nnn-nnn-nnnn
    const formatPhoneNumber = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    };

    // Helper to format initial phone
    const formatInitialPhone = (phone) => {
        if (!phone) return '+63';

        // Remove non-digits to get raw number
        const raw = phone.replace(/\D/g, '');

        if (phone.startsWith('+')) {
            // Find matching country code
            const matchedCode = COUNTRY_CODES.find(c => phone.startsWith(c.code))?.code || '+63';
            const numberPart = phone.slice(matchedCode.length).replace(/\D/g, '');
            return matchedCode + formatPhoneNumber(numberPart);
        }

        if (phone.startsWith('0')) {
            return '+63' + formatPhoneNumber(phone.slice(1));
        }

        return '+63' + formatPhoneNumber(phone);
    };

    const [formData, setFormData] = useState({
        name: initialData.name || '',
        firstName: mode !== 'store' ? (initialData.name ? initialData.name.split(' ')[0] : '') : '',
        lastName: mode !== 'store' ? (initialData.name ? initialData.name.split(' ').slice(1).join(' ') : '') : '',
        phone: formatInitialPhone(initialData.phone),
        email: initialData.email || '',
        password: '',
        district: initialData.district || '', // Region
        province: initialData.province || '',
        city: initialData.city || '',
        barangay: initialData.barangay || '',
        detailedAddress: initialData.detailedAddress || '',
        zip: initialData.zip || '',
        notes: initialData.notes || '',
        label: initialData.label || '',
        latitude: initialData.latitude || 14.5995,
        longitude: initialData.longitude || 120.9842,
        isDefault: initialData.isDefault || false
    });

    const [mapSearchValue, setMapSearchValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showFirstName, setShowFirstName] = useState(false);
    const [showLastName, setShowLastName] = useState(false);
    const [errors, setErrors] = useState({});
    const [openSections, setOpenSections] = useState({
        contact: true,
        map: true,
        address: true,
        settings: true
    });

    // Handle mobile default state for sections
    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 1024) { // lg breakpoint as per the grid layout
                setOpenSections({
                    contact: false,
                    map: false,
                    address: false,
                    settings: false
                });
            }
        };

        checkMobile();
    }, []);

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Update form data when initialData changes (e.g. after saving profile or re-opening modal)
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            name: initialData.name || '',
            firstName: mode !== 'store' ? (initialData.name ? initialData.name.split(' ')[0] : '') : '',
            lastName: mode !== 'store' ? (initialData.name ? initialData.name.split(' ').slice(1).join(' ') : '') : '',
            phone: formatInitialPhone(initialData.phone),
            email: initialData.email || '',
            district: initialData.district || '',
            province: initialData.province || '',
            city: initialData.city || '',
            barangay: initialData.barangay || '',
            detailedAddress: initialData.detailedAddress || '',
            zip: initialData.zip || '',
            notes: initialData.notes || '',
            label: initialData.label || '',
            latitude: initialData.latitude || 14.5995,
            longitude: initialData.longitude || 120.9842,
            isDefault: initialData.isDefault || false
        }));
    }, [JSON.stringify(initialData), mode]);

    const isSearchSelection = useRef(false);

    // Update coordinates when map moves
    const handleLocationChange = (result) => {
        if (!result) return;

        const { coordinates, raw } = result;

        // Update map search input if display name is available
        if (result.display) {
            setMapSearchValue(result.display);
        } else if (result.main) {
            setMapSearchValue(result.main);
        }

        // Extract details if available from raw data (varies by provider)
        // Initialize with empty strings to ensure previous values are cleared
        let newDetails = {
            city: '',
            province: '',
            barangay: '',
            zip: '',
            district: '',
            detailedAddress: ''
        };

        if (result.address) {
            // Use standardized address from API (works for all providers including Google Maps)
            const { city, province, barangay, zip, district, street } = result.address;

            newDetails.city = city || '';
            newDetails.province = province || '';
            newDetails.barangay = barangay || '';
            newDetails.zip = zip || '';
            newDetails.district = district || '';
            newDetails.detailedAddress = street || result.main || '';
        } else if (raw) {
            // Legacy mapping for Geoapify/Radar/Nominatim (fallback)
            const city = raw.city || raw.municipality || raw.town || raw.village || raw.address?.city || raw.address?.town || raw.address?.village;
            const province = raw.state || raw.province || raw.address?.state || raw.address?.province;
            const barangay = raw.suburb || raw.neighbourhood || raw.village || raw.address?.suburb || raw.address?.neighbourhood || raw.address?.village;
            const zip = raw.postcode || raw.address?.postcode;
            const district = raw.state_district || raw.region || raw.address?.state_district;
            const street = raw.street || raw.name || raw.address?.road || raw.address?.suburb || raw.address?.neighbourhood || raw.address?.village;

            newDetails.city = city || '';
            newDetails.province = province || '';
            newDetails.barangay = barangay || '';
            newDetails.zip = zip || '';
            newDetails.district = district || '';
            newDetails.detailedAddress = street || result.main || '';
        }

        // Preserve detailed address if this update was triggered by a search selection
        if (isSearchSelection.current) {
            if (formData.detailedAddress) {
                newDetails.detailedAddress = formData.detailedAddress;
            }
            isSearchSelection.current = false;
        }

        setFormData(prev => ({
            ...prev,
            ...newDetails,
            latitude: coordinates[0],
            longitude: coordinates[1]
        }));
    };

    // When a suggestion is selected from autocomplete
    const handleSearchSelect = (item) => {
        const { coordinates, raw } = item;

        // Set flag to preserve the search result name during the subsequent map update
        isSearchSelection.current = true;

        // Update map search input
        setMapSearchValue(item.display || item.main);

        // Initialize with default values, clearing previous address fields
        let newDetails = {
            city: '',
            province: '',
            barangay: '',
            zip: '',
            district: '',
            detailedAddress: item.main || item.display,
            latitude: coordinates[0],
            longitude: coordinates[1]
        };

        if (item.address) {
            // Use standardized address from API
            const { city, province, barangay, zip, district, street } = item.address;

            newDetails.city = city || '';
            newDetails.province = province || '';
            newDetails.barangay = barangay || '';
            newDetails.zip = zip || '';
            newDetails.district = district || '';
            if (street) newDetails.detailedAddress = street; // Keep detailedAddress from search result if street is missing
        } else if (raw) {
            // Legacy mapping for Geoapify/Radar/Nominatim
            const city = raw.city || raw.municipality || raw.town || raw.village || raw.address?.city || raw.address?.town || raw.address?.village;
            const province = raw.state || raw.province || raw.address?.state || raw.address?.province;
            const barangay = raw.suburb || raw.neighbourhood || raw.village || raw.address?.suburb || raw.address?.neighbourhood || raw.address?.village;
            const zip = raw.postcode || raw.address?.postcode;
            const district = raw.state_district || raw.region || raw.address?.state_district;
            // const street = raw.street ... (not used here as we prefer item.main for detailedAddress initially)

            newDetails.city = city || '';
            newDetails.province = province || '';
            newDetails.barangay = barangay || '';
            newDetails.zip = zip || '';
            newDetails.district = district || '';
        }

        setFormData(prev => ({
            ...prev,
            ...newDetails
        }));
    };

    const handlePhonePartChange = (part, value) => {
        const currentCode = COUNTRY_CODES.find(c => formData.phone.startsWith(c.code))?.code || '+63';
        const currentNumber = formData.phone.startsWith(currentCode) ? formData.phone.slice(currentCode.length) : formData.phone;

        let newPhone = '';
        if (part === 'code') {
            newPhone = value + currentNumber;
        } else {
            // Format digits as nnn-nnn-nnnn
            const formatted = formatPhoneNumber(value);
            newPhone = currentCode + formatted;
        }

        setFormData(prev => ({ ...prev, phone: newPhone }));

        // Clear phone error if it exists and we're typing
        if (errors.phone) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.phone;
                return newErrors;
            });
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'password') {
            if (value && value.length < 8) {
                setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
                return;
            }
        }
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const getSchema = () => {
        const isStoreMode = mode === 'store';

        return z.object({
            name: z.string().optional(),
            firstName: !isStoreMode ? z.string().min(1, "First name is required") : z.string().optional(),
            lastName: !isStoreMode ? z.string().min(1, "Last name is required") : z.string().optional(),
            email: !isStoreMode ? z.string().email("Invalid email format").min(1, "Email is required") : z.string().optional(),
            phone: z.string().refine((val) => {
                const code = COUNTRY_CODES.find(c => val.startsWith(c.code))?.code || '+63';
                const numberPart = val.slice(code.length).replace(/\D/g, '');
                return numberPart.length === 10;
            }, "Phone number must be exactly 10 digits"),
            city: z.string().min(1, "City is required"),
            province: isStoreMode ? z.string().optional() : z.string().min(1, "Province is required"),
            zip: z.string().optional(),
            district: z.string().optional(),
            barangay: z.string().optional(),
            detailedAddress: z.string().min(1, "Street name, building, house no. is required"),
            password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal('')),
            label: z.string().optional(),
            isDefault: z.boolean().optional(),
        });
    };

    // Validate using Zod schema
    const validate = () => {
        const schema = getSchema();
        const result = schema.safeParse(formData);

        if (!result.success) {
            const newErrors = {};
            result.error.issues.forEach((issue) => {
                const fieldName = issue.path[0];
                newErrors[fieldName] = issue.message;
            });
            setErrors(newErrors);
            return false;
        }

        setErrors({});
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            // Ensure phone is in E.164 format (no hyphens or spaces) before saving
            const code = COUNTRY_CODES.find(c => formData.phone.startsWith(c.code))?.code || '+63';
            const digits = formData.phone.slice(code.length).replace(/\D/g, '');
            const cleanedPhone = code + digits;

            const finalName = mode === 'store' ? formData.name : `${formData.firstName.trim()} ${formData.lastName.trim()}`;

            onSave({ ...formData, name: finalName, phone: cleanedPhone });
        }
    };

    // Check if form is valid for real-time button state
    const isFormValid = () => {
        const schema = getSchema();
        return schema.safeParse(formData).success;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 md:gap-6 lg:gap-8 max-w-[1400px] mx-auto pb-4 lg:grid lg:grid-cols-2">
                {/* Contact Information Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit lg:col-start-1 lg:row-start-1">

                    <button
                        type="button"
                        onClick={() => toggleSection('contact')}
                        className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <User className="h-4 w-4 text-green-500" />
                            Contact Information
                        </h3>
                        {openSections.contact ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>

                    {openSections.contact && (
                        <div className="p-3 md:p-4 pt-0 border-t border-slate-50 mt-2 md:mt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {isStoreMode ? (
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">
                                            Store Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => handleChange('name', e.target.value)}
                                            placeholder="Stark Enterprise"
                                            className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.name ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm`}
                                        />
                                        {errors.name && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name}</p>}
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">
                                                First Name
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showFirstName ? "text" : "password"}
                                                    value={formData.firstName}
                                                    onChange={e => handleChange('firstName', e.target.value)}
                                                    placeholder="Natasha"
                                                    className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.firstName ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm pr-10`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowFirstName(!showFirstName)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showFirstName ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {errors.firstName && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.firstName}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">
                                                Last Name
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showLastName ? "text" : "password"}
                                                    value={formData.lastName}
                                                    onChange={e => handleChange('lastName', e.target.value)}
                                                    placeholder="Romanoff"
                                                    className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.lastName ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm pr-10`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLastName(!showLastName)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showLastName ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {errors.lastName && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.lastName}</p>}
                                        </div>
                                    </>
                                )}

                                <div className={isStoreMode ? "" : "md:col-span-2"}>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Phone Number</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={COUNTRY_CODES.find(c => formData.phone.startsWith(c.code))?.code || '+63'}
                                            onChange={(e) => handlePhonePartChange('code', e.target.value)}
                                            className="w-20 md:w-24 px-2 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 border-slate-50 focus:border-green-500 outline-none transition-all text-xs font-bold"
                                        >
                                            {COUNTRY_CODES.map(c => (
                                                <option key={c.code} value={c.code}>{c.code} {c.country}</option>
                                            ))}
                                        </select>
                                        <div className="relative flex-1">
                                            <input
                                                type="tel"
                                                maxLength={12}
                                                value={(() => {
                                                    const code = COUNTRY_CODES.find(c => formData.phone.startsWith(c.code))?.code || '+63';
                                                    return formData.phone.startsWith(code) ? formData.phone.slice(code.length) : formData.phone;
                                                })()}
                                                onChange={e => handlePhonePartChange('number', e.target.value)}
                                                placeholder="976-757-5467"
                                                className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.phone ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm`}
                                            />
                                        </div>
                                    </div>
                                    {errors.phone && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.phone}</p>}
                                </div>
                            </div>



                            {!isStoreMode && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <label htmlFor="email" className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Email Address</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={e => handleChange('email', e.target.value)}
                                            placeholder="natasha@starkindustries.com"
                                            className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.email ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm`}
                                        />
                                        {errors.email && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
                                        {!formData.email && !initialData.email && (
                                            <p className="text-[10px] text-amber-600 mt-1 ml-1 flex items-center gap-1">
                                                <Info className="h-3 w-3" /> Setup email for account recovery
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="password" title="password-label" className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Password</label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={e => handleChange('password', e.target.value)}
                                                placeholder={initialData.hasPassword ? "••••••••" : "Set a new password"}
                                                className={`w-full px-3 md:px-4 py-2.5 md:py-3 pr-10 md:pr-12 rounded-xl bg-slate-50 border-2 ${errors.password ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.password}</p>}
                                        {!formData.password && !initialData.hasPassword && (
                                            <p className="text-[10px] text-amber-600 mt-1 ml-1 flex items-center gap-1">
                                                <Info className="h-3 w-3" /> Setup password for email login
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Map Section (Mobile: 2nd, Desktop: Col 2) */}
                <div className="flex flex-col lg:col-start-2 lg:row-start-1 lg:row-span-3">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
                        <button
                            type="button"
                            onClick={() => toggleSection('map')}
                            className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Navigation className="h-4 w-4 text-green-500" />
                                Map Picker
                            </h3>
                            {openSections.map ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </button>

                        {openSections.map && (
                            <div className="p-3 md:p-4 pt-0 border-t border-slate-50 mt-2 md:mt-4 space-y-3 md:space-y-4 flex-1 flex flex-col">
                                {/* Search Bar */}
                                <div>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Search Address</label>
                                    <AddressAutocomplete
                                        onSelect={handleSearchSelect}
                                        initialValue={mapSearchValue || formData.detailedAddress}
                                    />
                                </div>

                                {/* Map Picker */}
                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1 flex justify-between items-center">
                                        <span>Pin Location</span>
                                        <span className="text-[9px] normal-case font-medium text-slate-400 flex items-center gap-1">
                                            <Info className="h-3 w-3" /> Move map to fine-tune pin
                                        </span>
                                    </label>
                                    <div className="h-[200px] md:h-[350px] lg:flex-1 lg:min-h-[300px] rounded-xl overflow-hidden border-2 border-slate-50 relative">
                                        <MapPicker
                                            initialCenter={[formData.latitude, formData.longitude]}
                                            onLocationChange={handleLocationChange}
                                            height="100%"
                                        />

                                        {/* Verification Badge overlay */}
                                        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-[9px] font-bold text-slate-700">Coordinates Verified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Address Details Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:col-start-1 lg:row-start-2 h-fit">
                    <button
                        type="button"
                        onClick={() => toggleSection('address')}
                        className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            Address Location
                        </h3>
                        {openSections.address ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>

                    {openSections.address && (
                        <div className="p-3 md:p-4 pt-0 border-t border-slate-50 mt-2 md:mt-4 space-y-3 md:space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                <div>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">City / Municipality</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={e => handleChange('city', e.target.value)}
                                        placeholder="Manila"
                                        className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.city ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm`}
                                    />
                                    {errors.city && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.city}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Barangay (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.barangay}
                                        onChange={e => handleChange('barangay', e.target.value)}
                                        placeholder="Barangay"
                                        className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.barangay ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm`}
                                    />
                                    {errors.barangay && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.barangay}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                <div>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Province / State</label>
                                    <input
                                        type="text"
                                        value={formData.province}
                                        onChange={e => handleChange('province', e.target.value)}
                                        placeholder="Metro Manila"
                                        className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.province ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm`}
                                    />
                                    {errors.province && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.province}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Zip Code</label>
                                    <input
                                        type="text"
                                        value={formData.zip}
                                        onChange={e => handleChange('zip', e.target.value)}
                                        placeholder="1000"
                                        className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.zip ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm`}
                                    />
                                    {errors.zip && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.zip}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Street Name, Building, House No.</label>
                                <input
                                    type="text"
                                    value={formData.detailedAddress}
                                    onChange={e => handleChange('detailedAddress', e.target.value)}
                                    placeholder="JG Plaza"
                                    className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-2 ${errors.detailedAddress ? 'border-red-200 focus:border-red-500' : 'border-slate-50 focus:border-green-500'} outline-none transition-all text-sm`}
                                />
                                {errors.detailedAddress && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.detailedAddress}</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:col-start-1 lg:row-start-3 h-fit">
                    <button
                        type="button"
                        onClick={() => toggleSection('settings')}
                        className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="h-4 w-4 text-green-500" />
                            Settings
                        </h3>
                        {openSections.settings ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>

                    {openSections.settings && (
                        <div className="p-3 md:p-4 pt-0 border-t border-slate-50 mt-2 md:mt-4 space-y-3 md:space-y-4">
                            <div>
                                <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Label As (Optional)</label>
                                <div className="flex gap-2">
                                    {['Home', 'Work', 'Other'].map(l => (
                                        <button
                                            key={l}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, label: l })}
                                            className={`px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-xs font-bold transition-all ${formData.label === l ? 'bg-green-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer py-1 md:py-2">
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isDefault}
                                        onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </div>
                                <span className="text-xs font-bold text-slate-600">Set as default address</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className={`flex gap-3 mt-4 pb-2 ${isProfileMode
                    ? 'w-full lg:col-start-2 lg:justify-end'
                    : 'w-full lg:col-span-2 lg:justify-end'}`}>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="py-3 px-10 rounded-xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all bg-white min-w-[140px]"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !isFormValid()}
                        className="py-3 px-10 rounded-xl bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all disabled:bg-green-300 disabled:shadow-none disabled:pointer-events-none flex items-center justify-center gap-2 min-w-[140px]"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isProfileMode ? 'Save' : 'Save Address')}
                    </button>
                </div>
            </div>
        </form >
    );
};

export default AddressFormManager;
