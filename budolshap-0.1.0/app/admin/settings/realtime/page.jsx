'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Loading from '@/components/Loading'
import { Zap, Activity, Globe, Save, RefreshCw, ShieldCheck } from 'lucide-react'

export default function RealtimeUpdatesSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        provider: 'POLLING',
        pusherKey: '',
        pusherCluster: '',
        pusherAppId: '',
        pusherSecret: '',
        socketUrl: 'http://localhost:4000',
        swrPollingInterval: 10000,
    })

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        fetch('/api/system/realtime', {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setSettings({
                    provider: data.provider || 'POLLING',
                    pusherKey: data.pusherKey || '',
                    pusherCluster: data.pusherCluster || '',
                    pusherAppId: data.pusherAppId || '',
                    pusherSecret: data.pusherSecret || '',
                    socketUrl: data.socketUrl || 'http://localhost:4000',
                    swrPollingInterval: data.swrPollingInterval || 10000,
                })
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/system/realtime', {
                method: 'PUT',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    provider: settings.provider,
                    pusherKey: settings.pusherKey,
                    pusherCluster: settings.pusherCluster,
                    pusherAppId: settings.pusherAppId,
                    pusherSecret: settings.pusherSecret,
                    socketUrl: settings.socketUrl,
                    swrPollingInterval: parseInt(settings.swrPollingInterval),
                })
            })

            if (res.ok) {
                toast.success("Configuration saved successfully!")
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
        <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10 bg-[#f8fafc] min-h-screen">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Realtime Updates</h1>
                <p className="text-slate-500">Configure how the system handles live data synchronization and notifications.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-10">
                {/* UPDATE METHOD SELECTION */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-slate-800 uppercase tracking-wider text-sm">Update Method</h2>
                        <p className="text-sm text-slate-500">Choose how live data is synchronized with the dashboard</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* PUSHER */}
                        <div 
                            onClick={() => setSettings({...settings, provider: 'PUSHER'})}
                            className={`cursor-pointer relative p-6 rounded-xl border-2 transition-all duration-200 group ${
                                settings.provider === 'PUSHER' 
                                ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/10' 
                                : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                                settings.provider === 'PUSHER' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                            }`}>
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Pusher (Hosted, Paid)</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Third-party hosted service. Easy setup, but has usage limits and costs.</p>
                            {settings.provider === 'PUSHER' && (
                                <div className="absolute top-4 right-4 bg-blue-500 rounded-full p-1 shadow-sm">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        {/* SOCKET.IO */}
                        <div 
                            onClick={() => setSettings({...settings, provider: 'SOCKET_IO'})}
                            className={`cursor-pointer relative p-6 rounded-xl border-2 transition-all duration-200 group ${
                                settings.provider === 'SOCKET_IO' 
                                ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/10' 
                                : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                                settings.provider === 'SOCKET_IO' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                            }`}>
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Socket.io (Self-hosted)</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Run your own websocket server. Unlimited usage, requires server maintenance.</p>
                            {settings.provider === 'SOCKET_IO' && (
                                <div className="absolute top-4 right-4 bg-blue-500 rounded-full p-1 shadow-sm">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        {/* SWR POLLING */}
                        <div 
                            onClick={() => setSettings({...settings, provider: 'POLLING'})}
                            className={`cursor-pointer relative p-6 rounded-xl border-2 transition-all duration-200 group ${
                                settings.provider === 'POLLING' 
                                ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/10' 
                                : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                                settings.provider === 'POLLING' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                            }`}>
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">SWR Polling (Client-side)</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Simple client-side data fetching. Works anywhere, but higher server load.</p>
                            {settings.provider === 'POLLING' && (
                                <div className="absolute top-4 right-4 bg-blue-500 rounded-full p-1 shadow-sm">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DYNAMIC CONFIGURATION FORMS */}
                {settings.provider === 'PUSHER' && (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-sm">Pusher Configuration</h2>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Required</span>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">App ID</label>
                                <input 
                                    type="text"
                                    value={settings.pusherAppId}
                                    onChange={e => setSettings({...settings, pusherAppId: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. 123456"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Key</label>
                                    <input 
                                        type="text"
                                        value={settings.pusherKey}
                                        onChange={e => setSettings({...settings, pusherKey: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Enter Pusher Key"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cluster</label>
                                    <input 
                                        type="text"
                                        value={settings.pusherCluster}
                                        onChange={e => setSettings({...settings, pusherCluster: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="e.g. ap1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Secret</label>
                                <input 
                                    type="password"
                                    value={settings.pusherSecret}
                                    onChange={e => setSettings({...settings, pusherSecret: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="••••••••••••••••"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {settings.provider === 'SOCKET_IO' && (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-sm">Socket.io Configuration</h2>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Required</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Socket Server URL</label>
                            <input 
                                type="text"
                                value={settings.socketUrl}
                                onChange={e => setSettings({...settings, socketUrl: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="http://localhost:8080"
                            />
                            <p className="text-[10px] text-slate-400 font-medium mt-2 italic">The URL of your dedicated Socket.io microservice.</p>
                        </div>
                    </div>
                )}

                {settings.provider === 'POLLING' && (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-sm">SWR Polling Configuration</h2>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Optional</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Polling Interval (ms)</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="number"
                                    min="2000"
                                    max="60000"
                                    step="1000"
                                    value={settings.swrPollingInterval}
                                    onChange={e => setSettings({...settings, swrPollingInterval: e.target.value})}
                                    className="w-full md:w-48 bg-slate-50 border border-slate-100 rounded-lg p-4 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="10000"
                                />
                                <span className="text-sm text-slate-500 font-medium">milliseconds</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-2 italic">Minimum: 2000ms (2 seconds). Recommended: 10000ms (10 seconds).</p>
                        </div>
                    </div>
                )}

                {/* SAVE BUTTON */}
                <div className="flex flex-col items-center gap-4">
                    <button 
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto min-w-[320px] bg-slate-900 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                    >
                        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'SAVING...' : 'SAVE CONFIGURATION'}
                    </button>
                    <p className="text-xs text-slate-400 font-medium">Changes apply immediately to new connections.</p>
                </div>
            </form>
        </div>
    )
}
