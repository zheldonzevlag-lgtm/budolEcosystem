'use client'
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useSearch } from "@/context/SearchContext"
import { useRealtime } from "@/hooks/useRealtime"

export default function AdminApprove() {
    const { searchQuery } = useSearch()
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)

    // Realtime Sync for Admin Dashboard
    useRealtime({
        channel: 'admin',
        event: 'store-status-updated',
        onData: (data) => {
            console.log('[Realtime] Store status update received:', data);
            setStores(prevStores =>
                prevStores.map(store =>
                    store.id === data.storeId
                        ? { ...store, ...data.store, verificationStatus: data.status, status: data.status.toLowerCase() }
                        : store
                )
            );
        }
    });

    const fetchStores = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const params = new URLSearchParams({
                verificationStatus: 'PENDING',
                search: searchQuery || ''
            })
            const response = await fetch(`/api/admin/stores?${params.toString()}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const storesData = await response.json()
                setStores(storesData)
            } else {
                setStores([])
            }
        } catch (error) {
            console.error("Error fetching stores:", error)
            setStores([])
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async ({ storeId, status }) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const verificationStatus = status.toUpperCase()
            const response = await fetch(`/api/admin/stores/${storeId}/verify`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    verificationStatus
                })
            })

            const data = await response.json()

            if (response.ok) {
                // Update local state reactively
                setStores(stores.map(store =>
                    store.id === storeId
                        ? {
                            ...store,
                            verificationStatus,
                            status: verificationStatus.toLowerCase(), // Sync legacy field
                            isActive: verificationStatus === 'APPROVED'
                        }
                        : store
                ))
                toast.success(`Store ${status} successfully`)
            } else {
                toast.error(data.error || "Failed to update store status")
            }
        } catch (error) {
            console.error("Error approving store:", error)
            toast.error("Failed to update store status")
        }
    }

    useEffect(() => {
        fetchStores()
    }, [searchQuery])

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Approve <span className="text-slate-800 font-medium">Stores</span></h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                            {/* Store Info */}
                            <StoreInfo store={store} />

                            {/* Actions */}
                            <div className="flex gap-3 pt-2 flex-wrap">
                                <button
                                    onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'approved' }), { loading: "approving" })}
                                    disabled={store.verificationStatus === 'APPROVED'}
                                    className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm ${store.verificationStatus === 'APPROVED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'rejected' }), { loading: 'rejecting' })}
                                    disabled={store.verificationStatus === 'REJECTED'}
                                    className={`px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 text-sm ${store.verificationStatus === 'REJECTED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}

                </div>) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No Application Pending</h1>
                </div>
            )}
        </div>
    ) : <Loading />
}