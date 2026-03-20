'use client'
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { User, Mail, ShoppingBag, MapPin, Star, Search, Trash2, Plus, Edit, X, Shield, Phone } from "lucide-react"
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, getAccountTypeMeta } from "@/lib/accountTypes"
import { ROLES } from "@/lib/rbac"
import Image from "next/image"
import StoreAddressModal from "@/components/StoreAddressModal"
import { formatManilaTime } from "@/lib/dateUtils"
import { useSearch } from "@/context/SearchContext"

const initialFormState = {
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: null,
    accountType: 'BUYER',
    role: 'USER',
    image: '',
    emailVerified: false
}

export default function AdminUsers() {
    const { searchQuery, updateSearchQuery } = useSearch()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState(initialFormState)
    const [showModal, setShowModal] = useState(false)
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showDeleted, setShowDeleted] = useState(false)

    const fetchUsers = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            let url = searchQuery
                ? `/api/admin/users?search=${encodeURIComponent(searchQuery)}`
                : '/api/admin/users'
            
            if (showDeleted) {
                const separator = url.includes('?') ? '&' : '?'
                url += `${separator}includeDeleted=true`
            }

            const response = await fetch(url, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const usersData = await response.json()
                setUsers(usersData)
            } else {
                setUsers([])
            }
        } catch (error) {
            console.error("Error fetching users:", error)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!confirm(`Are you sure you want to delete this user? This action cannot be undone.`)) {
            return
        }

        console.log('🗑️ Attempting to delete user:', userId)

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include', // Ensure cookies are sent
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            console.log('📡 Response status:', response.status)
            console.log('📡 Response ok:', response.ok)

            if (response.ok) {
                // Success
                toast.success('User deleted successfully')
                setUsers(users.filter(u => u.id !== userId))
                console.log('✅ User deleted successfully')
                alert('✅ Success: User deleted successfully!')
            } else {
                // Error - try to parse JSON, fallback to text
                let errorMessage = "Unknown error"
                try {
                    const data = await response.json()
                    console.error('❌ Delete failed (JSON):', data)
                    errorMessage = data.error || JSON.stringify(data)
                    // If debug info exists, append it
                    if (data.details) errorMessage += `\nDetails: ${data.details}`
                } catch (e) {
                    const text = await response.text()
                    console.error('❌ Delete failed (Text):', text)
                    errorMessage = `Status ${response.status}: ${text.substring(0, 100)}`
                }

                toast.error(errorMessage)
                alert(`❌ Error Deleting User:\n\n${errorMessage}`)
            }
        } catch (error) {
            console.error("❌ Error deleting user:", error)
            const msg = "Failed to delete user: " + error.message
            toast.error(msg)
            alert(`❌ Network/Client Error:\n\n${msg}`)
        }
    }

    const openCreateModal = () => {
        setEditingUser(null)
        setFormData(initialFormState)
        setShowModal(true)
    }

    const openEditModal = (user) => {
        setEditingUser(user)
        
        // Initialize address data
        let addressData = user.Address && user.Address.length > 0 ? user.Address[0] : null

        // If user has store address, use it to populate form fields for better details (notes, district, etc.)
        if (user.store && user.store.addresses && user.store.addresses.length > 0) {
             const storeAddr = user.store.addresses.find(a => a.isDefault) || user.store.addresses[0];
             if (storeAddr) {
                 addressData = {
                     ...(addressData || {}),
                     phone: storeAddr.phone,
                     street: storeAddr.detailedAddress,
                     detailedAddress: storeAddr.detailedAddress,
                     barangay: storeAddr.barangay,
                     city: storeAddr.city,
                     state: storeAddr.district || storeAddr.province,
                     district: storeAddr.district,
                     province: storeAddr.province,
                     zip: storeAddr.zip,
                     latitude: storeAddr.latitude,
                     longitude: storeAddr.longitude,
                     notes: storeAddr.notes,
                     country: storeAddr.country
                 }
             }
        }

        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '',
            phoneNumber: user.phoneNumber || '',
            address: addressData,
            accountType: user.accountType || 'BUYER',
            role: user.role || 'USER',
            image: user.image || '',
            emailVerified: user.emailVerified ?? false
        })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setShowAddressModal(false)
        setEditingUser(null)
        setFormData(initialFormState)
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleAddressSave = (formattedAddress, addressObj) => {
        setFormData(prev => ({
            ...prev,
            address: addressObj,
            phoneNumber: addressObj.phone || prev.phoneNumber // Sync phone if available from address
        }))
        setShowAddressModal(false)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phoneNumber: formData.phoneNumber.trim(),
            address: formData.address,
            accountType: formData.accountType,
            role: formData.role,
            image: formData.image.trim(),
            emailVerified: formData.emailVerified
        }

        if (!payload.name || !payload.email || !payload.phoneNumber) {
            toast.error('Name, email, and phone number are required')
            return
        }

        if (!editingUser && !formData.password.trim()) {
            toast.error('Password is required for new users')
            return
        }

        if (formData.password.trim()) {
            payload.password = formData.password.trim()
        }

        setIsSubmitting(true)

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(
                editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users',
                {
                    method: editingUser ? 'PUT' : 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                }
            )

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || 'Failed to save user')
                return
            }

            if (editingUser) {
                setUsers(prevUsers => prevUsers.map(user => user.id === data.id ? data : user))
                toast.success('User updated successfully')
            } else {
                setUsers(prevUsers => [data, ...prevUsers])
                toast.success('User created successfully')
            }

            closeModal()
        } catch (error) {
            console.error("Error saving user:", error)
            toast.error("Failed to save user")
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [searchQuery, showDeleted])

    const getAccountBadge = (user) => {
        if (user.deletedAt) {
            return { label: 'Deleted', className: 'bg-red-200 text-red-800' }
        }

        const accountMeta = getAccountTypeMeta(user.accountType)

        if (accountMeta?.value === 'ADMIN') {
            return { label: accountMeta.label, className: accountMeta.badgeClass }
        }

        if (user.store) {
            if (user.store.status === 'approved' && user.store.isActive) {
                return { label: 'Seller', className: 'bg-green-100 text-green-600' }
            }

            if (user.store.status === 'pending') {
                return { label: 'Store Pending', className: 'bg-yellow-100 text-yellow-600' }
            }

            if (user.store.status === 'rejected') {
                return { label: 'Store Rejected', className: 'bg-red-100 text-red-600' }
            }
        }

        if (accountMeta) {
            return { label: accountMeta.label, className: accountMeta.badgeClass }
        }

        return { label: 'Buyer', className: 'bg-slate-100 text-slate-600' }
    }

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-6">
                <h1 className="text-2xl">Manage <span className="text-slate-800 font-medium">Users</span></h1>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showDeleted}
                            onChange={(e) => setShowDeleted(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Show Deleted
                    </label>

                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                        <Search size={18} className="text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => updateSearchQuery(e.target.value)}
                            className="bg-transparent outline-none w-52 sm:w-64"
                        />
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition"
                    >
                        <Plus size={16} />
                        Add User
                    </button>
                </div>
            </div>

            {users.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {users.map((user) => {
                        const badge = getAccountBadge(user)
                        let accountTypeLabel = ACCOUNT_TYPE_LABELS[user.accountType] || 'Buyer'

                        if (user.accountType !== 'ADMIN' && user.store?.status === 'approved' && user.store?.isActive) {
                            accountTypeLabel = 'Seller'
                        }

                        return (
                            <div key={user.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden relative border border-slate-100 shadow-sm">
                                            {user.image || user.store?.logo ? (
                                                <Image
                                                    src={user.image || user.store?.logo}
                                                    alt={user.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <User size={24} className="text-slate-500" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-800">{user.name}</h3>
                                                {badge && (
                                                    <span className={`px-2 py-1 text-xs rounded-full ${badge.className}`}>
                                                        {badge.label}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={16} />
                                                    <span>{user.email}</span>
                                                    {user.emailVerified ? (
                                                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Verified</span>
                                                    ) : (
                                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Unverified</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBag size={16} />
                                                    <span>{user._count?.buyerOrders || 0} Orders</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} />
                                                    <span>{user._count?.Address || 0} Addresses</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Star size={16} />
                                                    <span>{user._count?.ratings || 0} Reviews</span>
                                                </div>
                                            </div>

                                            <div className="mt-2 text-sm text-slate-500">
                                                <span className="font-medium">Account Type:</span> {accountTypeLabel}
                                                {user.accountType === 'ADMIN' && (
                                                    <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold uppercase">
                                                        {user.role || 'USER'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 text-sm text-slate-500 flex items-center gap-2">
                                                <span className="font-medium">Membership Type:</span>
                                                {user.coopMembershipStatus === 'APPROVED' ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">Coop</span>
                                                        Member
                                                    </span>
                                                ) :
                                                    user.membershipStatus === 'APPROVED' ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">Plus</span>
                                                            Membership
                                                        </span>
                                                    ) :
                                                        user.coopMembershipStatus === 'PENDING' ? 'Coop Membership Pending' :
                                                            user.membershipStatus === 'PENDING' ? 'Membership Pending' : 'None'
                                                }
                                            </div>

                                            {user.store && (
                                                <div className="mt-2 text-sm text-slate-500">
                                                    <span>Store: </span>
                                                    <span className="font-medium">{user.store.name}</span>
                                                </div>
                                            )}

                                            <div className="mt-2 text-xs text-slate-400">
                                                Joined: {formatManilaTime(user.createdAt, { dateStyle: 'medium' })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="px-4 py-2 bg-green-400 text-white hover:bg-green-500  rounded-md text-sm transition flex items-center justify-center gap-2"
                                        >
                                            <Edit size={16} />
                                            <span className="hidden sm:inline">Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition flex items-center justify-center gap-2"
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                            <span className="hidden sm:inline">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No users found</h1>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={18} />
                        </button>

                        <h2 className="text-xl font-semibold text-slate-800 mb-1">
                            {editingUser ? 'Edit User' : 'Add User'}
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">
                            {editingUser ? 'Update user details and access type.' : 'Create a new user account with the desired access level.'}
                        </p>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="text-sm font-medium text-slate-600 block mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-600 block mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-600 block mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                                        placeholder="+63 912 345 6789"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-600 block mb-1">Address</label>
                                <button
                                    type="button"
                                    onClick={() => setShowAddressModal(true)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition text-left"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <MapPin size={16} className="text-slate-400 shrink-0" />
                                        <span className="truncate text-slate-600">
                                            {formData.address
                                                ? (formData.address.fullAddress || `${formData.address.street || ''} ${formData.address.barangay || ''} ${formData.address.city || ''}`.trim() || 'Address set')
                                                : 'Set user address'}
                                        </span>
                                    </div>
                                    <Edit size={14} className="text-slate-400 shrink-0" />
                                </button>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-600 block mb-1">
                                    {editingUser ? 'New Password (optional)' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder={editingUser ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                                    minLength={6}
                                    required={!editingUser}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-600 block mb-1">Account Type</label>
                                <select
                                    value={formData.accountType}
                                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                                >
                                    {ACCOUNT_TYPES.map((type) => (
                                        <option value={type.value} key={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">
                                    {ACCOUNT_TYPES.find(type => type.value === formData.accountType)?.description}
                                </p>
                            </div>

                            {formData.accountType === 'ADMIN' && (
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <label className="text-sm font-bold text-indigo-900 block mb-2 flex items-center gap-2">
                                        <Shield size={16} />
                                        RBAC Role (Internal Staff)
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                        className="w-full border border-indigo-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-indigo-900 font-medium"
                                    >
                                        {Object.values(ROLES).map((role) => (
                                            <option value={role} key={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-indigo-600 mt-2 italic">
                                        * Assigning an RBAC role defines granular permissions for this administrator.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-slate-600 block mb-1">Avatar URL (optional)</label>
                                <input
                                    type="url"
                                    value={formData.image}
                                    onChange={(e) => handleInputChange('image', e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>

                            {/* Email Verified Toggle */}
                            {editingUser && (
                                <div className="flex items-center mt-2">
                                    <input
                                        type="checkbox"
                                        id="emailVerified"
                                        checked={formData.emailVerified}
                                        onChange={(e) => handleInputChange('emailVerified', e.target.checked)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="emailVerified" className="text-sm text-slate-600">Email Verified</label>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition disabled:opacity-60"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddressModal && (
                    <StoreAddressModal
                        setShowAddressModal={setShowAddressModal}
                        onSave={handleAddressSave}
                        initialData={formData.address ? {
                    name: editingUser?.store?.name || 'NONE',
                    phone: formData.address.phone || formData.phoneNumber,
                    street: formData.address.street || formData.address.detailedAddress,
                    detailedAddress: formData.address.detailedAddress || formData.address.street,
                    barangay: formData.address.barangay,
                    city: formData.address.city,
                    state: formData.address.state || formData.address.province || formData.address.district,
                    district: formData.address.district || formData.address.state || '',
                    province: formData.address.province || '',
                    zip: formData.address.zip,
                    latitude: formData.address.latitude,
                    longitude: formData.address.longitude,
                    notes: formData.address.notes || '',
                    country: formData.address.country || 'Philippines'
                } : {
                    name: editingUser?.store?.name || 'NONE',
                    phone: formData.phoneNumber
                }}
                    />
                )}
        </div>
    )
}

