'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useRouter } from "next/navigation"
import { assets } from "@/assets/assets"
import { PlusIcon, MapPinIcon } from "lucide-react"
import StoreAddressesManager from "@/components/StoreAddressesManager"
import { useAuth } from "@/context/AuthContext"
import { compressImage } from "@/lib/imageUtils"

export default function StoreSettings() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        logo: "",
        id: "" // Store ID for address management
    })
    const [logoFile, setLogoFile] = useState(null)
    const [showAddressesManager, setShowAddressesManager] = useState(false)
    const [defaultAddress, setDefaultAddress] = useState(null)
    const [tooltipData, setTooltipData] = useState({ visible: false, text: '', top: 0, left: 0 })

    const handleImageMouseEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setTooltipData({
            visible: true,
            text: "Upload new logo",
            top: rect.top + (rect.height / 2),
            left: rect.right + 12
        })
    }

    const handleMouseLeave = () => {
        setTooltipData(prev => ({ ...prev, visible: false }))
    }

    const Tooltip = () => {
        if (!tooltipData.visible) return null
        return (
            <div 
                className="fixed z-[100] px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200"
                style={{ 
                    top: tooltipData.top, 
                    left: tooltipData.left, 
                    transform: 'translateY(-50%)'
                }}
            >
                {tooltipData.text}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
            </div>
        )
    }

    const fetchStoreInfo = async () => {
        if (authLoading) return;
        
        try {
            if (!user) {
                setLoading(false)
                return
            }

            const response = await fetch(`/api/stores/user/${user.id}`)
            if (response.ok) {
                const store = await response.json()
                if (!store) {
                    toast.error("Store not found")
                    router.push('/create-store')
                    return
                }
                setStoreInfo({
                    name: store.name || "",
                    username: store.username || "",
                    description: store.description || "",
                    email: store.email || "",
                    contact: store.contact || "",
                    address: store.address || "",
                    logo: store.logo || "",
                    id: store.id
                })

                // Fetch default address
                const addressesResponse = await fetch(`/api/stores/${store.id}/addresses`)
                if (addressesResponse.ok) {
                    const addresses = await addressesResponse.json()
                    const defaultAddr = addresses.find(addr => addr.isDefault)
                    setDefaultAddress(defaultAddr || null)
                }
            } else {
                toast.error("Failed to verify store access")
            }
        } catch (error) {
            console.error("Error fetching store:", error)
            toast.error("Failed to fetch store information")
        } finally {
            setLoading(false)
        }
    }

    const convertImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = error => reject(error)
        })
    }

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        if (authLoading) return
        try {
            if (!user) {
                toast.error("Please login first")
                return
            }

            // Get store ID
            const storeResponse = await fetch(`/api/stores/user/${user.id}`)
            if (!storeResponse.ok) {
                throw new Error("Store not found")
            }
            const store = await storeResponse.json()

            // Upload logo to Cloudinary if provided
            let logoUrl = storeInfo.logo
            if (logoFile) {
                // Compress image before upload
                let base64 = null;
                try {
                    base64 = await compressImage(logoFile, {
                        maxWidth: 800,
                        maxHeight: 800,
                        quality: 0.8,
                        type: 'image/webp' // Use WebP to support transparency
                    });
                } catch (compressError) {
                    console.error('Compression failed, falling back to original', compressError);
                    base64 = await convertImageToBase64(logoFile);
                }

                // Upload to Cloudinary
                try {
                    const uploadResponse = await fetch('/api/upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ image: base64, folder: 'stores' })
                    })

                    if (!uploadResponse.ok) {
                        throw new Error('Failed to upload logo to Cloudinary')
                    }

                    const { url } = await uploadResponse.json()
                    logoUrl = url
                } catch (uploadError) {
                    console.error('Cloudinary upload failed:', uploadError);
                    toast.error('Image upload failed. Saving to local database backup instead.');
                    // Fallback: Use the base64 string directly as the logo URL
                    logoUrl = base64;
                }
            }

            const response = await fetch(`/api/stores/${store.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: storeInfo.name,
                    description: storeInfo.description,
                    email: storeInfo.email,
                    contact: storeInfo.contact,
                    address: storeInfo.address,
                    logo: logoUrl
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success("Store information updated successfully!")
                setStoreInfo({
                    ...storeInfo,
                    logo: logoUrl
                })
                setLogoFile(null)
            } else {
                toast.error(data.error || "Failed to update store information")
            }
        } catch (error) {
            console.error("Error updating store:", error)
            toast.error(error.message || "Failed to update store information")
        }
    }

    useEffect(() => {
        fetchStoreInfo()
    }, [authLoading, user])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl mb-5">Store <span className="text-slate-800 font-medium">Settings</span></h1>

            <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Updating store..." })} className="max-w-2xl flex flex-col gap-4">
                <div>
                    <label className="cursor-pointer block w-fit">
                        Store Logo
                        <div 
                            className="relative mt-2"
                            onMouseEnter={handleImageMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <Image
                                src={logoFile ? URL.createObjectURL(logoFile) : (storeInfo.logo || assets.upload_area)}
                                className="rounded-lg h-24 w-auto object-contain bg-white border border-slate-200 transition-transform hover:scale-[1.02]"
                                alt="Store Logo"
                                width={150}
                                height={100}
                            />
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setLogoFile(e.target.files[0])}
                            hidden
                        />
                    </label>
                </div>

                <div>
                    <p>Username</p>
                    <input
                        name="username"
                        value={storeInfo.username}
                        type="text"
                        disabled
                        className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded bg-slate-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">Username cannot be changed</p>
                </div>

                <div>
                    <p>Store Name</p>
                    <input
                        name="name"
                        onChange={onChangeHandler}
                        value={storeInfo.name}
                        type="text"
                        placeholder="Enter your store name"
                        className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <p>Description</p>
                    <textarea
                        name="description"
                        onChange={onChangeHandler}
                        value={storeInfo.description}
                        rows={5}
                        placeholder="Enter your store description"
                        className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
                        required
                    />
                </div>

                <div>
                    <p>Email</p>
                    <input
                        name="email"
                        onChange={onChangeHandler}
                        value={storeInfo.email}
                        type="email"
                        placeholder="Enter your store email"
                        className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <p>Contact Number</p>
                    <input
                        name="contact"
                        onChange={onChangeHandler}
                        value={storeInfo.contact}
                        type="text"
                        placeholder="Enter your store contact number"
                        className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <p>Addresses</p>
                    <button
                        type="button"
                        onClick={() => setShowAddressesManager(true)}
                        className="w-full max-w-lg border border-slate-300 rounded p-4 flex items-center justify-between gap-3 text-slate-700 hover:bg-slate-50 transition"
                    >
                        <div className="flex items-center gap-3">
                            <MapPinIcon className="text-slate-500" size={20} />
                            <div className="text-left">
                                {defaultAddress ? (
                                    <>
                                        <p className="text-sm font-medium">Default Address</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {[defaultAddress.detailedAddress, defaultAddress.barangay, defaultAddress.city].filter(Boolean).join(', ')}
                                        </p>
                                    </>
                                ) : storeInfo.address ? (
                                    <>
                                        <p className="text-sm font-medium text-amber-600">Legacy Address</p>
                                        <p className="text-xs text-slate-500 mt-1">{storeInfo.address}</p>
                                        <p className="text-xs text-amber-600 mt-1">⚠️ Please add a structured address</p>
                                    </>
                                ) : (
                                    <p className="text-sm">No addresses yet</p>
                                )}
                            </div>
                        </div>
                        <span className="text-orange-600 text-sm font-medium">Manage Addresses</span>
                    </button>
                </div>

                <button
                    type="submit"
                    className="bg-slate-800 text-white px-12 py-2 rounded mt-4 active:scale-95 hover:bg-slate-900 transition w-fit"
                >
                    Update Store Information
                </button>
            </form>

            {showAddressesManager && storeInfo.id && (
                <StoreAddressesManager
                    storeId={storeInfo.id}
                    onClose={() => setShowAddressesManager(false)}
                    onSave={() => {
                        fetchStoreInfo() // Refresh to get updated default address
                    }}
                />
            )}
            <Tooltip />
        </div>
    )
}

