'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Loading from '@/components/Loading'
import { Map, Search, Key, ShieldCheck } from 'lucide-react'

const MAP_PROVIDERS = [
    { id: 'OSM', name: 'OpenStreetMap', desc: 'Free & Community Driven' },
    { id: 'GEOAPIFY', name: 'Geoapify', desc: 'Powerful Autocomplete' },
    { id: 'GOOGLE_MAPS', name: 'Google Maps', desc: 'Premium & Global' },
    { id: 'RADAR', name: 'Radar', desc: 'Privacy Focused' }
]

export default function MapSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        mapProvider: 'OSM',
        enabledMapProviders: ['OSM'],
        googleMapsApiKey: '',
        geoapifyApiKey: '',
        radarApiKey: ''
    })

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        fetch('/api/system/settings', {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch settings');
                return res.json();
            })
            .then(data => {
                if (!isMounted) return;
                setSettings({
                    mapProvider: data.mapProvider || 'OSM',
                    enabledMapProviders: data.enabledMapProviders || ['OSM'],
                    googleMapsApiKey: data.googleMapsApiKey || '',
                    geoapifyApiKey: data.geoapifyApiKey || '',
                    radarApiKey: data.radarApiKey || ''
                })
                setLoading(false)
            })
            .catch(err => {
                if (!isMounted) return;
                console.error(err)
                toast.error("Failed to load settings")
                setLoading(false)
            })

        return () => {
            isMounted = false;
        };
    }, [])

    const toggleProvider = (providerId) => {
        const isEnabled = settings.enabledMapProviders.includes(providerId)
        
        if (isEnabled) {
            // Don't disable if it's the only one left OR if it's the active provider
            if (settings.enabledMapProviders.length === 1) {
                toast.error("At least one provider must be enabled.")
                return
            }
            if (settings.mapProvider === providerId) {
                toast.error("Cannot disable the active provider. Switch to another provider first.")
                return
            }
            setSettings(prev => ({
                ...prev,
                enabledMapProviders: prev.enabledMapProviders.filter(id => id !== providerId)
            }))
        } else {
            setSettings(prev => ({
                ...prev,
                enabledMapProviders: [...prev.enabledMapProviders, providerId]
            }))
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/system/settings', {
                method: 'PUT',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            })
            if (res.ok) {
                toast.success("Map settings saved successfully!")
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to save settings")
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <Map className="w-8 h-8 text-orange-600" />
                <h1 className="text-2xl font-bold text-slate-800">Map & Location Settings</h1>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Provider Selection */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Active Map Provider
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Choose which service will power the address autocomplete and interactive map across the platform.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {MAP_PROVIDERS.map((provider) => {
                            const isEnabled = settings.enabledMapProviders.includes(provider.id);
                            const isActive = settings.mapProvider === provider.id;
                            const canDisable = isEnabled && !isActive && settings.enabledMapProviders.length > 1;

                            return (
                                <div key={provider.id} className="flex flex-col gap-2">
                                    <label
                                        className={`
                                            relative flex flex-col p-4 cursor-pointer rounded-lg border-2 transition-all h-full
                                            ${isActive 
                                                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                                                : isEnabled 
                                                    ? 'border-slate-200 hover:border-slate-300 bg-white'
                                                    : 'border-slate-100 bg-slate-50 opacity-60 grayscale cursor-not-allowed'}
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name="mapProvider"
                                            value={provider.id}
                                            disabled={!isEnabled}
                                            checked={isActive}
                                            onChange={e => setSettings(prev => ({ ...prev, mapProvider: e.target.value }))}
                                            className="sr-only"
                                        />
                                        <span className="font-bold text-slate-800">{provider.name}</span>
                                        <span className="text-xs text-slate-500 mt-1">{provider.desc}</span>
                                        {isActive && (
                                            <div className="absolute top-2 right-2">
                                                <div className="bg-orange-500 rounded-full p-1">
                                                    <ShieldCheck className="w-3 h-3 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                    
                                    <button
                                        type="button"
                                        onClick={() => toggleProvider(provider.id)}
                                        disabled={isEnabled && !canDisable}
                                        className={`
                                            text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded border transition-colors
                                            ${isEnabled 
                                                ? canDisable
                                                    ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                                : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'}
                                        `}
                                    >
                                        {isEnabled ? 'Disable Provider' : 'Enable Provider'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* API Key Configuration */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        API Credentials
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Geoapify Key */}
                        <div className="p-4 rounded-lg border-2 transition-all border-slate-100 bg-white">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Geoapify API Key</label>
                            <input
                                type="text"
                                value={settings.geoapifyApiKey}
                                onChange={e => setSettings(prev => ({ ...prev, geoapifyApiKey: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="Enter Geoapify Key"
                            />
                            <p className="text-[10px] text-slate-400 mt-2">Required for Geoapify Autocomplete and Tiles.</p>
                        </div>

                        {/* Google Key */}
                        <div className="p-4 rounded-lg border-2 transition-all border-slate-100 bg-white">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Google Maps API Key</label>
                            <input
                                type="text"
                                value={settings.googleMapsApiKey}
                                onChange={e => setSettings(prev => ({ ...prev, googleMapsApiKey: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="Enter Google Maps Key"
                            />
                            <p className="text-[10px] text-slate-400 mt-2">Requires Places API and Maps JavaScript API enabled.</p>
                        </div>

                        {/* Radar Key */}
                        <div className="p-4 rounded-lg border-2 transition-all border-slate-100 bg-white">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Radar API Key</label>
                            <input
                                type="text"
                                value={settings.radarApiKey}
                                onChange={e => setSettings(prev => ({ ...prev, radarApiKey: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="Enter Radar Key"
                            />
                            <p className="text-[10px] text-slate-400 mt-2">Required for Radar Geocoding services.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`
                            w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white transition-all
                            ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200'}
                        `}
                    >
                        {saving ? 'Saving Changes...' : 'Save Configuration'}
                    </button>
                    <p className="text-xs text-slate-400">
                        * OpenStreetMap (OSM) does not require an API key for basic usage.
                    </p>
                </div>
            </form>
        </div>
    )
}
