'use client'

import { XIcon, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { getUser } from "@/lib/auth-client"
import AddressFormManager from "./address/AddressFormManager"

const AddressModal = ({ setShowAddressModal, onAddressesAdded, mode = 'address' }) => {

    const [userMeta, setUserMeta] = useState({ id: null, name: '', email: '', phone: '', address: null, hasPassword: false, kycStatus: 'UNVERIFIED' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingUser, setIsLoadingUser] = useState(true)

    const isProfileMode = mode === 'profile'

    useEffect(() => {
        const loadUser = async () => {
            const localUser = getUser()

            if (!localUser) {
                toast.error("Please login first")
                setShowAddressModal(false)
                return
            }

            try {
                const response = await fetch(`/api/users?id=${localUser.id}`)
                if (!response.ok) {
                    throw new Error("Unable to fetch user profile")
                }
                const dbUser = await response.json()
                const name = dbUser?.name || localUser.name || ''
                const email = dbUser?.email || localUser.email || ''
                const phone = dbUser?.phoneNumber || localUser.phone || ''
                // Security: Never send the hashed password to the client
                const hasPassword = !!dbUser?.password && dbUser.password !== 'NO_PASSWORD_SET'
                const kycStatus = dbUser?.kycStatus || 'UNVERIFIED'
                
                // Get extended name fields from metadata if available
                const firstName = dbUser?.metadata?.firstName || ''
                const lastName = dbUser?.metadata?.lastName || ''
                
                // Get the first address if it exists
                const userAddress = dbUser?.Address?.[0] || null
                
                setUserMeta({ id: localUser.id, name, email, phone, address: userAddress, hasPassword, kycStatus, firstName, lastName })
            } catch (error) {
                console.error("Error loading user info:", error)
                const nameFallback = localUser.name || ''
                const emailFallback = localUser.email || ''
                const phoneFallback = localUser.phone || ''
                setUserMeta({ id: localUser.id, name: nameFallback, email: emailFallback, phone: phoneFallback, address: null, hasPassword: false })
                toast.error(error.message || "Failed to load user info")
            } finally {
                setIsLoadingUser(false)
            }
        }

        loadUser()
    }, [setShowAddressModal])

    const handleSaveProfile = async (formData) => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userMeta.id,
                    name: formData.name.trim(),
                    // Pass explicit split names for metadata storage
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phone,
                    email: formData.email.trim(),
                    // Only send password if it is provided (user wants to change it)
                    password: formData.password || undefined,
                    address: {
                        city: formData.city,
                        barangay: formData.barangay,
                        detailedAddress: formData.detailedAddress,
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                        zip: formData.zip,
                        state: formData.province || formData.district || '',
                        notes: formData.notes,
                        isDefault: true,
                        label: formData.label
                    }
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to save profile")
            }

            toast.success("Profile updated successfully")
            
            // Update local state to reflect changes without reload
            setUserMeta(prev => ({
                ...prev,
                name: formData.name.trim(),
                phone: formData.phone,
                email: formData.email.trim(),
                address: {
                    ...prev.address,
                    city: formData.city,
                    barangay: formData.barangay,
                    street: formData.detailedAddress,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    zip: formData.zip,
                    state: formData.province || formData.district || '',
                    notes: formData.notes,
                    isDefault: true,
                    label: formData.label
                }
            }))
            
            // Trigger global auth update
            window.dispatchEvent(new Event('login-success'))
            
            setShowAddressModal(false)
        } catch (error) {
            console.error("Error saving profile:", error)
            toast.error(error.message || "Failed to update profile")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSaveAddress = async (formData) => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email || userMeta.email,
                    phone: formData.phone,
                    street: formData.detailedAddress.trim(),
                    barangay: formData.barangay.trim(),
                    city: formData.city.trim(),
                    state: formData.district || formData.province || '',
                    zip: formData.zip.trim(),
                    country: 'Philippines',
                    notes: formData.notes.trim(),
                    userId: userMeta.id,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    isDefault: formData.isDefault,
                    label: formData.label
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to save address")
            }

            toast.success("Address added successfully")

            if (typeof onAddressesAdded === 'function') {
                await onAddressesAdded()
            }

            setShowAddressModal(false)
        } catch (error) {
            console.error("Error saving address:", error)
            toast.error(error.message || "Failed to add address")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm min-h-screen flex items-center justify-center p-4 md:p-6">
            <div className="flex flex-col text-slate-700 w-full max-w-xl lg:max-w-6xl bg-white rounded-3xl shadow-2xl relative max-h-[90vh] md:max-h-[85vh] overflow-hidden">
                {/* Header - Fixed */}
                <div className="p-6 pb-2 relative border-b border-slate-50">
                    <button
                        type="button"
                        className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full z-20"
                        onClick={() => setShowAddressModal(false)}
                        aria-label="Close"
                    >
                        <XIcon size={20} />
                    </button>

                    <h2 className="text-xl font-extrabold text-slate-800">
                        {isProfileMode ? "My Profile" : "Add New Address"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {isProfileMode 
                            ? "Update your personal information to keep your account accurate."
                            : "Provide your delivery details to get accurate shipping rates."
                        }
                    </p>
                    {!isProfileMode && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">Pin your address in the map to have a precise delivery location.</p>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
                    {isLoadingUser ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-t-green-500"></div>
                            <p className="text-xs font-medium text-slate-400">Loading your profile...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isProfileMode && userMeta.kycStatus !== 'VERIFIED' && userMeta.kycStatus !== 'PENDING' && (
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                                    <div className="bg-amber-100 p-2 rounded-xl">
                                        <AlertCircle className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-amber-900">Verification Required</h4>
                                        <p className="text-xs text-amber-700 mt-0.5">Complete your identity verification to unlock full wallet features, higher transaction limits, and enhanced security.</p>
                                        <button 
                                            type="button"
                                            className="mt-3 px-4 py-2 bg-amber-600 text-white text-[11px] font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm shadow-amber-200"
                                            onClick={() => {
                                                // Placeholder for verification process
                                                toast.success("Starting verification process...")
                                            }}
                                        >
                                            Start Verification Process
                                        </button>
                                    </div>
                                </div>
                            )}

                            <AddressFormManager 
                                initialData={{ 
                                    name: userMeta.name, 
                                    firstName: userMeta.firstName,
                                    lastName: userMeta.lastName,
                                    email: userMeta.email, 
                                    phone: userMeta.phone,
                                    hasPassword: userMeta.hasPassword,
                                    city: userMeta.address?.city || '',
                                    barangay: userMeta.address?.barangay || '',
                                    detailedAddress: userMeta.address?.street || '',
                                    latitude: userMeta.address?.latitude || 14.5995,
                                    longitude: userMeta.address?.longitude || 120.9842,
                                    zip: userMeta.address?.zip || '',
                                    province: userMeta.address?.state || '',
                                    notes: userMeta.address?.notes || '',
                                    isDefault: userMeta.address?.isDefault || false,
                                    label: userMeta.address?.label || ''
                                }}
                                onSave={isProfileMode ? handleSaveProfile : handleSaveAddress}
                                onCancel={() => setShowAddressModal(false)}
                                isLoading={isSubmitting}
                                mode={mode}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AddressModal
