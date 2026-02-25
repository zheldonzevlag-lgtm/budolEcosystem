'use client'
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Trash2 } from "lucide-react"
import { useSearch } from "@/context/SearchContext"
import { useRealtime } from "@/hooks/useRealtime"

export default function AdminStores() {
    const { searchQuery } = useSearch()
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)

    // Realtime Sync for Admin Dashboard
    useRealtime({
        channel: 'admin',
        event: 'store-status-updated',
        onData: (data) => {
            console.log('[Realtime] Store status update received in Stores list:', data);
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
            const url = searchQuery
                ? `/api/admin/stores?search=${encodeURIComponent(searchQuery)}`
                : '/api/admin/stores'
            const response = await fetch(url, {
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

    const toggleIsActive = async (storeId) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const store = stores.find(s => s.id === storeId)
            if (!store) return

            const response = await fetch(`/api/admin/stores/${storeId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    isActive: !store.isActive
                })
            })

            const data = await response.json()

            if (response.ok) {
                // Update local state
                setStores(stores.map(s =>
                    s.id === storeId ? { ...s, isActive: !s.isActive } : s
                ))
                toast.success('Store status updated')
            } else {
                toast.error(data.error || "Failed to update store status")
            }
        } catch (error) {
            console.error("Error toggling store status:", error)
            toast.error("Failed to update store status")
        }
    }

    const handleDeleteStore = async (storeId) => {
        if (!confirm('Are you sure you want to delete this store? This will also delete all products and orders associated with it. This action cannot be undone.')) {
            return
        }

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(`/api/admin/stores/${storeId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                toast.success('Store deleted successfully')
                setStores(stores.filter(s => s.id !== storeId))
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to delete store")
            }
        } catch (error) {
            console.error("Error deleting store:", error)
            toast.error("Failed to delete store")
        }
    }

    useEffect(() => {
        fetchStores()
    }, [searchQuery])

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Live <span className="text-slate-800 font-medium">Stores</span></h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                            {/* Store Info */}
                            <StoreInfo store={store} />

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm">Active</p>
                                    <label className="relative inline-flex items-center cursor-pointer text-gray-900">
                                        <input type="checkbox" className="sr-only peer" onChange={() => toggleIsActive(store.id)} checked={store.isActive} />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </div>

                                <button
                                    onClick={() => handleDeleteStore(store.id)}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition flex items-center gap-2"
                                    title="Delete Store"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No stores Available</h1>
                </div>
            )
            }
        </div>
    ) : <Loading />
}