'use client'
import { useState, useEffect } from 'react'
import { PhilippinePesoIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatManilaTime } from "@/lib/dateUtils"
import { useSearch } from '@/context/SearchContext'

export default function AdminPayoutsPage() {
    const { searchQuery } = useSearch()
    const [payouts, setPayouts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')

    useEffect(() => {
        fetchPayouts()
    }, [filter, searchQuery])

    const fetchPayouts = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const params = new URLSearchParams()
            if (filter !== 'ALL') params.append('status', filter)
            if (searchQuery) params.append('search', searchQuery)
            
            const res = await fetch(`/api/admin/payouts?${params.toString()}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                setPayouts(data)
            } else {
                const data = await res.json()
                toast.error(data.details || data.error || 'Failed to load payouts')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load payouts')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (payoutId, status) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/admin/payouts', {
                method: 'PUT',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payoutId, status })
            })

            if (res.ok) {
                toast.success(`Payout ${status.toLowerCase()}`)
                fetchPayouts()
            } else {
                toast.error('Failed to update payout')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to update payout')
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <PhilippinePesoIcon className="w-8 h-8 text-emerald-500" />
                    <h1 className="text-3xl font-bold">Payout Requests</h1>
                </div>
                <div className="flex gap-2">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg transition ${filter === status
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {payouts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <PhilippinePesoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No payout requests</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {payouts.map((payout) => (
                                <tr key={payout.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium">{payout.store.name}</p>
                                            <p className="text-sm text-gray-500">{payout.store.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium">{payout.store.user.name}</p>
                                            <p className="text-sm text-gray-500">{payout.store.user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-lg">₱{payout.amount.toFixed(2)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${payout.status === 'PENDING'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : payout.status === 'APPROVED'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {payout.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {formatManilaTime(payout.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {payout.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(payout.id, 'APPROVED')}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                                    title="Approve"
                                                >
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(payout.id, 'REJECTED')}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                    title="Reject"
                                                >
                                                    <XCircleIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
