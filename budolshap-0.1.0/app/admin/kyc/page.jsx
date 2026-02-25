'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Loading from '@/components/Loading'
import { CheckCircle, XCircle, Clock, User, ShieldCheck, Eye, Search, Filter, AlertCircle } from 'lucide-react'
import { useSearch } from '@/context/SearchContext'
import { formatManilaTime } from '@/lib/dateUtils'

export default function KYCApprovalPage() {
    const { searchQuery } = useSearch()
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState(null)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [selectedApp, setSelectedApp] = useState(null)
    const { user, role } = useAuth()
    const router = useRouter()

    // Permissions check
    const canApprove = ['ADMIN', 'MANAGER', 'LEAD'].includes(role)

    useEffect(() => {
        if (!user || !canApprove) {
            router.push('/admin/dashboard')
            return
        }
        fetchApplications()
    }, [user, role, searchQuery, statusFilter])

    const fetchApplications = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter) params.append('status', statusFilter)

            const res = await fetch(`/api/admin/kyc?${params.toString()}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const data = await res.json()

            if (res.ok) {
                setApplications(data)
            } else {
                toast.error(data.error || 'Failed to fetch KYC applications')
            }
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Failed to fetch KYC applications')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (userId, status, reason = '') => {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this application?`)) return

        setProcessingId(userId)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/admin/kyc', {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userId, status, reason }),
            })
            const data = await res.json()

            if (res.ok) {
                toast.success(`KYC application ${status.toLowerCase()} successfully`)
                fetchApplications()
                setSelectedApp(null)
            } else {
                toast.error(data.error || 'Failed to process application')
            }
        } catch (error) {
            toast.error('Failed to process application')
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                        KYC Submission & Approval
                    </h1>
                    <p className="text-gray-500">Manage and verify user identity submissions for compliance.</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        className="p-2 border rounded-lg bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Applications</option>
                        <option value="PENDING">Pending Approval</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">User</th>
                            <th className="p-4 font-semibold text-gray-600">Contact</th>
                            <th className="p-4 font-semibold text-gray-600">Tier</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Submitted</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No KYC applications found for this filter.
                                </td>
                            </tr>
                        ) : (
                            applications.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{app.name}</div>
                                                <div className="text-xs text-gray-400">{app.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm">{app.email}</div>
                                        <div className="text-xs text-gray-500">{app.phoneNumber || 'No phone'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium uppercase">
                                            {app.kycDetails?.tier || 'Individual'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1">
                                            {app.kycStatus === 'PENDING' && <Clock className="w-4 h-4 text-amber-500" />}
                                            {app.kycStatus === 'VERIFIED' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                            {app.kycStatus === 'REJECTED' && <XCircle className="w-4 h-4 text-rose-500" />}
                                            <span className={`text-sm font-medium ${
                                                app.kycStatus === 'VERIFIED' ? 'text-emerald-600' : 
                                                app.kycStatus === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'
                                            }`}>
                                                {app.kycStatus}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {formatManilaTime(app.updatedAt)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => setSelectedApp(app)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Application Detail Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Search className="w-6 h-6 text-blue-600" />
                                Review KYC Application: {selectedApp.name}
                            </h2>
                            <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-8 h-8" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* User Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
                                        <User className="w-4 h-4" /> Personal Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-gray-500">Full Name:</span>
                                        <span className="font-medium">{selectedApp.name}</span>
                                        <span className="text-gray-500">Email:</span>
                                        <span className="font-medium">{selectedApp.email}</span>
                                        <span className="text-gray-500">Phone:</span>
                                        <span className="font-medium">{selectedApp.phoneNumber || 'N/A'}</span>
                                        <span className="text-gray-500">Tier:</span>
                                        <span className="font-medium uppercase">{selectedApp.kycDetails?.tier || 'Individual'}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
                                        <AlertCircle className="w-4 h-4" /> OCR Extracted Data
                                    </h3>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <span className="text-gray-600">Extracted Name:</span>
                                            <span className="font-medium">{selectedApp.kycDetails?.ocrData?.fullName || 'Not extracted'}</span>
                                            <span className="text-gray-600">ID Number:</span>
                                            <span className="font-medium">{selectedApp.kycDetails?.ocrData?.idNumber || 'Not extracted'}</span>
                                            <span className="text-gray-600">Birthdate:</span>
                                            <span className="font-medium">{selectedApp.kycDetails?.ocrData?.birthDate || 'Not extracted'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Documents Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
                                    <Eye className="w-4 h-4" /> Submitted Documents
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* ID Document */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">ID Document</p>
                                        <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border shadow-inner">
                                            {selectedApp.kycDetails?.idDocument ? (
                                                <Image 
                                                    src={selectedApp.kycDetails.idDocument} 
                                                    alt="ID Document" 
                                                    fill 
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400">No image available</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Selfie / Liveness */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Selfie / Liveness</p>
                                        <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border shadow-inner">
                                            {selectedApp.kycDetails?.selfie ? (
                                                <Image 
                                                    src={selectedApp.kycDetails.selfie} 
                                                    alt="Selfie" 
                                                    fill 
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400">No image available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer / Actions */}
                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center rounded-b-2xl">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAction(selectedApp.id, 'VERIFIED')}
                                    disabled={processingId === selectedApp.id || selectedApp.kycStatus === 'VERIFIED'}
                                    className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all ${
                                        selectedApp.kycStatus === 'VERIFIED' 
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                                    }`}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {processingId === selectedApp.id ? 'Processing...' : 'Approve Application'}
                                </button>
                                <button
                                    onClick={() => {
                                        const reason = prompt('Reason for rejection:');
                                        if (reason) handleAction(selectedApp.id, 'REJECTED', reason);
                                    }}
                                    disabled={processingId === selectedApp.id || selectedApp.kycStatus === 'REJECTED'}
                                    className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all ${
                                        selectedApp.kycStatus === 'REJECTED' 
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                        : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95'
                                    }`}
                                >
                                    <XCircle className="w-5 h-5" />
                                    Reject Application
                                </button>
                            </div>
                            <div className="text-xs text-gray-400">
                                Status: <span className="font-bold">{selectedApp.kycStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
