'use client'

import { useState, useEffect } from 'react'
import { XIcon, PlusIcon, MapPinIcon, TrashIcon, StarIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import StoreAddressModal from './StoreAddressModal'
import { getUser } from '@/lib/auth-client'

const StoreAddressesManager = ({ storeId, onClose, onSave }) => {
    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [editingAddress, setEditingAddress] = useState(null)

    useEffect(() => {
        fetchAddresses()
    }, [storeId])

    const fetchAddresses = async () => {
        try {
            const response = await fetch(`/api/stores/${storeId}/addresses?t=${new Date().getTime()}`, {
                cache: 'no-store',
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            })
            if (response.ok) {
                const data = await response.json()
                setAddresses(data)
            } else {
                toast.error('Failed to fetch addresses')
            }
        } catch (error) {
            console.error('Error fetching addresses:', error)
            toast.error('Failed to fetch addresses')
        } finally {
            setLoading(false)
        }
    }

    const handleAddAddress = () => {
        if (addresses.length >= 3) {
            toast.error('Maximum of 3 addresses allowed')
            return
        }
        const user = getUser()
        setEditingAddress({ name: user?.name || '' })
        setShowAddressModal(true)
    }

    const handleEditAddress = (address) => {
        setEditingAddress(address)
        setShowAddressModal(true)
    }

    const handleSaveAddress = async (formattedAddress, addressObj) => {
        try {
            if (editingAddress && editingAddress.id) {
                // Update existing address
                const response = await fetch(`/api/stores/${storeId}/addresses/${editingAddress.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(addressObj)
                })

                if (response.ok) {
                    toast.success('Address updated successfully')
                    fetchAddresses()
                    setShowAddressModal(false)
                    if (onSave) onSave()
                } else {
                    const data = await response.json()
                    toast.error(data.error || 'Failed to update address')
                }
            } else {
                // Create new address
                const response = await fetch(`/api/stores/${storeId}/addresses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(addressObj)
                })

                if (response.ok) {
                    toast.success('Address added successfully')
                    fetchAddresses()
                    setShowAddressModal(false)
                    if (onSave) onSave()
                } else {
                    const data = await response.json()
                    toast.error(data.error || 'Failed to add address')
                }
            }
        } catch (error) {
            console.error('Error saving address:', error)
            toast.error('Failed to save address')
        }
    }

    const handleDeleteAddress = async (addressId) => {
        if (!confirm('Are you sure you want to delete this address?')) {
            return
        }

        try {
            const response = await fetch(`/api/stores/${storeId}/addresses/${addressId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success('Address deleted successfully')
                fetchAddresses()
                if (onSave) onSave()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to delete address')
            }
        } catch (error) {
            console.error('Error deleting address:', error)
            toast.error('Failed to delete address')
        }
    }

    const handleSetDefault = async (addressId) => {
        try {
            const address = addresses.find(a => a.id === addressId)
            const response = await fetch(`/api/stores/${storeId}/addresses/${addressId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...address, isDefault: true })
            })

            if (response.ok) {
                toast.success('Default address updated')
                fetchAddresses()
                if (onSave) onSave()
            } else {
                toast.error('Failed to set default address')
            }
        } catch (error) {
            console.error('Error setting default address:', error)
            toast.error('Failed to set default address')
        }
    }

    const formatAddress = (addr) => {
        const parts = [
            addr.detailedAddress,
            addr.barangay,
            addr.city,
            addr.province,
            addr.district,
            addr.zip,
            addr.country
        ].filter(Boolean)
        return parts.join(', ')
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <>
            <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center px-4">
                <div className="flex flex-col gap-6 text-slate-700 w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
                    <button
                        type="button"
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
                        onClick={onClose}
                    >
                        <XIcon size={26} />
                    </button>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Store Addresses</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage up to 3 addresses for your store</p>
                    </div>

                    <div className="space-y-4">
                        {addresses.map((address) => (
                            <div
                                key={address.id}
                                className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition relative"
                            >
                                {address.isDefault && (
                                    <div className="absolute top-4 right-4">
                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                                            <StarIcon size={14} fill="currentColor" />
                                            Default
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 pr-24">
                                    <MapPinIcon className="text-slate-400 mt-1 flex-shrink-0" size={20} />
                                    <div className="flex-1">
                                        <p className="text-slate-700 text-sm mb-2">{formatAddress(address)}</p>
                                        <p className="text-slate-500 text-xs">Phone: {address.phone}</p>
                                        {address.notes && (
                                            <p className="text-slate-500 text-xs mt-1">Notes: {address.notes}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleEditAddress(address)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Edit
                                    </button>
                                    {!address.isDefault && (
                                        <>
                                            <span className="text-slate-300">|</span>
                                            <button
                                                onClick={() => handleSetDefault(address.id)}
                                                className="text-xs text-green-600 hover:text-green-700 font-medium"
                                            >
                                                Set as Default
                                            </button>
                                        </>
                                    )}
                                    {addresses.length > 1 && (
                                        <>
                                            <span className="text-slate-300">|</span>
                                            <button
                                                onClick={() => handleDeleteAddress(address.id)}
                                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {addresses.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <MapPinIcon className="mx-auto mb-3" size={48} />
                                <p>No addresses yet</p>
                                <p className="text-sm">Add your first store address</p>
                            </div>
                        )}

                        {addresses.length < 3 && (
                            <button
                                onClick={handleAddAddress}
                                className="w-full border border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition"
                            >
                                <PlusIcon size={20} />
                                <span>Add New Address ({addresses.length}/3)</span>
                            </button>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-900 text-white text-base font-medium py-3 rounded-xl hover:bg-slate-800 active:scale-[0.99] transition-all shadow-lg shadow-slate-200"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            {showAddressModal && (
                <StoreAddressModal
                    setShowAddressModal={setShowAddressModal}
                    onSave={handleSaveAddress}
                    initialData={editingAddress || {}}
                />
            )}
        </>
    )
}

export default StoreAddressesManager
