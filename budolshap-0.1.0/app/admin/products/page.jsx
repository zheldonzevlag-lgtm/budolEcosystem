'use client'
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import { ShoppingBasket, Search, Trash2, Edit, Eye, EyeOff, Store } from "lucide-react"
import Link from "next/link"
import { useSearch } from "@/context/SearchContext"

export default function AdminProducts() {
    const { searchQuery, updateSearchQuery } = useSearch()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterInStock, setFilterInStock] = useState('all') // 'all', 'inStock', 'outOfStock'

    const fetchProducts = async () => {
        try {
            let url = '/api/admin/products?'
            if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`
            if (filterInStock === 'inStock') url += 'inStock=true&'
            if (filterInStock === 'outOfStock') url += 'inStock=false&'

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(url, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const productsData = await response.json()
                setProducts(productsData)
            } else {
                setProducts([])
            }
        } catch (error) {
            console.error("Error fetching products:", error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const toggleStock = async (productId) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    inStock: !products.find(p => p.id === productId)?.inStock
                })
            })

            if (response.ok) {
                setProducts(products.map(p =>
                    p.id === productId ? { ...p, inStock: !p.inStock } : p
                ))
                toast.success('Product stock updated')
            } else {
                toast.error("Failed to update product")
            }
        } catch (error) {
            console.error("Error updating product:", error)
            toast.error("Failed to update product")
        }
    }

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return
        }

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                toast.success('Product deleted successfully')
                setProducts(products.filter(p => p.id !== productId))
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to delete product")
            }
        } catch (error) {
            console.error("Error deleting product:", error)
            toast.error("Failed to delete product")
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [searchQuery, filterInStock])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl">Manage <span className="text-slate-800 font-medium">Products</span></h1>

                <div className="flex items-center gap-2">
                    <select
                        value={filterInStock}
                        onChange={(e) => setFilterInStock(e.target.value)}
                        className="bg-slate-100 px-4 py-2 rounded-lg outline-none border border-slate-200"
                    >
                        <option value="all">All Products</option>
                        <option value="inStock">In Stock</option>
                        <option value="outOfStock">Out of Stock</option>
                    </select>

                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                        <Search size={18} className="text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => updateSearchQuery(e.target.value)}
                            className="bg-transparent outline-none w-64"
                        />
                    </div>
                </div>
            </div>

            {products.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {products.map((product) => {
                        const videoUrl = Array.isArray(product.videos) ? product.videos[0] : (product.videos?.url || product.videos)
                        const hasVideo = !!videoUrl
                        return (
                        <div key={product.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                            <div className="relative w-full h-48 bg-slate-100 rounded-lg mb-3 overflow-hidden">
                                {Array.isArray(product.images) && product.images[0] ? (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.name}
                                        fill
                                        className="object-contain"
                                    />
                                ) : hasVideo ? (
                                    <video src={videoUrl} className="w-full h-full object-cover" muted playsInline />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ShoppingBasket size={48} className="text-slate -300" />
                                    </div>
                                )}
                                {hasVideo && (
                                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                                        Video
                                    </span>
                                )}
                                {!product.inStock && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                        Out of Stock
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800 line-clamp-1">{product.name}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{product.description?.replace(/<[^>]*>?/gm, '')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-2 text-sm">
                                    <span className="text-green-600 font-semibold">{currency}{product.price.toLocaleString()}</span>
                                    <span className="text-slate-400 line-through">{currency}{product.mrp.toLocaleString()}</span>
                                    <span className="text-xs text-slate-500">({product.category})</span>
                                </div>

                                <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                                    <Store size={14} />
                                    <span>{product.store?.name || 'Unknown Store'}</span>
                                    {hasVideo && (
                                        <span className="ml-auto text-[10px] font-semibold text-slate-500">
                                            Videos: {Array.isArray(product.videos) ? product.videos.length : 1}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                                    <button
                                        onClick={() => toggleStock(product.id)}
                                        className={`flex-1 px-3 py-2 rounded-md text-sm transition ${product.inStock
                                            ? 'bg-amber-200 text-slate-600 hover:bg-amber-300'
                                            : 'bg-green-200 text-green-600 hover:bg-green-300'
                                            }`}
                                        title={product.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                                    >
                                        {product.inStock ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <Link
                                        href={`/product/${product.id}`}
                                        target="_blank"
                                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-md text-sm transition text-center"
                                    >
                                        View
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-md text-sm transition"
                                        title="Delete Product"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No products found</h1>
                </div>
            )}
        </div>
    )
}
