'use client'
import { useState, useEffect } from 'react'
import { TicketIcon, PlusIcon, TrashIcon } from 'lucide-react'
import Loading from '@/components/Loading'
import toast from 'react-hot-toast'
import { useAuth } from "@/context/AuthContext"

export default function CouponsPage() {
    const { user, isLoading: authLoading } = useAuth()
    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount: '',
        expiresAt: '',
        isPublic: true
    })

    useEffect(() => {
        fetchCoupons()
    }, [authLoading, user])

    const fetchCoupons = async () => {
        if (authLoading) return;
        
        try {
            if (!user) {
                setLoading(false)
                return
            }

            const res = await fetch('/api/store/coupons')
            if (res.ok) {
                const data = await res.json()
                setCoupons(data)
            }
        } catch (error) {
            console.error('Error fetching coupons:', error)
            toast.error('Failed to load coupons')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/store/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success('Coupon created successfully')
                setShowCreate(false)
                setFormData({ code: '', description: '', discount: '', expiresAt: '', isPublic: true })
                fetchCoupons()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to create coupon')
            }
        } catch (error) {
            console.error('Error creating coupon:', error)
            toast.error('An error occurred')
        }
    }

    if (loading) return <Loading />

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <TicketIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Coupons</h1>
                        <p className="text-slate-500">Manage your store coupons</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                    <PlusIcon size={18} />
                    Create Coupon
                </button>
            </div>

            {showCreate && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-semibold mb-4">New Coupon</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-purple-500"
                                placeholder="e.g. SUMMERSALE"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="100"
                                value={formData.discount}
                                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                type="text"
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expires At</label>
                            <input
                                type="date"
                                required
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="isPublic"
                                checked={formData.isPublic}
                                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="isPublic" className="text-sm text-slate-700">Public (Visible in store)</label>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Create Coupon
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-sm uppercase">
                        <tr>
                            <th className="p-4">Code</th>
                            <th className="p-4">Discount</th>
                            <th className="p-4">Expires</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Usage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {coupons.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-500">No coupons found</td>
                            </tr>
                        ) : (
                            coupons.map((coupon) => (
                                <tr key={coupon.code} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium">{coupon.code}</td>
                                    <td className="p-4">{coupon.discount}%</td>
                                    <td className="p-4">{formatManilaTime(coupon.expiresAt, { dateStyle: 'short' })}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${new Date(coupon.expiresAt) > getNowUTC() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {new Date(coupon.expiresAt) > getNowUTC() ? 'Active' : 'Expired'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500">
                                        {/* Placeholder for usage count if we track it */}
                                        -
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
