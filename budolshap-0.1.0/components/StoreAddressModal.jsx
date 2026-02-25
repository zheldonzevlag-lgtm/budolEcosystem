'use client'

import { XIcon, MapPin, Navigation } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import AddressFormManager from "./address/AddressFormManager"
import { getUser } from "@/lib/auth-client"
import { normalizePhone } from "@/lib/utils/phone-utils"

const DEFAULT_DISTRICT_OPTION = ''
const DEFAULT_CITY_OPTION = ''
const PH_DISTRICTS = [
    'Region I - Ilocos Region',
    'Region II - Cagayan Valley',
    'Region III - Central Luzon',
    'Region IV-A - CALABARZON',
    'Region IV-B - MIMAROPA',
    'Region V - Bicol Region',
    'Region VI - Western Visayas',
    'Region VII - Central Visayas',
    'Region VIII - Eastern Visayas',
    'Region IX - Zamboanga Peninsula',
    'Region X - Northern Mindanao',
    'Region XI - Davao Region',
    'Region XII - SOCCSKSARGEN',
    'Region XIII - Caraga',
    'NCR - National Capital Region',
    'CAR - Cordillera Administrative Region',
    'BARMM - Bangsamoro Autonomous Region'
]

const DISTRICT_CITY_MAP = {
    'Region I - Ilocos Region': [
        { city: 'San Fernando City (La Union)', zip: '2500' },
        { city: 'Laoag City', zip: '2900' },
        { city: 'Dagupan City', zip: '2400' },
        { city: 'Vigan City', zip: '2700' },
    ],
    'Region II - Cagayan Valley': [
        { city: 'Tuguegarao City', zip: '3500' },
        { city: 'Ilagan City', zip: '3300' },
        { city: 'Cauayan City', zip: '3315' },
        { city: 'Santiago City', zip: '3311' },
    ],
    'Region III - Central Luzon': [
        { city: 'San Fernando City (Pampanga)', zip: '2000' },
        { city: 'Angeles City', zip: '2009' },
        { city: 'Olongapo City', zip: '2200' },
        { city: 'Balanga City', zip: '2100' },
    ],
    'Region IV-A - CALABARZON': [
        { city: 'Calamba City', zip: '4027' },
        { city: 'Antipolo City', zip: '1870' },
        { city: 'Dasmariñas City', zip: '4114' },
        { city: 'Lucena City', zip: '4301' },
    ],
    'Region IV-B - MIMAROPA': [
        { city: 'Puerto Princesa City', zip: '5300' },
        { city: 'Calapan City', zip: '5200' },
        { city: 'Boac', zip: '4900' },
        { city: 'Odiongan', zip: '5505' },
    ],
    'Region V - Bicol Region': [
        { city: 'Legazpi City', zip: '4500' },
        { city: 'Naga City', zip: '4400' },
        { city: 'Sorsogon City', zip: '4700' },
        { city: 'Masbate City', zip: '5400' },
    ],
    'Region VI - Western Visayas': [
        { city: 'Iloilo City', zip: '5000' },
        { city: 'Bacolod City', zip: '6100' },
        { city: 'Roxas City', zip: '5800' },
        { city: 'San Carlos City (Negros Occidental)', zip: '6127' },
    ],
    'Region VII - Central Visayas': [
        { city: 'Cebu City', zip: '6000' },
        { city: 'Lapu-Lapu City', zip: '6015' },
        { city: 'Mandaue City', zip: '6014' },
        { city: 'Tagbilaran City', zip: '6300' },
    ],
    'Region VIII - Eastern Visayas': [
        { city: 'Tacloban City', zip: '6500' },
        { city: 'Ormoc City', zip: '6541' },
        { city: 'Catbalogan City', zip: '6700' },
        { city: 'Borongan City', zip: '6800' },
    ],
    'Region IX - Zamboanga Peninsula': [
        { city: 'Zamboanga City', zip: '7000' },
        { city: 'Dipolog City', zip: '7100' },
        { city: 'Pagadian City', zip: '7016' },
        { city: 'Isabela City', zip: '7300' },
    ],
    'Region X - Northern Mindanao': [
        { city: 'Cagayan de Oro City', zip: '9000' },
        { city: 'Iligan City', zip: '9200' },
        { city: 'Malaybalay City', zip: '8700' },
        { city: 'Valencia City', zip: '8709' },
    ],
    'Region XI - Davao Region': [
        { city: 'Davao City', zip: '8000' },
        { city: 'Tagum City', zip: '8100' },
        { city: 'Panabo City', zip: '8105' },
        { city: 'Digos City', zip: '8002' },
    ],
    'Region XII - SOCCSKSARGEN': [
        { city: 'General Santos City', zip: '9500' },
        { city: 'Koronadal City', zip: '9506' },
        { city: 'Tacurong City', zip: '9800' },
        { city: 'Kidapawan City', zip: '9400' },
    ],
    'Region XIII - Caraga': [
        { city: 'Butuan City', zip: '8600' },
        { city: 'Surigao City', zip: '8400' },
        { city: 'Bayugan City', zip: '8502' },
        { city: 'Tandag City', zip: '8300' },
    ],
    'NCR - National Capital Region': [
        { city: 'Manila', zip: '1000' },
        { city: 'Quezon City', zip: '1100' },
        { city: 'Makati City', zip: '1200' },
        { city: 'Pasig City', zip: '1600' },
        { city: 'Taguig City', zip: '1630' },
        { city: 'Pasay City', zip: '1300' },
        { city: 'Mandaluyong City', zip: '1550' },
    ],
    'CAR - Cordillera Administrative Region': [
        { city: 'Baguio City', zip: '2600' },
        { city: 'Tabuk City', zip: '3800' },
        { city: 'Bangued', zip: '2800' },
        { city: 'La Trinidad', zip: '2601' },
    ],
    'BARMM - Bangsamoro Autonomous Region': [
        { city: 'Cotabato City', zip: '9600' },
        { city: 'Marawi City', zip: '9700' },
        { city: 'Jolo', zip: '7400' },
        { city: 'Buluan', zip: '9616' },
    ]
}

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

const CITY_BARANGAY_MAP = {
    'Manila': ['Intramuros', 'Binondo', 'Quiapo', 'Sampaloc', 'Malate', 'Ermita', 'Tondo', 'Santa Cruz'],
    'Quezon City': ['Bagumbayan', 'Commonwealth', 'Batasan Hills', 'Loyola Heights', 'Diliman', 'Cubao', 'Novaliches'],
    'Makati City': ['Poblacion', 'Bel-Air', 'San Lorenzo', 'Urdaneta', 'Dasmarinas', 'Magallanes'],
    'Taguig City': ['Fort Bonifacio', 'Pinagsama', 'Western Bicutan', 'Ususan', 'Lower Bicutan'],
    'Cebu City': ['Lahug', 'Mabolo', 'Guadalupe', 'Talamban', 'Banilad'],
    'Davao City': ['Poblacion', 'Buhangin', 'Talomo', 'Toril', 'Agdao'],
    'Pasig City': ['San Antonio', 'Kapitolyo', 'Ugong', 'Pineda'],
    'Mandaluyong City': ['Wack-Wack', 'Highway Hills', 'Plainview', 'Barangka'],
    'Pasay City': ['Barangay 76', 'Barangay 183', 'San Jose'],
    'Caloocan City': ['Barangay 1', 'Barangay 171'],
    'San Fernando City (La Union)': ['Barangay I', 'Barangay II', 'Sevilla', 'Lingsat'],
    'Baguio City': ['Session Road', 'Burnham Park', 'Mines View'],
}

const getCitiesForDistrict = (district) => {
    if (!district || district === DEFAULT_DISTRICT_OPTION) {
        return []
    }
    return DISTRICT_CITY_MAP[district] || []
}

const getDefaultDistrict = () => ''

const getDefaultCityForDistrict = (district) => {
    const cities = getCitiesForDistrict(district)
    return cities[0]?.city || ''
}

const getZipForCity = (district, city) => {
    if (!district || !city || district === DEFAULT_DISTRICT_OPTION || city === DEFAULT_CITY_OPTION) {
        return ''
    }
    const cities = getCitiesForDistrict(district)
    const match = cities.find(entry => entry.city === city)
    return match?.zip || ''
}

// Parse formatted address string back into structured components
// Format: "Detailed Address, Barangay, City, Province, Region, Zip, Country"
const parseFormattedAddress = (formattedAddress) => {
    if (!formattedAddress) return null

    const parts = formattedAddress.split(',').map(p => p.trim())
    if (parts.length < 4) return null // Need at least detailed address, barangay, city, region

    // Extract components (working backwards from the end)
    const country = parts[parts.length - 1] || 'Philippines'
    const zip = parts[parts.length - 2] || ''
    const district = parts[parts.length - 3] || '' // Region
    const province = parts.length > 6 ? parts[parts.length - 4] : '' // Province (optional)

    // City is either 4th from end (if province exists) or 3rd from end
    const cityIndex = parts.length > 6 ? parts.length - 5 : parts.length - 4
    const city = parts[cityIndex] || ''

    // Barangay is before city
    const barangay = parts[cityIndex - 1] || ''

    // Everything before barangay is detailed address
    const detailedAddress = parts.slice(0, cityIndex - 1).join(', ')

    return {
        district,
        province,
        city,
        barangay,
        detailedAddress,
        zip,
        country
    }
}

const emptyAddress = (initialData) => {
    // If initialData has structured address fields (from StoreAddress model), use them directly
    if (initialData?.district && initialData?.city) {
        return {
            name: initialData.name || '',
            email: initialData.email || '',
            phone: normalizePhone(initialData.phone || initialData.contact) || '',
            district: initialData.district || '',
            province: initialData.province || '',
            city: initialData.city || '',
            barangay: initialData.barangay || '',
            detailedAddress: initialData.detailedAddress || '',
            zip: initialData.zip || '',
            country: initialData.country || 'Philippines',
            notes: initialData.notes || '',
            isDefault: initialData.isDefault || false
        }
    }

    // Otherwise, try to parse formatted address string
    const parsedAddress = parseFormattedAddress(initialData?.address)

    return {
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: normalizePhone(initialData?.contact) || '',
        district: parsedAddress?.district || getDefaultDistrict(),
        province: parsedAddress?.province || '',
        city: parsedAddress?.city || getDefaultCityForDistrict(parsedAddress?.district || getDefaultDistrict()),
        barangay: parsedAddress?.barangay || '',
        detailedAddress: parsedAddress?.detailedAddress || '',
        zip: parsedAddress?.zip || '',
        country: parsedAddress?.country || 'Philippines',
        notes: '',
        isDefault: false
    }
}

const StoreAddressModal = ({ setShowAddressModal, onSave, initialData }) => {
    const [user, setUser] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        setUser(getUser())
        setIsLoaded(true)
    }, [])

    const handleSaveAddress = (formData) => {
        // Prepare the address object for onSave callback
        const finalAddress = {
            ...formData,
            // Match the backend's state/region mapping if needed
            state: formData.district || formData.province || '',
            // Ensure full address string for the existing 'address' field in some parts of the system
            fullAddress: [
                formData.detailedAddress,
                formData.barangay,
                formData.city,
                formData.district || formData.province,
                'Philippines'
            ].filter(Boolean).join(', ')
        }

        // Match the expected signature (formattedAddress, addressObj)
        onSave(finalAddress.fullAddress, finalAddress)
        setShowAddressModal(false)
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm min-h-screen flex items-center justify-center p-4 md:p-6">
            <div className="flex flex-col text-slate-700 w-full max-w-xl lg:max-w-6xl bg-white rounded-3xl shadow-2xl relative max-h-[90vh] md:max-h-[85vh] overflow-hidden">
                {/* Header - Fixed */}
                <div className="p-6 pb-2 relative border-b border-slate-50">
                    <button
                        type="button"
                        className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full z-20"
                        onClick={() => setShowAddressModal(false)}
                        aria-label="Close"
                    >
                        <XIcon size={20} />
                    </button>

                    <h2 className="text-xl font-extrabold text-slate-800">Store Pickup Address</h2>
                    <p className="text-xs text-slate-500 mt-1">Accurate location ensures Lalamove and other riders can find you easily.</p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
                    {isLoaded && (
                        <AddressFormManager
                            initialData={initialData ? {
                                name: initialData.name || user?.name || '',
                                phone: initialData.phone || initialData.contact || user?.phoneNumber || user?.phone || '',
                                district: initialData.state || initialData.district,
                                province: initialData.province,
                                city: initialData.city,
                                barangay: initialData.barangay,
                                detailedAddress: initialData.street || initialData.detailedAddress,
                                zip: initialData.zip,
                                latitude: initialData.latitude,
                                longitude: initialData.longitude,
                                notes: initialData.notes || '',
                                label: initialData.label || '',
                                country: initialData.country || 'Philippines',
                                isDefault: initialData.isDefault || false
                            } : {
                                name: user?.name || '',
                                phone: user?.phone || ''
                            }}
                            onSave={handleSaveAddress}
                            onCancel={() => setShowAddressModal(false)}
                            mode="store"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default StoreAddressModal
