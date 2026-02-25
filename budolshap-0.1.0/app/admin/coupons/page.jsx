'use client'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { DeleteIcon, EditIcon } from "lucide-react"
import { useSearch } from "@/context/SearchContext"

export default function AdminCoupons() {
    const { searchQuery } = useSearch()
    const [coupons, setCoupons] = useState([])
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, couponCode: null })
    const [isEditing, setIsEditing] = useState(false)

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discount: '',
        forNewUser: false,
        forMember: false,
        forCoopMember: false,
        isPublic: false,
        expiresAt: new Date()
    })

    const fetchCoupons = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const params = new URLSearchParams({
                includeExpired: 'true',
                search: searchQuery || ''
            })
            const response = await fetch(`/api/coupons?${params.toString()}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const couponsData = await response.json()
                setCoupons(couponsData)
            } else {
                setCoupons([])
            }
        } catch (error) {
            console.error("Error fetching coupons:", error)
            setCoupons([])
        }
    }

    const handleAddCoupon = async (e) => {
        e.preventDefault()
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const url = isEditing ? `/api/coupons/${newCoupon.code}` : '/api/coupons'
            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: newCoupon.code.toUpperCase(),
                    description: newCoupon.description,
                    discount: parseFloat(newCoupon.discount),
                    forNewUser: newCoupon.forNewUser,
                    forMember: newCoupon.forMember,
                    forCoopMember: newCoupon.forCoopMember,
                    isPublic: true, // Admin coupons are public
                    expiresAt: new Date(newCoupon.expiresAt).toISOString()
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(isEditing ? "Coupon updated successfully!" : "Coupon added successfully!")
                // Reset form
                setNewCoupon({
                    code: '',
                    description: '',
                    discount: '',
                    forNewUser: false,
                    forMember: false,
                    forCoopMember: false,
                    isPublic: false,
                    expiresAt: new Date()
                })
                setIsEditing(false)
                // Refresh coupons list
                fetchCoupons()
            } else {
                toast.error(data.error || (isEditing ? "Failed to update coupon" : "Failed to add coupon"))
            }
        } catch (error) {
            console.error(isEditing ? "Error updating coupon:" : "Error adding coupon:", error)
            toast.error(isEditing ? "Failed to update coupon" : "Failed to add coupon")
        }
    }

    const handleChange = (e) => {
        setNewCoupon({ ...newCoupon, [e.target.name]: e.target.value })
    }

    const confirmDelete = (code) => {
        setDeleteConfirmation({ isOpen: true, couponCode: code })
    }

    const handleEdit = (coupon) => {
        setNewCoupon({
            code: coupon.code,
            description: coupon.description,
            discount: coupon.discount,
            forNewUser: coupon.forNewUser,
            forMember: coupon.forMember,
            forCoopMember: coupon.forCoopMember,
            isPublic: coupon.isPublic,
            expiresAt: new Date(coupon.expiresAt)
        })
        setIsEditing(true)
        // Scroll to top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelEdit = () => {
        setNewCoupon({
            code: '',
            description: '',
            discount: '',
            forNewUser: false,
            forMember: false,
            forCoopMember: false,
            isPublic: false,
            expiresAt: new Date()
        })
        setIsEditing(false)
    }

    const handleDelete = async () => {
        if (!deleteConfirmation.couponCode) return

        const code = deleteConfirmation.couponCode
        setDeleteConfirmation({ isOpen: false, couponCode: null })

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(`/api/coupons/${code}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                toast.success("Coupon deleted successfully!")
                // If we were editing this coupon, reset the form
                if (isEditing && newCoupon.code === code) {
                    cancelEdit()
                }
                // Refresh coupons list
                fetchCoupons()
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to delete coupon")
            }
        } catch (error) {
            console.error("Error deleting coupon:", error)
            toast.error("Failed to delete coupon")
        }
    }

    useEffect(() => {
        fetchCoupons();
    }, [searchQuery])

    return (
        <div className="text-slate-500 mb-40">

            {/* Add/Edit Coupon */}
            <form onSubmit={(e) => toast.promise(handleAddCoupon(e), { loading: isEditing ? "Updating coupon..." : "Adding coupon..." })} className="max-w-sm text-sm">
                <h2 className="text-2xl">{isEditing ? 'Edit' : 'Add'} <span className="text-slate-800 font-medium">Coupons</span></h2>
                <div className="flex gap-2 max-sm:flex-col mt-2">
                    <input type="text" placeholder="Coupon Code" className={`w-full mt-2 p-2 border border-slate-200 outline-slate-400 rounded-md ${isEditing ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                        name="code" value={newCoupon.code} onChange={handleChange} required disabled={isEditing}
                    />
                    <input type="number" placeholder="Coupon Discount (%)" min={1} max={100} className="w-full mt-2 p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="discount" value={newCoupon.discount} onChange={handleChange} required
                    />
                </div>
                <input type="text" placeholder="Coupon Description" className="w-full mt-2 p-2 border border-slate-200 outline-slate-400 rounded-md"
                    name="description" value={newCoupon.description} onChange={handleChange} required
                />

                <label>
                    <p className="mt-3">Coupon Expiry Date</p>
                    <input type="date" placeholder="Coupon Expires At" className="w-full mt-1 p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="expiresAt" value={newCoupon.expiresAt instanceof Date ? format(newCoupon.expiresAt, 'yyyy-MM-dd') : newCoupon.expiresAt} onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                    />
                </label>

                <div className="mt-5">
                    <div className="flex gap-2 mt-3">
                        <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                            <input type="checkbox" className="sr-only peer"
                                name="forNewUser" checked={newCoupon.forNewUser}
                                onChange={(e) => setNewCoupon({ ...newCoupon, forNewUser: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                            <span className="dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                        </label>
                        <p>For New User</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                            <input type="checkbox" className="sr-only peer"
                                name="forMember" checked={newCoupon.forMember}
                                onChange={(e) => setNewCoupon({ ...newCoupon, forMember: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                            <span className="dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                        </label>
                        <p>For Member</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                            <input type="checkbox" className="sr-only peer"
                                name="forCoopMember" checked={newCoupon.forCoopMember}
                                onChange={(e) => setNewCoupon({ ...newCoupon, forCoopMember: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200"></div>
                            <span className="dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                        </label>
                        <p>For Coop Member</p>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button type="submit" className="p-2 px-10 rounded bg-slate-700 text-white active:scale-95 transition">
                        {isEditing ? 'Update Coupon' : 'Add Coupon'}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={cancelEdit} className="p-2 px-6 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 active:scale-95 transition">
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* List Coupons */}
            <div className="mt-14">
                <h2 className="text-2xl">List <span className="text-slate-800 font-medium">Coupons</span></h2>
                <div className="overflow-x-auto mt-4 rounded-lg border border-slate-200 w-full">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Code</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Description</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Discount</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Expires At</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">New User</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">For Member</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">For Coop</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {coupons.map((coupon) => (
                                <tr key={coupon.code} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 font-medium text-slate-800">{coupon.code}</td>
                                    <td className="py-3 px-4 text-slate-800">{coupon.description}</td>
                                    <td className="py-3 px-4 text-slate-800">{coupon.discount}%</td>
                                    <td className="py-3 px-4 text-slate-800">{format(coupon.expiresAt, 'yyyy-MM-dd')}</td>
                                    <td className="py-3 px-4 text-slate-800">{coupon.forNewUser ? 'Yes' : 'No'}</td>
                                    <td className="py-3 px-4 text-slate-800">{coupon.forMember ? 'Yes' : 'No'}</td>
                                    <td className="py-3 px-4 text-slate-800">{coupon.forCoopMember ? 'Yes' : 'No'}</td>
                                    <td className="py-3 px-4 text-slate-800 flex gap-3">
                                        <EditIcon onClick={() => handleEdit(coupon)} className="w-5 h-5 text-blue-500 hover:text-blue-800 cursor-pointer" />
                                        <DeleteIcon onClick={() => confirmDelete(coupon.code)} className="w-5 h-5 text-red-500 hover:text-red-800 cursor-pointer" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmation.isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Coupon?</h3>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to delete coupon <span className="font-bold text-slate-800">{deleteConfirmation.couponCode}</span>?
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirmation({ isOpen: false, couponCode: null })}
                                    className="px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => toast.promise(handleDelete(), { loading: "Deleting coupon..." })}
                                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}