'use client'

import { useState, useEffect } from 'react'
import { MegaphoneIcon, SaveIcon, RefreshCwIcon, CheckCircleIcon, AlertCircleIcon, ImageIcon, RocketIcon, LayersIcon, ShuffleIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

export default function MarketingAdsSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [files, setFiles] = useState([])
    const [settings, setSettings] = useState({
        marketingAdsEnabled: false,
        selectedMarketingAds: [],
        adDisplayMode: 'SEQUENCE',
        quickInstallerEnabled: true
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const [settingsRes, filesRes] = await Promise.all([
                fetch('/api/system/settings', {
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }),
                fetch('/api/admin/marketing-ads', {
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            ])

            const settingsData = await settingsRes.json()
            const filesData = await filesRes.json()

            if (settingsData) {
                setSettings({
                    marketingAdsEnabled: settingsData.marketingAdsEnabled || false,
                    selectedMarketingAds: settingsData.selectedMarketingAds || [],
                    adDisplayMode: settingsData.adDisplayMode || 'SEQUENCE',
                    quickInstallerEnabled: settingsData.quickInstallerEnabled !== undefined ? settingsData.quickInstallerEnabled : true
                })
            }

            if (filesData.files) {
                setFiles(filesData.files)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch('/api/system/settings', {
                method: 'PUT',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            })

            if (response.ok) {
                toast.success('Settings saved successfully')
            } else {
                toast.error('Failed to save settings')
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            toast.error('Network error')
        } finally {
            setSaving(false)
        }
    }

    const toggleAdSelection = (file) => {
        const current = [...settings.selectedMarketingAds]
        const index = current.indexOf(file)
        if (index > -1) {
            current.splice(index, 1)
        } else {
            current.push(file)
        }
        setSettings({ ...settings, selectedMarketingAds: current })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCwIcon className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="text-slate-500 max-w-4xl mx-auto p-4">
            <h1 className="text-2xl mb-8">Marketing <span className="text-slate-800 font-medium">Ads Management</span></h1>

            <div className="grid gap-6">
                {/* Configuration Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="bg-indigo-50 p-3 rounded-full">
                            <MegaphoneIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-medium text-slate-800 mb-1">General Settings</h2>
                            <p className="text-sm text-slate-500">Enable or disable marketing banners and popups across the platform.</p>
                        </div>
                    </div>

                    <div className="space-y-6 ml-14">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div>
                                    <p className="font-medium text-slate-700">Display Status</p>
                                    <p className="text-xs text-slate-500">Turn marketing popups on/off.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.marketingAdsEnabled}
                                        onChange={(e) => setSettings({ ...settings, marketingAdsEnabled: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                        <RocketIcon size={18} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-700">Quick Extension Installer</p>
                                        <p className="text-xs text-slate-500">Enable/disable popup installer.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.quickInstallerEnabled}
                                        onChange={(e) => setSettings({ ...settings, quickInstallerEnabled: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-4">Ad Display Mode</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setSettings({ ...settings, adDisplayMode: 'SEQUENCE' })}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${settings.adDisplayMode === 'SEQUENCE' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    <LayersIcon size={18} />
                                    Sequence
                                </button>
                                <button
                                    onClick={() => setSettings({ ...settings, adDisplayMode: 'RANDOM' })}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${settings.adDisplayMode === 'RANDOM' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    <ShuffleIcon size={18} />
                                    Random
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Select Marketing Ads (Multi-select)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                                {files.map((file) => (
                                    <div
                                        key={file}
                                        onClick={() => toggleAdSelection(file)}
                                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all border ${settings.selectedMarketingAds.includes(file) ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${settings.selectedMarketingAds.includes(file) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                                            {settings.selectedMarketingAds.includes(file) && <CheckCircleIcon size={12} />}
                                        </div>
                                        <span className="text-sm truncate">{file}</span>
                                    </div>
                                ))}
                                {files.length === 0 && (
                                    <p className="col-span-full text-center py-4 text-xs text-slate-400">No files found in public/marketing-ads/</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                        >
                            {saving ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                            Save Configuration
                        </button>
                    </div>
                </div>

                {/* Selected Ads Preview */}
                {settings.selectedMarketingAds.length > 0 && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                            <h2 className="text-lg font-medium text-slate-800">Preview ({settings.selectedMarketingAds.length} selected)</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {settings.selectedMarketingAds.map(ad => (
                                <div key={ad} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-square">
                                    <img
                                        src={`/marketing-ads/${ad}`}
                                        alt={ad}
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 backdrop-blur-sm">
                                        <p className="text-[10px] text-white truncate text-center">{ad}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
