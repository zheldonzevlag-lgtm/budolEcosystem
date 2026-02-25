'use client'
import { useState, useEffect } from 'react'
import { SaveIcon, TruckIcon } from 'lucide-react'
import Loading from '@/components/Loading'
import toast from 'react-hot-toast'
import { useAuth } from "@/context/AuthContext"

export default function ShippingPage() {
    const { user, isLoading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState({
        type: 'FLAT',
        flatRate: 0,
        freeShippingThreshold: 0
    })

    useEffect(() => {
        fetchShippingProfile()
    }, [authLoading, user])

    const fetchShippingProfile = async () => {
        if (authLoading) return;
        
        try {
            if (!user) {
                setLoading(false)
                return
            }

            const res = await fetch('/api/store/shipping')
            if (res.ok) {
                const data = await res.json()
                if (data.shippingProfile && Object.keys(data.shippingProfile).length > 0) {
                    setProfile(data.shippingProfile)
                }
            }
        } catch (error) {
            console.error('Error fetching shipping profile:', error)
            toast.error('Failed to load shipping settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/store/shipping', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shippingProfile: profile })
            })

            if (res.ok) {
                toast.success('Shipping settings saved')
            } else {
                toast.error('Failed to save settings')
            }
        } catch (error) {
            console.error('Error saving shipping profile:', error)
            toast.error('An error occurred')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <TruckIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Shipping Settings</h1>
                    <p className="text-slate-500">Configure how your products are shipped</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Shipping Type</label>
                        <select
                            value={profile.type}
                            onChange={(e) => setProfile({ ...profile, type: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="FLAT">Flat Rate</option>
                            <option value="FREE">Free Shipping</option>
                            {/* Add more types later */}
                        </select>
                    </div>

                    {profile.type === 'FLAT' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Flat Rate Amount (₱)</label>
                            <input
                                type="number"
                                min="0"
                                value={profile.flatRate}
                                onChange={(e) => setProfile({ ...profile, flatRate: parseFloat(e.target.value) })}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Free Shipping Threshold (Optional)</label>
                        <p className="text-xs text-slate-500 mb-2">Orders above this amount will have free shipping.</p>
                        <input
                            type="number"
                            min="0"
                            value={profile.freeShippingThreshold || ''}
                            onChange={(e) => setProfile({ ...profile, freeShippingThreshold: parseFloat(e.target.value) })}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 1000"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <SaveIcon size={18} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
