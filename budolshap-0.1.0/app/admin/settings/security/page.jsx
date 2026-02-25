'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Loading from '@/components/Loading'

export default function SecuritySettings() {
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({
        sessionTimeout: 15,
        sessionWarning: 1
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
                    sessionTimeout: data.sessionTimeout || 15,
                    sessionWarning: data.sessionWarning || 1
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
                sessionTimeout: settings.sessionTimeout,
                sessionWarning: settings.sessionWarning
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
                toast.success("Security settings saved!")
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
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Security Settings</h1>

            <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Idle Session Timeout</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-600">Timeout Duration (Minutes)</label>
                            <input
                                type="number"
                                min="1"
                                value={settings.sessionTimeout}
                                onChange={e => setSettings({ ...settings, sessionTimeout: e.target.value })}
                                className="w-full border border-slate-300 rounded p-2 text-sm"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Users will be logged out after this many minutes of inactivity.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-600">Warning Threshold (Minutes)</label>
                            <input
                                type="number"
                                min="1"
                                max={settings.sessionTimeout - 1}
                                value={settings.sessionWarning}
                                onChange={e => setSettings({ ...settings, sessionWarning: e.target.value })}
                                className="w-full border border-slate-300 rounded p-2 text-sm"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Warning modal appears this long before logout.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-md hover:bg-slate-800 font-medium text-sm w-full md:w-auto transition-colors">
                        Save Security Settings
                    </button>
                    <p className="text-xs text-slate-400 mt-2">
                        Changes apply immediately for active sessions upon page refresh.
                    </p>
                </div>
            </form>
        </div>
    )
}
