'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import StoreAddressModal from "@/components/StoreAddressModal"
import { getUser } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { PlusIcon, MapPinIcon } from "lucide-react"
import { useRealtimeUser } from "@/hooks/useRealtimeUser";
import { useCallback } from "react";
import { compressImage } from "@/lib/imageUtils";

export default function CreateStore() {

    const router = useRouter()
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")

    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        image: ""
    })

    const [showAddressModal, setShowAddressModal] = useState(false)

    const handleAddressSave = (formattedAddress, addressObj) => {
        setStoreInfo(prev => ({
            ...prev,
            address: formattedAddress,
            contact: addressObj.phone,
            structuredAddress: addressObj // Store the full structured address object
        }))
    }

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
    }

    const convertImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = error => reject(error)
        })
    }

    const fetchSellerStatus = async () => {
        try {
            const user = getUser()
            if (!user) {
                toast.error("Please login first")
                router.push('/')
                setLoading(false)
                return
            }

            const response = await fetch(`/api/stores/user/${user.id}`)
            if (response.ok) {
                const store = await response.json()
                if (!isMounted.current) return

                // Handle null store response (no store found)
                if (!store) {
                    setAlreadySubmitted(false)
                    return
                }

                setAlreadySubmitted(true)
                setStatus(store.status)
                setMessage(
                    store.status === 'approved'
                        ? "You already setup your store. This e-commerce platform only allow 1 store per account."
                        : store.status === 'rejected'
                            ? "Your store application was rejected. Please contact support for more information."
                            : "Your store application is pending approval. We'll notify you once it's reviewed."
                )

                if (store.status === 'approved' && store.isActive) {
                    setTimeout(() => {
                        if (isMounted.current) router.push('/store')
                    }, 7000)
                }
            } else if (response.status === 404) {
                // No store found, user can create one
                if (isMounted.current) setAlreadySubmitted(false)
            } else {
                if (isMounted.current) toast.error("Failed to check store status")
            }
        } catch (error) {
            console.error("Error fetching seller status:", error)
            toast.error("Failed to check store status")
        } finally {
            if (isMounted.current) setLoading(false)
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        const toastId = toast.loading("Submitting store application...")

        try {
            const user = getUser()
            if (!user) {
                toast.error("Please login first", { id: toastId })
                router.push('/')
                return
            }

            // Validate required fields
            if (!storeInfo.name || !storeInfo.username || !storeInfo.description ||
                !storeInfo.address || !storeInfo.contact) {
                toast.error("Please fill in all required fields. Address is required.", { id: toastId })
                return
            }

            // Upload logo to Cloudinary if provided
            let logoUrl = ""
            if (storeInfo.image && storeInfo.image instanceof File) {
                try {
                    // Compress image before upload
                    let base64;
                    try {
                        base64 = await compressImage(storeInfo.image, {
                            maxWidth: 800,
                            maxHeight: 800,
                            quality: 0.8,
                            type: 'image/webp'
                        });
                    } catch (compressError) {
                        console.warn('Compression failed, falling back to original:', compressError);
                        base64 = await convertImageToBase64(storeInfo.image);
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
                            throw new Error('Failed to upload logo to Cloudinary');
                        }

                        const { url } = await uploadResponse.json()
                        logoUrl = url
                    } catch (uploadError) {
                        console.error('Cloudinary upload failed:', uploadError);
                        toast('Image upload failed. Saving to local database backup instead.', { icon: '⚠️' });
                        // Fallback: Use the base64 string directly as the logo URL
                        logoUrl = base64;
                    }
                } catch (error) {
                    console.error('Error processing logo:', error);
                    // Continue without logo if everything fails
                }
            }

            const response = await fetch('/api/stores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    name: storeInfo.name,
                    username: storeInfo.username,
                    email: user.email,
                    contact: storeInfo.contact,
                    description: storeInfo.description,
                    address: storeInfo.address,
                    structuredAddress: storeInfo.structuredAddress, // Send structured address
                    logo: logoUrl
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success("Store application submitted successfully!", { id: toastId })
                setAlreadySubmitted(true)
                setStatus("pending")
                setMessage("Your store application has been submitted and is pending approval. We'll notify you once it's reviewed.")
            } else {
                toast.error(data.error || "Failed to submit store application", { id: toastId })
            }
        } catch (error) {
            console.error("Error submitting store:", error)
            toast.error("Failed to submit store application", { id: toastId })
        }
    }

    useEffect(() => {
        fetchSellerStatus()
    }, [])

    // Realtime Listener
    const handleUserEvent = useCallback((event, data) => {
        if (event === 'store-status-updated' && data.status) {
            const newStatus = data.status.toLowerCase();
            setStatus(newStatus);

            if (data.status === 'APPROVED') {
                setMessage("Your store application has been approved! Redirecting you to your store...");
                setTimeout(() => {
                    if (isMounted.current) router.push('/store');
                }, 3000);
            } else if (data.status === 'REJECTED') {
                setMessage("Your store application was rejected. Please contact support.");
            }
        }
    }, [router]);

    const user = getUser();
    useRealtimeUser({
        userId: user?.id,
        onEvent: handleUserEvent
    });

    return (
        <>
            {!loading ? (
                <>
                    {!alreadySubmitted ? (
                        <div className="mx-6 min-h-[70vh] my-16">
                            <form onSubmit={onSubmitHandler} className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500">
                                {/* Title */}
                                <div>
                                    <h1 className="text-3xl ">Add Your <span className="text-slate-800 font-medium">Store</span></h1>
                                    <p className="max-w-lg">To become a seller on BudolShap, submit your store details for review. Your store will be activated after admin verification.</p>
                                </div>

                                <label className="mt-10 cursor-pointer">
                                    Store Logo
                                    <Image src={storeInfo.image ? URL.createObjectURL(storeInfo.image) : assets.upload_area} className="rounded-lg mt-2 h-16 w-auto" alt="" width={150} height={100} />
                                    <input type="file" accept="image/*" onChange={(e) => setStoreInfo({ ...storeInfo, image: e.target.files[0] })} hidden />
                                </label>

                                <p>Username</p>
                                <input name="username" onChange={onChangeHandler} value={storeInfo.username} type="text" placeholder="Enter your store username" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                                <p>Name</p>
                                <input name="name" onChange={onChangeHandler} value={storeInfo.name} type="text" placeholder="Enter your store name" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                                <p>Description</p>
                                <textarea name="description" onChange={onChangeHandler} value={storeInfo.description} rows={5} placeholder="Enter your store description" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none" />

                                <p>Address</p>
                                {storeInfo.address ? (
                                    <div className="w-full max-w-lg border border-slate-300 rounded p-3 flex items-start gap-3 bg-slate-50">
                                        <MapPinIcon className="text-slate-500 mt-1 flex-shrink-0" size={20} />
                                        <div className="flex-1">
                                            <p className="text-slate-700 text-sm">{storeInfo.address}</p>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddressModal(true)}
                                                className="text-green-600 text-xs font-medium mt-2 hover:underline"
                                            >
                                                Edit Address
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressModal(true)}
                                        className="w-full max-w-lg border border-dashed border-slate-300 rounded p-4 flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition"
                                    >
                                        <PlusIcon size={20} />
                                        <span>Add Address</span>
                                    </button>
                                )}

                                <button className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition ">Submit</button>
                            </form>
                        </div>
                    ) : (
                        <div className="min-h-[80vh] flex flex-col items-center justify-center">
                            <p className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 text-center max-w-2xl">{message}</p>
                            {status === "approved" && <p className="mt-5 text-slate-400">redirecting to dashboard in <span className="font-semibold">7 seconds</span></p>}
                        </div>
                    )}
                </>
            ) : (<Loading />)}

            {showAddressModal && (
                <StoreAddressModal
                    setShowAddressModal={setShowAddressModal}
                    onSave={handleAddressSave}
                    initialData={storeInfo}
                />
            )}
        </>
    )
}
