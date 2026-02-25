'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Loading from '@/components/Loading'

export default function RateLimitingSettings() {
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({
        loginLimit: 10,
        registerLimit: 5
    })

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        fetch('/api/system/settings', {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setSettings({
                    loginLimit: data.loginLimit || 10,
                    registerLimit: data.registerLimit || 5
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
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const payload = {
                loginLimit: settings.loginLimit,
                registerLimit: settings.registerLimit
            }

            const res = await fetch('/api/system/settings', {
                method: 'PUT',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success("Rate limits updated!")
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to save settings")
            }
        } catch (err) {
            toast.error(err.message)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Rate Limiting (Protection)</h1>

            <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Authentication Thresholds</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                            <label className="block text-sm font-bold mb-2 text-slate-700">Login Endpoint</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={settings.loginLimit}
                                    onChange={e => setSettings({ ...settings, loginLimit: e.target.value })}
                                    className="w-24 border border-slate-300 rounded p-2 text-sm text-center font-medium"
                                />
                                <span className="text-sm text-slate-500">attempts / 15 mins</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Brute-force protection for admin and customer logins.</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                            <label className="block text-sm font-bold mb-2 text-slate-700">Registration Endpoint</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={settings.registerLimit}
                                    onChange={e => setSettings({ ...settings, registerLimit: e.target.value })}
                                    className="w-24 border border-slate-300 rounded p-2 text-sm text-center font-medium"
                                />
                                <span className="text-sm text-slate-500">attempts / 60 mins</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Spam account creation prevention.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-md hover:bg-slate-800 font-medium text-sm w-full md:w-auto transition-colors">
                        Save Rate Limits
                    </button>
                    <p className="text-xs text-slate-400 mt-2">
                        Updated limits take effect immediately for new request windows.
                    </p>
                </div>
            </form>
        </div>
    )
}
