'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCategoryIcon, getCategoryColor } from '@/components/CategoryIcons'
import { ChevronRight, LayoutGrid } from 'lucide-react'

const CategoriesSkeleton = () => (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 mt-4">
        {Array(10).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="w-14 h-3 bg-slate-200 rounded" />
            </div>
        ))}
    </div>
)

export default function CategoriesSection() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAll, setShowAll] = useState(false)

    useEffect(() => {
        fetch('/api/categories?flat=true')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Only show level 1 categories (top-level)
                    const top = data.filter(c => c.level === 1)
                    setCategories(top)
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    // Decide how many to show
    const MAX_VISIBLE = 10
    const visible = showAll ? categories : categories.slice(0, MAX_VISIBLE)
    const hasMore = categories.length > MAX_VISIBLE

    return (
        <section className="max-w-7xl mx-auto px-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <LayoutGrid size={20} className="text-green-600" />
                    <h2 className="text-base font-semibold text-slate-700 uppercase tracking-wide">
                        Shop by Category
                    </h2>
                </div>
                {hasMore && (
                    <button
                        onClick={() => setShowAll(prev => !prev)}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                        {showAll ? 'Show Less' : 'See All'}
                        <ChevronRight
                            size={16}
                            className={`transition-transform ${showAll ? 'rotate-90' : ''}`}
                        />
                    </button>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-green-500 via-green-200 to-transparent mb-5" />

            {loading ? (
                <CategoriesSkeleton />
            ) : categories.length === 0 ? (
                /* Fallback: static categories if DB is empty */
                <FallbackCategories />
            ) : (
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {visible.map((cat, idx) => {
                        const color = getCategoryColor(idx)
                        const icon = getCategoryIcon(cat.slug, cat.name)
                        return (
                            <Link
                                key={cat.id}
                                href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                                className={`
                                    group flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl
                                    border border-transparent ${color.bg} ${color.hover}
                                    hover:border-current hover:shadow-sm
                                    transition-all duration-200 active:scale-95 cursor-pointer
                                `}
                            >
                                <span className="text-2xl sm:text-3xl leading-none select-none">
                                    {icon}
                                </span>
                                <span className={`
                                    text-[10px] sm:text-xs font-medium text-center leading-tight
                                    text-slate-600 group-hover:text-slate-800
                                    line-clamp-2
                                `}>
                                    {cat.name}
                                </span>
                            </Link>
                        )
                    })}

                    {/* "All Categories" tile */}
                    <Link
                        href="/shop"
                        className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl
                            border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100
                            transition-all duration-200 active:scale-95 cursor-pointer group"
                    >
                        <span className="text-2xl sm:text-3xl leading-none select-none">🛒</span>
                        <span className="text-[10px] sm:text-xs font-medium text-center text-slate-500 group-hover:text-slate-700 leading-tight">
                            All
                        </span>
                    </Link>
                </div>
            )}
        </section>
    )
}

// Fallback static categories when DB is empty
function FallbackCategories() {
    const fallback = [
        { name: 'Electronics', slug: 'electronics', icon: '🖥️', color: getCategoryColor(0) },
        { name: 'Fashion', slug: 'fashion', icon: '👗', color: getCategoryColor(1) },
        { name: 'Home & Living', slug: 'home-living', icon: '🏠', color: getCategoryColor(2) },
        { name: 'Health & Beauty', slug: 'health-beauty', icon: '💄', color: getCategoryColor(3) },
        { name: 'Sports', slug: 'sports', icon: '⚽', color: getCategoryColor(4) },
        { name: 'Toys & Kids', slug: 'toys', icon: '🧸', color: getCategoryColor(5) },
        { name: 'Food & Grocery', slug: 'food', icon: '🥘', color: getCategoryColor(6) },
        { name: 'Books', slug: 'books', icon: '📚', color: getCategoryColor(7) },
        { name: 'Automotive', slug: 'automotive', icon: '🚗', color: getCategoryColor(8) },
        { name: 'Pets', slug: 'pets', icon: '🐾', color: getCategoryColor(9) },
    ]

    return (
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {fallback.map((cat, idx) => (
                <Link
                    key={idx}
                    href={`/shop?category=${cat.slug}`}
                    className={`
                        group flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl
                        border border-transparent ${cat.color.bg} ${cat.color.hover}
                        hover:shadow-sm transition-all duration-200 active:scale-95
                    `}
                >
                    <span className="text-2xl sm:text-3xl leading-none select-none">{cat.icon}</span>
                    <span className="text-[10px] sm:text-xs font-medium text-center text-slate-600 group-hover:text-slate-800 leading-tight line-clamp-2">
                        {cat.name}
                    </span>
                </Link>
            ))}
            <Link
                href="/shop"
                className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl
                    border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100
                    transition-all duration-200 active:scale-95 cursor-pointer group"
            >
                <span className="text-2xl sm:text-3xl leading-none">🛒</span>
                <span className="text-[10px] sm:text-xs font-medium text-center text-slate-500 group-hover:text-slate-700 leading-tight">All</span>
            </Link>
        </div>
    )
}
