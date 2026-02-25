'use client'

import { useState, useEffect } from 'react'
import { SaveIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, PowerIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminCancellationSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        orderCancellationEnabled: true,
        orderCancellationHours: 48
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/system/settings')
            if (response.ok) {
                const data = await response.json()
                setSettings({
                    orderCancellationEnabled: data.orderCancellationEnabled ?? true,
                    orderCancellationHours: data.orderCancellationHours ?? 48
                })
            }
        } catch (error) {
            console.error('Failed to fetch cancellation settings:', error)
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/system/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (response.ok) {
                toast.success('Settings updated successfully')
            } else {
                toast.error('Failed to update settings')
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            toast.error('Network error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-2 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-medium text-slate-800">Unpaid Order Cancellation</h2>
            </div>

            <div className="space-y-6">
                {/* Toggle Switch */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${settings.orderCancellationEnabled ? 'bg-green-100' : 'bg-slate-200'}`}>
                            <PowerIcon className={`w-4 h-4 ${settings.orderCancellationEnabled ? 'text-green-600' : 'text-slate-500'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Automated Cancellation</p>
                            <p className="text-xs text-slate-500">Enable or disable automatic voiding of unpaid orders</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, orderCancellationEnabled: !prev.orderCancellationEnabled }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none 
                            ${settings.orderCancellationEnabled ? 'bg-primary' : 'bg-slate-300'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${settings.orderCancellationEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

                {/* Threshold Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 block">
                        Cancellation Threshold (Hours)
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="1"
                            max="720"
                            value={settings.orderCancellationHours}
                            onChange={(e) => setSettings(prev => ({ ...prev, orderCancellationHours: parseInt(e.target.value) || 1 }))}
                            className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-700 font-medium"
                        />
                        <span className="text-sm text-slate-500 font-medium">hours</span>
                    </div>
                    <p className="text-xs text-slate-400 italic">
                        * Standard market practice (e.g., BudolShap) is 48 hours for QRPH and online payments.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                    <AlertCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Orders in <strong>ORDER_PLACED</strong> status that exceed this threshold will be automatically marked as <strong>CANCELLED</strong> due to payment timeout. This helps free up inventory for other customers.
                    </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold transition-all shadow-lg
                            ${saving
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-primary-dark shadow-primary/20'}`}
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <SaveIcon size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
