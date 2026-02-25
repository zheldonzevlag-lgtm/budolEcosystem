'use client'

import { useState, useEffect } from 'react'
import { PlayIcon, ClockIcon, AlertCircleIcon, CheckCircleIcon, PhilippinePesoIcon, ShieldCheckIcon, SaveIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function EscrowSettings() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [days, setDays] = useState(7)
    const [protectionDays, setProtectionDays] = useState(3)
    const [saving, setSaving] = useState(false)

    const fetchSettings = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch('/api/system/settings', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setProtectionDays(data.protectionWindowDays ?? 3)
            }
        } catch (error) {
            console.error('Failed to fetch escrow settings:', error)
        }
    }

    // Call fetchSettings on mount
    useEffect(() => {
        fetchSettings()
    }, [])

    const handleSaveSettings = async () => {
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
                body: JSON.stringify({ protectionWindowDays: protectionDays })
            })

            if (response.ok) {
                toast.success('Escrow protection updated')
            } else {
                toast.error('Failed to update escrow window')
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            toast.error('Network error')
        } finally {
            setSaving(false)
        }
    }

    const handleManualTrigger = async () => {
        if (!confirm(`Are you sure you want to process fund releases for orders older than ${days} days?`)) {
            return
        }

        setLoading(true)
        setResult(null)

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch('/api/cron/auto-complete-orders', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ days })
            })

            const data = await response.json()

            if (response.ok) {
                setResult({
                    success: true,
                    data: data.results,
                    message: `Processed orders older than ${days} days successfully`
                })
                toast.success('Fund release process completed')
            } else {
                setResult({
                    success: false,
                    error: data.message || data.error || 'Failed to process',
                    message: 'Process failed'
                })
                toast.error(data.error || 'Failed to process fund release')
            }

        } catch (error) {
            console.error('Error triggering escrow:', error)
            setResult({
                success: false,
                error: error.message,
                message: 'Network error occurred'
            })
            toast.error('Failed to connect to server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="text-slate-500 max-w-4xl mx-auto">
            <h1 className="text-2xl mb-8">Escrow <span className="text-slate-800 font-medium">Settings & Management</span></h1>

            {/* Escrow & Schedule Policy Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <ClockIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="font-semibold text-slate-800">Auto-Completion & Escrow Policy</h2>
                    </div>
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all
                            ${saving
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary-dark shadow-sm'}`}
                    >
                        {saving ? 'Saving...' : 'Save Policy'}
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Schedule Info */}
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-50 p-3 rounded-full shrink-0">
                            <ClockIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Execution Schedule</h3>
                            <p className="text-sm text-slate-500 mb-3">The systems runs automatically to process eligible orders.</p>
                            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-sm font-medium">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                Daily at Midnight (12:00 AM PHT)
                            </div>
                        </div>
                    </div>

                    {/* Window Config */}
                    <div className="flex items-start gap-4 pt-6 border-t border-slate-100">
                        <div className="bg-green-50 p-3 rounded-full shrink-0">
                            <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Escrow Holding Period</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Define the "Buyer Protection" window. Funds are held in escrow after delivery before status changes to <strong>COMPLETED</strong>.
                            </p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={protectionDays}
                                    onChange={(e) => setProtectionDays(parseInt(e.target.value) || 1)}
                                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center font-bold text-slate-700"
                                />
                                <span className="text-sm text-slate-600 font-medium whitespace-nowrap">days after delivery confirmation</span>
                            </div>
                            <div className="mt-4 bg-orange-50 border border-orange-100 p-3 rounded-lg flex gap-3">
                                <AlertCircleIcon className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-orange-700 leading-relaxed">
                                    The current protection window is <strong>{protectionDays} days</strong>. Industry standard is <strong>7 days</strong>, but <strong>3 days</strong> is common for faster seller payouts. This window allows buyers to inspect items.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Trigger Card */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-indigo-50 p-3 rounded-full">
                        <PhilippinePesoIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-medium text-slate-800 mb-1">Manual Fund Release</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Force the system to check and release funds for eligible orders immediately.
                        </p>

                        <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4 max-w-lg">
                            <label className="block text-xs font-semibold text-orange-800 mb-1 uppercase tracking-wide">
                                Development / Testing Mode
                            </label>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-orange-900">Process orders delivered more than</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={days}
                                    onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-center font-bold text-slate-700"
                                />
                                <span className="text-sm text-orange-900">days ago</span>
                            </div>
                            <p className="text-xs text-orange-700 mt-1 italic">
                                * The regular configured setting is <strong>{protectionDays} days</strong>. Set to 0 to release ALL delivered orders instantly.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <button
                                onClick={handleManualTrigger}
                                disabled={loading}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium transition-all
                                    ${loading
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                    }`}
                            >
                                {loading ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <PlayIcon size={18} />
                                        Process Funds Now
                                    </>
                                )}
                            </button>

                            {result && (
                                <span className={`flex items-center gap-2 text-sm px-3 py-1 rounded
                                    ${result.success ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                    {result.success ? <CheckCircleIcon size={16} /> : <AlertCircleIcon size={16} />}
                                    {result.message}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results Log */}
                {result && result.data && (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                        <h3 className="text-sm font-medium text-slate-700 mb-3">Last Run Results (Threshold: {days} days):</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 text-center">
                                <div className="text-xs text-slate-500 mb-1">Total Checked</div>
                                <div className="text-lg font-semibold text-slate-700">{result.data.total ?? result.data.totalOrders}</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded border border-green-100 text-center">
                                <div className="text-xs text-green-600 mb-1">Completed</div>
                                <div className="text-lg font-semibold text-green-700">{result.data.completed}</div>
                            </div>
                            <div className="p-3 bg-red-50 rounded border border-red-100 text-center">
                                <div className="text-xs text-red-600 mb-1">Failed</div>
                                <div className="text-lg font-semibold text-red-700">{result.data.failed}</div>
                            </div>
                        </div>

                        {result.data.errors && result.data.errors.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-medium text-red-600 mb-2">Errors:</p>
                                <div className="bg-red-50 p-3 rounded text-xs text-red-700 font-mono overflow-auto max-h-32">
                                    {result.data.errors.map((err, i) => (
                                        <div key={i} className="mb-1">
                                            Order #{err.orderId}: {err.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
