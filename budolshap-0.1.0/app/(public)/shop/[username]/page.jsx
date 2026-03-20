'use client'
import ProductCard from "@/components/ProductCard"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { MailIcon, MapPinIcon } from "lucide-react"
import Loading from "@/components/Loading"
import Image from "next/image"

export default function StoreShop() {

    const { username } = useParams()
    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchStoreData = async () => {
            setLoading(true)
            setError(null)

            try {
                if (!username) {
                    throw new Error('Store username is missing.')
                }

                const storeResponse = await fetch(`/api/stores?username=${username}`)

                if (!storeResponse.ok) {
                    throw new Error('Unable to fetch store details.')
                }

                const stores = await storeResponse.json()
                const store = stores?.[0]

                if (!store) {
                    throw new Error('Store not found.')
                }

                setStoreInfo(store)

                const productsResponse = await fetch(`/api/products?storeId=${store.id}`)

                if (!productsResponse.ok) {
                    throw new Error('Unable to fetch store products.')
                }

                const productsData = await productsResponse.json()
                setProducts(productsData)
            } catch (err) {
                console.error('Error loading store page:', err)
                setError(err.message || 'Something went wrong. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        fetchStoreData()
    }, [username])

    if (loading) {
        return <Loading />
    }

    if (error) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-6">
                <div className="max-w-md text-center space-y-3">
                    <p className="text-lg font-semibold text-slate-800">Unable to load store</p>
                    <p className="text-sm text-slate-500">{error}</p>
                </div>
            </div>
        )
    }

    if (!storeInfo) {
        return null
    }

    return (
        <div className="min-h-[70vh] mx-6">

            {/* Store Info Banner */}
            <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
                {storeInfo.logo ? (
                    <Image
                        src={storeInfo.logo.startsWith('http') || storeInfo.logo.startsWith('/') || storeInfo.logo.startsWith('data:') ? storeInfo.logo : `/${storeInfo.logo}`}
                        alt={storeInfo.name || 'Store'}
                        className="size-32 sm:size-38 object-contain bg-white border-2 border-slate-100 rounded-md"
                        width={200}
                        height={200}
                        unoptimized
                    />
                ) : (
                    <div className="size-32 sm:size-38 flex items-center justify-center bg-slate-200 text-3xl font-semibold text-slate-700 rounded-md">
                        {storeInfo.name?.charAt(0) ?? '?'}
                    </div>
                )}
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-semibold text-slate-800">{storeInfo.name}</h1>
                    <p className="text-sm text-slate-600 mt-2 max-w-lg">{storeInfo.description}</p>
                    <div className="space-y-2 text-sm text-slate-500 mt-4">
                        {(storeInfo.addresses?.[0] || storeInfo.address) && (
                            <div className="flex items-center justify-center md:justify-start">
                                <MapPinIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <span>
                                    {storeInfo.addresses?.[0]
                                        ? [storeInfo.addresses[0].city, storeInfo.addresses[0].district].filter(Boolean).join(', ')
                                        : storeInfo.address}
                                </span>
                            </div>
                        )}
                        {storeInfo.email && (
                            <div className="flex items-center justify-center md:justify-start">
                                <MailIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{storeInfo.email}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className=" max-w-7xl mx-auto mb-40">
                <h1 className="text-2xl mt-12">Shop <span className="text-slate-800 font-medium">Products</span></h1>
                {products.length ? (
                    <div className="mt-5 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto">
                        {products.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                ) : (
                    <p className="mt-5 text-sm text-slate-500">This store has no products yet.</p>
                )}
            </div>
        </div>
    )
}