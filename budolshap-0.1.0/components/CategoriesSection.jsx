/**
 * CategoriesSection.jsx
 *
 * WHY THIS EXISTS:
 *   Renders the "Shop by Category" tiles on the public homepage.
 *   Upgraded to use Framer Motion for a premium, alive feel.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCategoryLucideIcon, getCategoryColor } from '@/components/CategoryIcons'
import { ChevronRight, LayoutGrid, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Loading skeleton ─────────────────────────────────────────────────────────
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

// ─── Animation Variants ───────────────────────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CategoriesSection() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAll, setShowAll] = useState(false)

    useEffect(() => {
        fetch('/api/categories?flat=true')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Only show Level-1 (main) categories on the homepage
                    const top = data.filter(c => c.level === 1)
                    setCategories(top)
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const MAX_VISIBLE = 10
    const visible = showAll ? categories : categories.slice(0, MAX_VISIBLE)
    const hasMore = categories.length > MAX_VISIBLE

    return (
        <section className="max-w-7xl mx-auto px-6 py-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <LayoutGrid size={20} className="text-green-600" />
                    <h2 className="text-base font-semibold text-slate-700 tracking-wide">
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

            {/* Decorative divider */}
            <div className="h-px bg-gradient-to-r from-green-500 via-green-200 to-transparent mb-5" />

            {/* ── Content ── */}
            {loading ? (
                <CategoriesSkeleton />
            ) : categories.length === 0 ? (
                <FallbackCategories />
            ) : (
                <motion.div
                    layout
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2"
                >
                    <AnimatePresence mode='popLayout'>
                        {visible.map((cat, idx) => {
                            const color = getCategoryColor(idx)
                            // Resolve the Lucide icon component, prioritizing DB icon if available
                            const IconComponent = getCategoryLucideIcon(cat.slug, cat.name, cat.icon)

                            return (
                                <motion.div
                                    key={cat.id}
                                    layout
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ y: -5, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                                        className={`
                                            group flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl
                                            border border-transparent ${color.bg} ${color.hover}
                                            hover:shadow-md
                                            transition-all duration-200 cursor-pointer h-full
                                        `}
                                    >
                                        <span className={`flex items-center justify-center w-8 h-8 ${color.text}`}>
                                            <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                                        </span>
                                        <span className={`
                                            text-[10px] sm:text-xs font-medium text-center leading-tight
                                            text-slate-600 group-hover:text-slate-800
                                            line-clamp-2
                                        `}>
                                            {cat.name}
                                        </span>
                                    </Link>
                                </motion.div>
                            )
                        })}

                        {/* "All" tile */}
                        <motion.div
                            layout
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                href="/shop"
                                className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl
                                    border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100
                                    hover:shadow-md transition-all duration-200 cursor-pointer group h-full"
                            >
                                <span className="flex items-center justify-center w-8 h-8 text-slate-500">
                                    <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
                                </span>
                                <span className="text-[10px] sm:text-xs font-medium text-center text-slate-500 group-hover:text-slate-700 leading-tight">
                                    All
                                </span>
                            </Link>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            )}
        </section>
    )
}

// ─── Fallback static categories (DB empty) ────────────────────────────────────
function FallbackCategories() {
    const fallback = [
        { name: 'Electronics', slug: 'electronics', color: getCategoryColor(0) },
        { name: 'Fashion', slug: 'fashion', color: getCategoryColor(1) },
        { name: 'Home & Living', slug: 'home-living', color: getCategoryColor(2) },
        { name: 'Health & Beauty', slug: 'beauty-personal-care', color: getCategoryColor(3) },
        { name: 'Sports', slug: 'sports-outdoors', color: getCategoryColor(4) },
        { name: 'Toys & Kids', slug: 'toys-games-hobbies', color: getCategoryColor(5) },
        { name: 'Food & Grocery', slug: 'food-groceries', color: getCategoryColor(6) },
        { name: 'Books', slug: 'books', color: getCategoryColor(7) },
        { name: 'Automotive', slug: 'automotive', color: getCategoryColor(8) },
        { name: 'Pets', slug: 'pet-supplies', color: getCategoryColor(9) },
    ]

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2"
        >
            {fallback.map((cat, idx) => {
                const IconComponent = getCategoryLucideIcon(cat.slug, cat.name)
                return (
                    <motion.div
                        key={idx}
                        variants={itemVariants}
                        whileHover={{ y: -5, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link
                            href={`/shop?category=${cat.slug}`}
                            className={`
                                group flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl
                                border border-transparent ${cat.color.bg} ${cat.color.hover}
                                hover:shadow-md transition-all duration-200 h-full
                            `}
                        >
                            <span className={`flex items-center justify-center w-8 h-8 ${cat.color.text}`}>
                                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                            </span>
                            <span className="text-[10px] sm:text-xs font-medium text-center text-slate-600 group-hover:text-slate-800 leading-tight line-clamp-2">
                                {cat.name}
                            </span>
                        </Link>
                    </motion.div>
                )
            })}
            <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Link
                    href="/shop"
                    className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl
                        border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100
                        hover:shadow-md transition-all duration-200 cursor-pointer group h-full"
                >
                    <span className="flex items-center justify-center w-8 h-8 text-slate-500">
                        <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
                    </span>
                    <span className="text-[10px] sm:text-xs font-medium text-center text-slate-500 group-hover:text-slate-700 leading-tight">All</span>
                </Link>
            </motion.div>
        </motion.div>
    )
}
