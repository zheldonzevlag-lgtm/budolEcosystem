'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Loading from '@/components/Loading'
import { CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { useSearch } from '@/context/SearchContext'

export default function MembershipApplicationsPage() {
    const { searchQuery } = useSearch()
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState(null)
    const { user, role } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!user || role !== 'ADMIN') {
            router.push('/')
            return
        }
        fetchApplications()
    }, [user, role, searchQuery])

    const fetchApplications = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)
            
            const res = await fetch(`/api/admin/memberships?${params.toString()}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const data = await res.json()

            if (res.ok) {
                setApplications(data.applications)
            } else {
                toast.error(data.error || 'Failed to fetch applications')
            }
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Failed to fetch applications')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (userId, type, action) => {
        setProcessingId(`${userId}-${type}`)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/admin/memberships', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userId, type, action }),
            })
            const data = await res.json()

            if (res.ok) {
                toast.success(data.message)
                fetchApplications() // Refresh the list
            } else {
                toast.error(data.error || 'Failed to process application')
            }
        } catch (error) {
            toast.error('Failed to process application')
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return <Loading />
    }

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Membership Applications</h1>
                    <p className="text-slate-600 mt-2">Review and approve membership requests</p>
                </div>

                {applications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Clock className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Pending Applications</h3>
                        <p className="text-slate-500">There are no membership applications waiting for approval.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div key={app.id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        {app.image ? (
                                            <Image
                                                src={app.image}
                                                alt={app.name}
                                                width={64}
                                                height={64}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                                                <User className="h-8 w-8 text-slate-400" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-800">{app.name}</h3>
                                        <p className="text-slate-600 text-sm">{app.email}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Applied: {formatManilaTime(app.updatedAt, { dateStyle: 'short' })}
                                        </p>

                                        <div className="mt-4 space-y-3">
                                            {/* Plus Membership */}
                                            {app.membershipStatus === 'PENDING' && (
                                                <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                                                    <div>
                                                        <p className="font-semibold text-green-800">Plus Membership</p>
                                                        <p className="text-sm text-green-600">Pending approval</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAction(app.id, 'plus', 'approve')}
                                                            disabled={processingId === `${app.id}-plus`}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                                                        >
                                                            <CheckCircle size={18} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(app.id, 'plus', 'reject')}
                                                            disabled={processingId === `${app.id}-plus`}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                                                        >
                                                            <XCircle size={18} />
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Coop Membership */}
                                            {app.coopMembershipStatus === 'PENDING' && (
                                                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                                                    <div>
                                                        <p className="font-semibold text-blue-800">Coop Membership</p>
                                                        <p className="text-sm text-blue-600">Pending approval</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAction(app.id, 'coop', 'approve')}
                                                            disabled={processingId === `${app.id}-coop`}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                                                        >
                                                            <CheckCircle size={18} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(app.id, 'coop', 'reject')}
                                                            disabled={processingId === `${app.id}-coop`}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                                                        >
                                                            <XCircle size={18} />
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
