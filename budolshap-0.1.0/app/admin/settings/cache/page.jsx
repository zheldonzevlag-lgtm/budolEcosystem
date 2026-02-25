'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Loading from '@/components/Loading'
import { Database, Zap, HardDrive } from 'lucide-react'

export default function CacheSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        provider: 'MEMORY',
        redisUrl: '',
        redisPassword: '',
    })
    const [status, setStatus] = useState({
        status: 'unknown',
        message: ''
    })

    useEffect(() => {
        fetchCacheSettings()
    }, [])

    const fetchCacheSettings = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            // Fetch current cache configuration from system settings
            const res = await fetch('/api/system/settings', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await res.json()
            
            setSettings({
                provider: data.cacheProvider || 'MEMORY',
                redisUrl: data.redisUrl || '',
                redisPassword: '' // Never show password
            })

            // Fetch cache status
            const statusRes = await fetch('/api/system/cache', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const statusData = await statusRes.json()
            setStatus(statusData)

            setLoading(false)
        } catch (err) {
            console.error(err)
            toast.error('Failed to load cache settings')
            setLoading(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const payload = {
                provider: settings.provider,
                redisUrl: settings.provider === 'REDIS' ? settings.redisUrl : null,
                redisPassword: settings.provider === 'REDIS' && settings.redisPassword 
                    ? settings.redisPassword 
                    : null
            }

            const res = await fetch('/api/system/cache', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (res.ok) {
                toast.success("Cache settings saved! Testing connection...")
                
                // Refresh status after save
                setTimeout(async () => {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                    const statusRes = await fetch('/api/system/cache', {
                        credentials: 'include',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    const statusData = await statusRes.json()
                    setStatus(statusData)
                    
                    if (statusData.status === 'connected' || statusData.status === 'active') {
                        toast.success("Cache system is working correctly!")
                    } else {
                        toast.error(`Cache system error: ${statusData.message}`)
                    }
                }, 1000)
            } else {
                toast.error(data.error || "Failed to save cache settings")
            }
        } catch (err) {
            toast.error(err.message || "Failed to save cache settings")
        } finally {
            setSaving(false)
        }
    }

    const testConnection = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/system/cache', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await res.json()
            setStatus(data)
            
            if (data.status === 'connected' || data.status === 'active') {
                toast.success(`Cache system is working: ${data.message}`)
            } else {
                toast.error(`Cache system error: ${data.message}`)
            }
        } catch (err) {
            toast.error('Failed to test cache connection')
        }
    }

    if (loading) return <Loading />

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Caching Systems</h1>

            {/* Status Card */}
            <div className={`mb-6 p-4 rounded-lg border ${
                status.status === 'connected' || status.status === 'active' 
                    ? 'bg-green-50 border-green-200' 
                    : status.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
            }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-slate-800">
                            Status: <span className={
                                status.status === 'connected' || status.status === 'active' 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                            }>
                                {status.status === 'connected' || status.status === 'active' ? 'Active' : 'Error'}
                            </span>
                        </p>
                        <p className="text-sm text-slate-600 mt-1">{status.message}</p>
                    </div>
                    <button
                        onClick={testConnection}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium text-slate-700 transition-colors"
                    >
                        Test Connection
                    </button>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-600">Cache Provider</label>
                    <div className="grid grid-cols-1 gap-3">
                        <select
                            value={settings.provider}
                            onChange={e => setSettings({ ...settings, provider: e.target.value })}
                            className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="MEMORY">💾 In-Memory Cache (Default, Free)</option>
                            <option value="REDIS">🔴 Redis (Distributed, Fast)</option>
                            <option value="VERCEL_EDGE">⚡ Vercel Edge Cache (CDN-Level, Fastest)</option>
                        </select>
                    </div>

                    <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-3 rounded space-y-1">
                        {settings.provider === 'MEMORY' && (
                            <div>
                                <p className="font-medium mb-1">In-Memory Cache:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Fastest for single-instance deployments</li>
                                    <li>No additional setup required</li>
                                    <li>Cache is lost on server restart</li>
                                    <li><strong>Best for:</strong> Development and small deployments</li>
                                </ul>
                            </div>
                        )}
                        {settings.provider === 'REDIS' && (
                            <div>
                                <p className="font-medium mb-1">Redis Cache:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Distributed cache shared across instances</li>
                                    <li>Persistent storage (survives restarts)</li>
                                    <li>Requires Redis server setup</li>
                                    <li><strong>Best for:</strong> Production with multiple server instances</li>
                                </ul>
                            </div>
                        )}
                        {settings.provider === 'VERCEL_EDGE' && (
                            <div>
                                <p className="font-medium mb-1">Vercel Edge Cache:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>CDN-level caching at the edge</li>
                                    <li>Fastest response times globally</li>
                                    <li>Automatic invalidation support</li>
                                    <li><strong>Best for:</strong> Vercel deployments with global traffic</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Redis Configuration */}
                {settings.provider === 'REDIS' && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                        <h3 className="font-medium text-slate-800 flex items-center gap-2">
                            <Database size={18} />
                            Redis Configuration
                        </h3>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-600">
                                Redis URL
                            </label>
                            <input
                                type="text"
                                value={settings.redisUrl}
                                onChange={e => setSettings({ ...settings, redisUrl: e.target.value })}
                                placeholder="redis://localhost:6379 or redis://user:pass@host:port"
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                Format: redis://[password@]host:port or redis://user:password@host:port
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-600">
                                Redis Password (Optional)
                            </label>
                            <input
                                type="password"
                                value={settings.redisPassword}
                                onChange={e => setSettings({ ...settings, redisPassword: e.target.value })}
                                placeholder="Leave empty if password is in URL"
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                Only enter if password is not included in Redis URL
                            </p>
                        </div>
                    </div>
                )}

                {/* Vercel Edge Cache Info */}
                {settings.provider === 'VERCEL_EDGE' && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 bg-blue-50 p-4 rounded border border-blue-200">
                        <h3 className="font-medium text-slate-800 flex items-center gap-2">
                            <Zap size={18} />
                            Vercel Edge Cache Information
                        </h3>
                        <div className="text-sm text-slate-600 space-y-2">
                            <p>
                                Vercel Edge Cache is automatically configured when deployed on Vercel.
                                No additional setup is required.
                            </p>
                            <p>
                                <strong>Note:</strong> This uses Next.js built-in caching mechanisms
                                and Vercel's edge network for optimal performance.
                            </p>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-md hover:bg-slate-800 font-medium text-sm w-full md:w-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Cache Settings'}
                    </button>
                    <p className="text-xs text-slate-400 mt-2">
                        Changes apply immediately. Existing cache will be cleared when switching providers.
                    </p>
                </div>
            </form>
        </div>
    )
}

