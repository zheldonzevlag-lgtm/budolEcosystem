'use client'
import { Suspense, useEffect, useRef, useState, useMemo } from "react"
import ProductCard from "@/components/ProductCard"
import Loading from "@/components/Loading"
import { MoveLeftIcon, ChevronRight, ChevronDown, SlidersHorizontal, X, Search, Filter, Star } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { setProduct } from "@/lib/features/product/productSlice"
import { useSearch } from "@/context/SearchContext"
import useSWR from 'swr'
import { getCategoryLucideIcon, getCategoryColor, renderCategoryIcon } from "@/components/CategoryIcons"
import { ShoppingCart as AllIcon } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { ProductSkeleton } from "@/components/ui/Skeleton"

function StarRating({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    size={12}
                    className={`${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                />
            ))}
        </div>
    )
}

function SearchFilters({ filters, setFilters, onClear, products = [] }) {
    const locations = ['Domestic', 'Overseas', 'Metro Manila', 'North Luzon', 'South Luzon', 'Visayas', 'Mindanao']
    const [showMoreLocations, setShowMoreLocations] = useState(false)

    // Calculate realistic max price from products or fallback to 50k
    const maxVal = (products && products.length > 0) ? Math.max(...products.map(p => Number(p.price) || 0)) : 50000
    // Context-Aware Scaling: Use the max product price (rounded up) as the slider max.
    // If no products are loaded, fallback to 50k for UI stability.
    const maxProductPrice = (products && products.length > 0)
        ? Math.max(Math.ceil(maxVal / 1000) * 1000, 1000)
        : 50000

    // Internal states for immediate slider feedback
    const [priceMin, setPriceMin] = useState(filters.priceRange.min || 0)
    const [priceMax, setPriceMax] = useState(filters.priceRange.max || maxProductPrice)
    const [rating, setRating] = useState(filters.rating || 0)

    // Sync internal state when filters are cleared or changed from parent
    useEffect(() => {
        setPriceMin(filters.priceRange.min || 0)
        // If max is empty, use the calculated maxProductPrice
        setPriceMax(filters.priceRange.max === '' || filters.priceRange.max === null ? maxProductPrice : filters.priceRange.max)
        setRating(filters.rating || 0)
    }, [filters.priceRange, filters.rating, maxProductPrice])

    const handleClear = () => {
        setPriceMin(0)
        setPriceMax(maxProductPrice)
        setRating(0)
        onClear()
    }

    const toggleLocation = (loc) => {
        setFilters(prev => {
            const locations = prev.locations.includes(loc)
                ? prev.locations.filter(l => l !== loc)
                : [...prev.locations, loc]
            return { ...prev, locations }
        })
    }

    return (
        <div className="px-4 py-4 space-y-6 border-t border-slate-100">
            {/* SEARCH FILTER Header */}
            <div className="flex items-center gap-2 mb-2">
                <Filter size={14} className="text-slate-700" />
                <span className="font-bold text-sm uppercase tracking-tight text-slate-800">Search Filter</span>
            </div>

            {/* Shipped From */}
            <div className="space-y-3">
                <p className="text-[13px] font-medium text-slate-700">Shipped From</p>
                <div className="space-y-2">
                    {locations.slice(0, 4).map(loc => (
                        <label key={loc} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.locations.includes(loc)}
                                onChange={() => toggleLocation(loc)}
                                className="w-3.5 h-3.5 accent-green-600 border-slate-300 rounded"
                            />
                            <span className="text-xs text-slate-600 group-hover:text-slate-900">{loc}</span>
                        </label>
                    ))}
                    {showMoreLocations && (
                        <div className="space-y-2">
                            {locations.slice(4).map(loc => (
                                <label key={loc} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.locations.includes(loc)}
                                        onChange={() => toggleLocation(loc)}
                                        className="w-3.5 h-3.5 accent-green-600 border-slate-300 rounded"
                                    />
                                    <span className="text-xs text-slate-600 group-hover:text-slate-900">{loc}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowMoreLocations(prev => !prev)}
                        className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800"
                    >
                        {showMoreLocations ? 'Less' : 'More'} <ChevronDown size={10} className={`${showMoreLocations ? 'rotate-180' : ''} transition-transform`} />
                    </button>
                </div>
            </div>

            {/* Price Range Slider & Inputs */}
            <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                    <p className="text-[13px] font-medium text-slate-700">Price Range</p>
                    <span className="text-[11px] text-green-600 font-bold font-mono">
                        ₱{Number(priceMin).toLocaleString()} - ₱{Number(priceMax).toLocaleString()}
                    </span>
                </div>

                {/* Visual Dual Slider */}
                <div className="relative h-6 flex items-center group px-1">
                    {/* Track Background */}
                    <div className="absolute h-[2px] w-full bg-slate-100 rounded-full left-0" />

                    {/* Active Track Overlay */}
                    <div
                        className="absolute h-[2px] bg-green-500 rounded-full"
                        style={{
                            left: `${(priceMin / maxProductPrice) * 100}%`,
                            width: `${((priceMax - priceMin) / maxProductPrice) * 100}%`
                        }}
                    />

                    {/* Min Handle Input */}
                    <input
                        type="range"
                        min="0"
                        max={maxProductPrice}
                        step="1"
                        value={priceMin}
                        onChange={(e) => {
                            const val = Math.min(Number(e.target.value), priceMax - 1)
                            setPriceMin(val)
                            setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, min: val } }))
                        }}
                        style={{ zIndex: priceMin > maxProductPrice / 2 ? 10 : 9 }}
                        className="absolute w-full h-[2px] appearance-none bg-transparent pointer-events-none left-0 cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-600 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-green-600 [&::-moz-range-thumb]:shadow-md"
                    />

                    {/* Max Handle Input */}
                    <input
                        type="range"
                        min="0"
                        max={maxProductPrice}
                        step="1"
                        value={priceMax}
                        onChange={(e) => {
                            const val = Math.max(Number(e.target.value), priceMin + 1)
                            setPriceMax(val)
                            setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, max: val } }))
                        }}
                        style={{ zIndex: priceMax < maxProductPrice / 2 ? 10 : 8 }}
                        className="absolute w-full h-[2px] appearance-none bg-transparent pointer-events-none left-0 cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-600 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-green-600 [&::-moz-range-thumb]:shadow-md"
                    />
                </div>

                {/* Helper Inputs for Manual Entry */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₱</span>
                        <input
                            type="number"
                            value={priceMin}
                            onChange={(e) => {
                                const val = Math.min(Number(e.target.value), priceMax - 1)
                                setPriceMin(val)
                                setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, min: val } }))
                            }}
                            className="w-full pl-5 pr-2 py-1 text-xs border border-slate-200 rounded focus:border-green-500 outline-none"
                        />
                    </div>
                    <div className="w-2 h-[1px] bg-slate-300" />
                    <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₱</span>
                        <input
                            type="number"
                            value={priceMax}
                            onChange={(e) => {
                                const val = Math.max(Number(e.target.value), priceMin + 1)
                                setPriceMax(val)
                                setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, max: val } }))
                            }}
                            className="w-full pl-5 pr-2 py-1 text-xs border border-slate-200 rounded focus:border-green-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Rating Slider */}
            <div className="space-y-4 pt-2 border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center">
                    <p className="text-[13px] font-medium text-slate-700">Minimum Rating</p>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">{rating}</span>
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    </div>
                </div>

                <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={rating}
                    onChange={(e) => {
                        const val = Number(e.target.value)
                        setRating(val)
                        setFilters(prev => ({ ...prev, rating: val }))
                    }}
                    className="w-full h-[2px] bg-slate-100 rounded-full appearance-none accent-green-600 cursor-pointer"
                />

                <div className="flex items-center gap-2">
                    <StarRating rating={Math.floor(rating)} />
                    <span className="text-[10px] text-slate-400">& Up</span>
                </div>
            </div>

            {/* Clear All */}
            <button
                onClick={handleClear}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide transition-colors border border-slate-200"
            >
                Clear All
            </button>
        </div>
    )
}

function CategorySidebar({ categories, activeSlug, onSelect, filters, setFilters, onClearFilters, products = [] }) {
    const [expanded, setExpanded] = useState({})
    const router = useRouter()

    const level1 = categories.filter(c => c.level === 1)
    const level2 = categories.filter(c => c.level === 2)
    const level3 = categories.filter(c => c.level === 3)

    const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

    const handleSelect = (slug) => {
        onSelect(slug)
        router.push(slug ? `/shop?category=${encodeURIComponent(slug)}` : '/shop')
    }

    return (
        <aside className="w-56 flex-shrink-0">
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            <div className="bg-white border border-slate-100 shadow-sm overflow-hidden sticky top-4">
                {/* Header */}
                <div className="px-4 py-3 bg-white border-b border-slate-100">
                    <p className="font-bold text-sm tracking-wide text-slate-800">Categories</p>
                </div>

                <div className="overflow-y-auto max-h-[70vh] py-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* All */}
                    <button
                        onClick={() => handleSelect('')}
                        className={`flex items-center gap-2 w-full pl-4 pr-6 py-2.5 text-sm transition-colors text-left
                            ${!activeSlug ? 'text-green-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                        {/* Lucide icon replaces 🛒 emoji for consistency */}
                        <AllIcon size={16} className="flex-shrink-0" />
                        All Products
                    </button>

                    {level1.map((cat, idx) => {
                        const subs = level2.filter(c => c.parentId === cat.id)
                        const isActive = activeSlug === cat.slug
                        const hasActiveSub = subs.some(s =>
                            s.slug === activeSlug ||
                            level3.filter(c => c.parentId === s.id).some(t => t.slug === activeSlug)
                        )
                        const isExpanded = expanded[cat.id] || hasActiveSub || isActive
                        // Resolve Lucide icon component for this Level-1 category, prioritizing DB override
                        const CatIcon = getCategoryLucideIcon(cat.slug, cat.name, cat.icon)

                        return (
                            <div key={cat.id}>
                                <button
                                    onClick={() => {
                                        handleSelect(cat.slug)
                                        if (subs.length > 0) toggle(cat.id)
                                    }}
                                    className={`flex items-center gap-2 w-full pl-4 pr-6 py-2.5 text-sm transition-colors text-left
                                        ${isActive || hasActiveSub ? 'text-green-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {/* Lucide icon – vector, scales cleanly, no OS variation */}
                                    <CatIcon size={16} className="flex-shrink-0" />
                                    <span className="flex-1 truncate">{cat.name}</span>
                                    {subs.length > 0 && (
                                        <ChevronDown
                                            size={14}
                                            className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    )}
                                </button>

                                {/* Level 2 */}
                                {subs.length > 0 && isExpanded && (
                                    <div className="border-l-2 border-slate-100 ml-4">
                                        {subs.map(sub => {
                                            const subSubs = level3.filter(c => c.parentId === sub.id)
                                            const isSubActive = activeSlug === sub.slug
                                            const isSubExpanded = expanded[sub.id] || subSubs.some(t => t.slug === activeSlug)

                                            return (
                                                <div key={sub.id}>
                                                    <button
                                                        onClick={() => {
                                                            handleSelect(sub.slug)
                                                            if (subSubs.length > 0) toggle(sub.id)
                                                        }}
                                                        className={`flex items-center gap-1.5 w-full pl-3 pr-6 py-2 text-xs transition-colors text-left -ml-[2px]
                                                            ${isSubActive ? 'text-green-700 font-semibold' : 'text-slate-600 hover:text-slate-800'}`}
                                                    >
                                                        <ChevronRight size={12} className="flex-shrink-0" />
                                                        <span className="flex-1 truncate">{sub.name}</span>
                                                        {subSubs.length > 0 && (
                                                            <ChevronDown
                                                                size={12}
                                                                className={`transition-transform flex-shrink-0 ${isSubExpanded ? 'rotate-180' : ''}`}
                                                            />
                                                        )}
                                                    </button>

                                                    {/* Level 3 */}
                                                    {subSubs.length > 0 && isSubExpanded && (
                                                        <div className="ml-1">
                                                            {subSubs.map(sub3 => (
                                                                <button
                                                                    key={sub3.id}
                                                                    onClick={() => handleSelect(sub3.slug)}
                                                                    className={`flex items-center gap-1 w-full pl-3 pr-6 py-1.5 text-xs transition-colors text-left
                                                                        ${activeSlug === sub3.slug ? 'text-green-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                                                                >
                                                                    <span className="text-slate-300 mr-1">·</span>
                                                                    <span className="truncate">{sub3.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {level1.length === 0 && (
                        <p className="px-4 py-3 text-xs text-slate-400">No categories yet</p>
                    )}
                </div>

                {/* Filters Section */}
                <SearchFilters
                    filters={filters}
                    setFilters={setFilters}
                    onClear={onClearFilters}
                    products={products}
                />
            </div>
        </aside>
    )
}

function ShopContent() {
    const searchParams = useSearchParams()
    const urlSearch = searchParams.get('search')
    const category = searchParams.get('category')
    const router = useRouter()
    const dispatch = useDispatch()
    const { searchQuery, updateSearchQuery } = useSearch()
    const lastUrlSearch = useRef(null)
    const [categories, setCategories] = useState([])
    const [showMobileSidebar, setShowMobileSidebar] = useState(false)
    const [filters, setFilters] = useState({
        locations: [],
        priceRange: { min: '', max: '' },
        rating: null
    })

    const clearFilters = () => {
        setFilters({
            locations: [],
            priceRange: { min: '', max: '' },
            rating: null
        })
    }

    useEffect(() => {
        if (urlSearch !== lastUrlSearch.current) {
            updateSearchQuery(urlSearch || '')
            lastUrlSearch.current = urlSearch
        }
    }, [urlSearch, updateSearchQuery])


    useEffect(() => {
        fetch('/api/categories?flat=true')
            .then(r => r.json())
            .then(data => Array.isArray(data) && setCategories(data))
            .catch(() => { })
    }, [])

    const products = useSelector(state => state.product.list)

    const productsApiPath = category ? `/api/products?category=${encodeURIComponent(category)}&limit=100` : '/api/products?limit=100'
    const { data, error, isLoading } = useSWR(productsApiPath, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 5000,
        onSuccess: (data) => {
            if (JSON.stringify(data) !== JSON.stringify(products)) dispatch(setProduct(data))
        }
    })

    const activeSearch = searchQuery.trim()

    const descendantSlugs = useMemo(() => {
        if (!category) return null
        const byParent = new Map()
        categories.forEach(c => {
            const arr = byParent.get(c.parentId) || []
            arr.push(c)
            byParent.set(c.parentId, arr)
        })
        const root = categories.find(c => c.slug === category)
        if (!root) return new Set([category])
        const result = new Set([root.slug])
        const stack = [root.id]
        while (stack.length) {
            const pid = stack.pop()
            const children = byParent.get(pid) || []
            children.forEach(child => {
                result.add(child.slug)
                stack.push(child.id)
            })
        }
        return result
    }, [categories, category])

    const filteredProducts = products.filter(product => {
        const matchesSearch = activeSearch ? product.name.toLowerCase().includes(activeSearch.toLowerCase()) : true
        const matchesCategory = descendantSlugs ? descendantSlugs.has(product.categorySlug) : true

        // Price filtering
        const price = product.price || 0
        const matchesPriceMin = filters.priceRange.min ? price >= parseFloat(filters.priceRange.min) : true
        const matchesPriceMax = filters.priceRange.max ? price <= parseFloat(filters.priceRange.max) : true

        // Rating filtering (if product has rating data)
        const matchesRating = filters.rating ? (product.rating || 0) >= filters.rating : true

        // Location filtering logic
        let matchesLocation = true
        if (filters.locations.length > 0) {
            const productLoc = product.location || 'Domestic'
            matchesLocation = filters.locations.some(loc => {
                if (loc === 'Domestic') {
                    // "Domestic" matches any Philippine region
                    return ['Metro Manila', 'North Luzon', 'South Luzon', 'Visayas', 'Mindanao', 'Domestic'].includes(productLoc)
                }
                if (loc === 'Overseas') {
                    return productLoc === 'Overseas'
                }
                // Specific region match
                return loc === productLoc
            })
        }

        return matchesSearch && matchesCategory && matchesPriceMin && matchesPriceMax && matchesRating && matchesLocation
    })

    // Find active category name for display
    const activeCat = categories.find(c => c.slug === category)

    return (
        <div className="min-h-[70vh] mx-4 sm:mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrumb / Title bar */}
                <div className="flex items-center gap-2 my-5">
                    <button
                        onClick={() => router.push('/shop')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
                    >
                        {(activeSearch || category) && <MoveLeftIcon size={16} />}
                        All Products
                    </button>
                    {activeCat && (
                        <>
                            <ChevronRight size={14} className="text-slate-300" />
                            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                {renderCategoryIcon(activeCat.slug, activeCat.name, activeCat.icon, 'w-5 h-5 text-slate-500')}
                                {activeCat.name}
                            </span>
                        </>
                    )}
                    {activeSearch && (
                        <>
                            <ChevronRight size={14} className="text-slate-300" />
                            <span className="text-sm text-slate-500">"{activeSearch}"</span>
                        </>
                    )}
                </div>

                <div className="flex gap-6 relative">
                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block">
                        <CategorySidebar
                            categories={categories}
                            activeSlug={category}
                            onSelect={() => { }}
                            filters={filters}
                            setFilters={setFilters}
                            onClearFilters={clearFilters}
                            products={products}
                        />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Filters bar */}
                        <div className="flex items-center justify-between mb-5 gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowMobileSidebar(true)}
                                    className="lg:hidden flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition"
                                >
                                    <SlidersHorizontal size={16} />
                                    Categories
                                </button>
                                <p className="text-sm text-slate-500">
                                    <span className="font-medium text-slate-700">{filteredProducts.length}</span> products found
                                </p>
                            </div>

                            {/* Active category chip */}
                            {category && (
                                <button
                                    onClick={() => router.push('/shop')}
                                    className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1.5 hover:bg-green-100 transition"
                                >
                                    {renderCategoryIcon(activeCat?.slug, activeCat?.name, activeCat?.icon, 'w-3 h-3')}
                                    {activeCat?.name || category}
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Products grid */}
                        {error ? (
                            <p className="text-red-500">{error.message || 'Failed to load products'}</p>
                        ) : (isLoading && products.length === 0) ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-32">
                                {Array(8).fill(0).map((_, i) => (
                                    <ProductSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Search size={48} className="text-slate-200 mb-4" />
                                <p className="text-slate-500 font-medium">No products found.</p>
                                <p className="text-slate-400 text-sm mt-1">Try a different category or search term.</p>
                                <button
                                    onClick={() => router.push('/shop')}
                                    className="mt-4 text-sm text-green-600 hover:underline"
                                >
                                    Browse all products
                                </button>
                            </div>
                        ) : (
                            <motion.div
                                layout
                                className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-32"
                            >
                                <AnimatePresence mode='popLayout'>
                                    {filteredProducts.map((product, index) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            index={index % 12}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile sidebar drawer */}
            {showMobileSidebar && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileSidebar(false)} />
                    <div className="relative z-10 bg-white w-72 h-full shadow-xl flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 text-slate-800">
                            <span className="font-bold text-sm tracking-wide">Categories</span>
                            <button onClick={() => setShowMobileSidebar(false)} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <CategorySidebar
                                categories={categories}
                                activeSlug={category}
                                onSelect={() => setShowMobileSidebar(false)}
                                filters={filters}
                                setFilters={setFilters}
                                onClearFilters={clearFilters}
                                products={products || []}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function Shop() {
    return (
        <Suspense fallback={<Loading />}>
            <ShopContent />
        </Suspense>
    )
}
