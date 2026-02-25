'use client'
import { assets } from "@/assets/assets"
import { ArrowRight, StarIcon, UserCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { formatManilaTime } from "@/lib/dateUtils"

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Description')

    return (
        <div className="my-18 text-sm text-slate-600">

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-200 mb-4 max-w-2xl">
                {['Description', 'Reviews'].map((tab, index) => (
                    <button className={`${tab === selectedTab ? 'border-b-2 border-slate-700 font-semibold text-slate-800' : 'text-slate-400'} pb-2 px-1 font-medium transition-colors`} key={index} onClick={() => setSelectedTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description */}
            {selectedTab === "Description" && (
                <div className="max-w-xl ck-content" dangerouslySetInnerHTML={{ __html: product.description }} />
            )}

            {/* Reviews */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-3 mt-4">
                    {Array.isArray(product?.rating) && product.rating.map((item, index) => (
                        <div key={index} className="flex gap-5 mb-10">
                            {item.user.image ? (
                                <Image src={item.user.image} alt={item.user.name} className="size-10 rounded-full object-cover" width={100} height={100} />
                            ) : (
                                <UserCircle className="size-10 text-slate-400" />
                            )}
                            <div>
                                <div className="flex items-center" >
                                    {Array(5).fill('').map((_, index) => (
                                        <StarIcon key={index} size={18} className='text-transparent mt-0.5' fill={item.rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                                    ))}
                                </div>
                                <p className="text-sm max-w-lg my-4">{item.review}</p>
                                <p className="font-medium text-slate-800">{item.user.name}</p>
                                <p className="mt-3 font-light">{formatManilaTime(item.createdAt, { dateStyle: 'medium' })}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Store Page */}
            <div className="flex gap-3 mt-4">
                {product.store.logo ? (
                    <Image src={product.store.logo} alt={product.store.name} className="size-11 rounded-full ring ring-slate-400 object-cover" width={100} height={100} />
                ) : (
                    <div className="size-11 rounded-full ring ring-slate-400 bg-slate-100 flex items-center justify-center">
                        <UserCircle className="size-8 text-slate-400" />
                    </div>
                )}
                <div>
                    <p className="text-sm text-slate-500">Product by</p>
                    <p className="font-bold text-slate-800 text-sm">{product.store.name}</p>
                    <Link href={`/shop/${product.store.username}`} className="flex items-center gap-1.5 text-green-500"> view store <ArrowRight size={14} /></Link>
                </div>
            </div>
        </div>
    )
}

export default ProductDescription