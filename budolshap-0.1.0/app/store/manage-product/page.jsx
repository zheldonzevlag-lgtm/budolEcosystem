'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Plus } from "lucide-react"
import { getCategoryIcon } from "@/components/CategoryIcons"

// Helper function to convert HTML to plain text and truncate
const formatDescription = (html, maxLength = 50) => {
    if (!html) return '';

    // Remove HTML tags
    const plainText = html.replace(/<[^>]*>/g, '').trim();

    // Decode HTML entities
    const decoded = plainText
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Truncate if needed
    if (decoded.length <= maxLength) return decoded;
    return decoded.substring(0, maxLength) + '...';
};

export default function StoreManageProducts() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])

    const fetchProducts = async () => {
        if (authLoading) return
        try {
            if (!user) {
                toast.error("Please login first")
                setLoading(false)
                return
            }

            // Get user's store
            const storeResponse = await fetch(`/api/stores/user/${user.id}`)
            if (!storeResponse.ok) {
                setProducts([])
                setLoading(false)
                return
            }
            const store = await storeResponse.json()
            if (!store) {
                setProducts([])
                setLoading(false)
                return
            }

            // Get products for this store
            const productsResponse = await fetch(`/api/products?storeId=${store.id}`)
            if (productsResponse.ok) {
                const productsData = await productsResponse.json()
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
            const product = products.find(p => p.id === productId)
            if (!product) return

            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inStock: !product.inStock
                })
            })

            const data = await response.json()

            if (response.ok) {
                // Update local state
                setProducts(products.map(p =>
                    p.id === productId ? { ...p, inStock: !p.inStock } : p
                ))
            } else {
                toast.error(data.error || "Failed to update product stock")
            }
        } catch (error) {
            console.error("Error toggling stock:", error)
            toast.error("Failed to update product stock")
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [authLoading, user])

    if (loading) return <Loading />

    const deleteProduct = async (productId) => {
        if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
            return
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (response.ok) {
                toast.success("Product deleted successfully!")
                // Remove from local state
                setProducts(products.filter(p => p.id !== productId))
            } else {
                toast.error(data.error || "Failed to delete product")
            }
        } catch (error) {
            console.error("Error deleting product:", error)
            toast.error("Failed to delete product")
        }
    }

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h1 className="text-2xl text-slate-500">Manage <span className="text-slate-800 font-medium">Products</span></h1>
                    <p className="text-sm text-slate-400 mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
                </div>
                <button
                    onClick={() => router.push('/store/add-product')}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition text-sm font-medium shadow-sm"
                >
                    <Plus size={16} /> Add Product
                </button>
            </div>
            {products.length === 0 ? (
                <p className="text-slate-400">No products found. Add your first product to get started!</p>
            ) : (
                <table className="w-full text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                    <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 hidden sm:table-cell text-left">Category</th>
                            <th className="px-4 py-3 hidden md:table-cell text-left">SRP</th>
                            <th className="px-4 py-3 text-left">Price</th>
                            <th className="px-4 py-3 text-left">In Stock</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {products.map((product) => (
                            <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-3 align-middle">
                                    <div className="flex gap-2 items-center">
                                        <Image
                                            width={40}
                                            height={40}
                                            className='p-1 shadow rounded cursor-pointer'
                                            src={(() => {
                                                const imgs = product.images;
                                                let firstImg = '/placeholder.png';

                                                if (Array.isArray(imgs) && imgs.length > 0) {
                                                    const item = imgs[0];
                                                    firstImg = typeof item === 'object' && item.url ? item.url : item;
                                                } else if (typeof imgs === 'string' && imgs) {
                                                    firstImg = imgs;
                                                }

                                                return typeof firstImg === 'string' ? firstImg : '/placeholder.png';
                                            })()}
                                            alt={product.name}
                                        />
                                        {product.name}
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell align-middle">
                                    {product.category ? (
                                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium">
                                            <span>{getCategoryIcon(product.categorySlug || product.category, product.category)}</span>
                                            <span className="truncate max-w-[80px]">{product.category}</span>
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-300">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap align-middle">{currency} {product.mrp.toLocaleString()}</td>
                                <td className="px-4 py-3 whitespace-nowrap align-middle">{currency} {product.price.toLocaleString()}</td>
                                <td className="px-4 py-3 text-center align-middle">
                                    <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                        <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating data..." })} checked={product.inStock} />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    <div className="flex items-center gap-2">
                                        <div className="relative group">
                                            <button
                                                onClick={() => router.push(`/store/add-product?id=${product.id}`)}
                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded transition"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                Edit Product
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <button
                                                onClick={() => deleteProduct(product.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                Delete Product
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    )
}