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
        quickInstallerEnabled: false,
        marketingAdConfigs: []
    })
    const [newGroup, setNewGroup] = useState({ title: '', subtitle: '', position: 'bottom_right', items: [], brandBar: [] })
    const positions = [
        { value: 'top_left', label: 'Top Left' },
        { value: 'top_center', label: 'Top Center' },
        { value: 'top_right', label: 'Top Right' },
        { value: 'bottom_left', label: 'Bottom Left' },
        { value: 'bottom_center', label: 'Bottom Center' },
        { value: 'bottom_right', label: 'Bottom Right' },
        { value: 'center', label: 'Fully Center' }
    ]

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
                    quickInstallerEnabled: settingsData.quickInstallerEnabled !== undefined ? settingsData.quickInstallerEnabled : true,
                    marketingAdConfigs: settingsData.marketingAdConfigs || []
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
                let errMsg = 'Failed to save settings'
                try {
                    const data = await response.json()
                    if (data?.error) errMsg = data.error
                } catch (_e) {}
                toast.error(errMsg)
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            const msg = error?.message || 'Network error'
            toast.error(msg)
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

                        <div className="pt-2 border-t border-slate-200">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Ad Configuration Group</label>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-semibold text-slate-600 mb-1">Text</p>
                                        <input
                                            type="text"
                                            value={newGroup.title}
                                            onChange={(e) => setNewGroup({ ...newGroup, title: e.target.value })}
                                            className="w-full p-2 border border-slate-200 rounded-lg mb-2"
                                            placeholder="Title"
                                        />
                                        <input
                                            type="text"
                                            value={newGroup.subtitle}
                                            onChange={(e) => setNewGroup({ ...newGroup, subtitle: e.target.value })}
                                            className="w-full p-2 border border-slate-200 rounded-lg"
                                            placeholder="Subtitle"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 mb-1">Position</p>
                                        <select
                                            value={newGroup.position}
                                            onChange={(e) => setNewGroup({ ...newGroup, position: e.target.value })}
                                            className="w-full p-2 border border-slate-200 rounded-lg"
                                        >
                                            {positions.map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-600 mb-2">Images</p>
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return
                                                const fd = new FormData()
                                                fd.append('file', file)
                                                fd.append('type', 'marketing')
                                                const res = await fetch('/api/upload', { method: 'POST', body: fd })
                                                const data = await res.json()
                                                if (data.url) setNewGroup({ ...newGroup, items: [...newGroup.items, { imageUrl: data.url }] })
                                            }}
                                            className="p-2 border border-slate-200 rounded-lg"
                                        />
                                        <input
                                            type="text"
                                            placeholder="or paste image URL"
                                            className="flex-1 p-2 border border-slate-200 rounded-lg"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const url = e.currentTarget.value.trim()
                                                    if (url) {
                                                        setNewGroup({ ...newGroup, items: [...newGroup.items, { imageUrl: url }] })
                                                        e.currentTarget.value = ''
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {newGroup.items.map((it, idx) => (
                                            <div key={idx} className="border border-slate-200 rounded-lg p-2 relative">
                                                <img src={it.imageUrl} alt="preview" className="w-full h-32 object-contain rounded bg-white" />
                                                <button
                                                    className="absolute top-1 right-1 text-xs bg-red-500 text-white px-2 py-1 rounded"
                                                    onClick={() => {
                                                        const items = [...newGroup.items]
                                                        items.splice(idx, 1)
                                                        setNewGroup({ ...newGroup, items })
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        {newGroup.items.length === 0 && (
                                            <div className="col-span-full text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg p-6">
                                                No images yet. Upload or paste URL to add.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200">
                                    <p className="text-xs font-semibold text-slate-600 mb-2">Branding Bar (icons and labels below subtitle)</p>
                                    <div className="flex items-center gap-2 mb-3">
                                        <select
                                            className="p-2 border border-slate-200 rounded-lg"
                                            id="brandIconSelect"
                                        >
                                            <option value="credit_card">Credit Card</option>
                                            <option value="truck">Truck</option>
                                            <option value="headset">Headset</option>
                                            <option value="loan">Loan</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Label (e.g., budolPay)"
                                            className="flex-1 p-2 border border-slate-200 rounded-lg"
                                            id="brandLabelInput"
                                        />
                                        <input
                                            type="color"
                                            defaultValue="#f97316"
                                            title="Text Color"
                                            className="p-2 border border-slate-200 rounded-lg h-10 w-14"
                                            id="brandColorInput"
                                        />
                                        <button
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg"
                                            onClick={() => {
                                                const iconEl = document.getElementById('brandIconSelect')
                                                const labelEl = document.getElementById('brandLabelInput')
                                                const colorEl = document.getElementById('brandColorInput')
                                                const icon = iconEl && 'value' in iconEl ? iconEl.value : 'credit_card'
                                                const label = labelEl && 'value' in labelEl ? labelEl.value.trim() : ''
                                                const color = colorEl && 'value' in colorEl ? colorEl.value : '#000000'
                                                if (!label) return
                                                setNewGroup({ ...newGroup, brandBar: [...newGroup.brandBar, { icon, label, color }] })
                                                if (labelEl && 'value' in labelEl) { labelEl.value = '' }
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {newGroup.brandBar.map((b, i) => (
                                            <div key={i} className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1">
                                                <span className="text-xs font-bold" style={{ color: b.color }}>{b.label}</span>
                                                <span className="text-[10px] text-slate-400">{b.icon}</span>
                                                <button
                                                    className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                                                    onClick={() => {
                                                        const bb = [...newGroup.brandBar]
                                                        bb.splice(i, 1)
                                                        setNewGroup({ ...newGroup, brandBar: bb })
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        {newGroup.brandBar.length === 0 && (
                                            <div className="text-xs text-slate-400">No branding items yet</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                                        onClick={() => {
                                            if (newGroup.items.length === 0) return
                                            const list = Array.isArray(settings.marketingAdConfigs) ? settings.marketingAdConfigs : []
                                            setSettings({ ...settings, marketingAdConfigs: [...list, newGroup] })
                                            setNewGroup({ title: '', subtitle: '', position: 'bottom_right', items: [], brandBar: [] })
                                        }}
                                    >
                                        Add Group
                                    </button>
                                </div>
                            </div>

                            {Array.isArray(settings.marketingAdConfigs) && settings.marketingAdConfigs.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {settings.marketingAdConfigs.map((conf, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded-lg p-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                {(conf.items || []).map((it, i) => (
                                                    <img key={i} src={it.imageUrl} alt="ad" className="w-full h-32 object-contain rounded bg-white" />
                                                ))}
                                            </div>
                                            <p className="text-sm font-bold mt-2">{conf.title || '—'}</p>
                                            <p className="text-xs text-slate-500">{conf.subtitle || '—'}</p>
                                            <p className="text-xs text-slate-400 mt-1">Position: {conf.position}</p>
                                            {Array.isArray(conf.brandBar) && conf.brandBar.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {conf.brandBar.map((b, i) => (
                                                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                            {b.label} ({b.icon})
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    className={`text-xs px-2 py-1 rounded ${conf.active ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                                                    onClick={() => {
                                                        const list = (settings.marketingAdConfigs || []).map((g, i) => ({
                                                            ...g,
                                                            active: i === idx
                                                        }))
                                                        setSettings({ ...settings, marketingAdConfigs: list })
                                                    }}
                                                >
                                                    {conf.active ? 'Active' : 'Set Active'}
                                                </button>
                                                <button
                                                    className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                                                    onClick={() => {
                                                        const list = [...settings.marketingAdConfigs]
                                                        list.splice(idx, 1)
                                                        setSettings({ ...settings, marketingAdConfigs: list })
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
