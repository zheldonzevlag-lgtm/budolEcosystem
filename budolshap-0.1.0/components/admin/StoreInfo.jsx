'use client'
import Image from "next/image"
import { MapPin, Mail, Phone } from "lucide-react"

import { assets } from "@/assets/assets"

const StoreInfo = ({ store }) => {
    // Get default address or fallback to legacy address
    const defaultAddress = store.addresses?.[0]
    const displayAddress = defaultAddress
        ? [
            defaultAddress.detailedAddress,
            defaultAddress.barangay,
            defaultAddress.city,
            defaultAddress.district,
            defaultAddress.province,
            defaultAddress.zip,
            defaultAddress.country
        ].filter(Boolean).join(', ')
        : store.address

    return (
        <div className="flex-1 space-y-2 text-sm">
            <Image width={100} height={100} src={store.logo || store.user?.image || assets.upload_area} alt={store.name} className="max-w-20 max-h-20 object-contain shadow rounded-full max-sm:mx-auto" />
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <h3 className="text-xl font-semibold text-slate-800"> {store.name} </h3>
                <span className="text-sm">@{store.username}</span>

                {/* Status Badge */}
                <span
                    className={`text-xs font-semibold px-4 py-1 rounded-full ${(store.verificationStatus || store.status).toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : (store.verificationStatus || store.status).toLowerCase() === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                        }`}
                >
                    {(store.verificationStatus || store.status).toUpperCase()}
                </span>
            </div>

            <p className="text-slate-600 my-5 max-w-2xl">{store.description}</p>
            <p className="flex items-center gap-2">
                <MapPin size={16} />
                {displayAddress}
                {!defaultAddress && store.address && (
                    <span className="text-xs text-amber-600 ml-2">(Legacy)</span>
                )}
            </p>
            <p className="flex items-center gap-2"><Phone size={16} /> {store.contact}</p>
            <p className="flex items-center gap-2"><Mail size={16} />  {store.email}</p>
            <p className="text-slate-700 mt-5">Applied  on <span className="text-xs">{new Date(store.createdAt).toLocaleDateString()}</span> by</p>
            <div className="flex items-center gap-2 text-sm ">
                <Image width={36} height={36} src={store.user.image || assets.upload_area} alt={store.user.name} className="w-9 h-9 rounded-full" />
                <div>
                    <p className="text-slate-600 font-medium">{store.user.name}</p>
                    <p className="text-slate-400">{store.user.email}</p>
                </div>
            </div>
        </div>
    )
}

export default StoreInfo