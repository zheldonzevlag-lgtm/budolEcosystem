'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Check, Loader2, X, ChevronDown, Search } from 'lucide-react'
import { getCategoryLucideIcon, getCategoryColor } from '@/components/CategoryIcons'

export default function CategorySelector({ value, onChange, error }) {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedLevel1, setSelectedLevel1] = useState(null)
    const [selectedLevel2, setSelectedLevel2] = useState(null)
    const [selectedLevel3, setSelectedLevel3] = useState(null)
    const [search, setSearch] = useState('')
    const dropdownRef = useRef(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories?flat=true')
            const data = await res.json()
            if (res.ok) setCategories(data)
        } catch { }
        finally { setLoading(false) }
    }

    const level1Categories = categories.filter(c => c.level === 1)
    const level2Categories = categories.filter(c => c.level === 2 && c.parentId === selectedLevel1?.id)
    const level3Categories = categories.filter(c => c.level === 3 && c.parentId === selectedLevel2?.id)

    // Flat search results
    const searchResults = search.length >= 2
        ? categories.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.slug.toLowerCase().includes(search.toLowerCase())
        )
        : []

    const getDisplayText = () => {
        if (!selectedLevel1) return null
        const parts = [selectedLevel1.name]
        if (selectedLevel2) parts.push(selectedLevel2.name)
        if (selectedLevel3) parts.push(selectedLevel3.name)
        return parts
    }

    const displayParts = getDisplayText()

    const handleLevel1Select = (cat) => {
        setSelectedLevel1(cat)
        setSelectedLevel2(null)
        setSelectedLevel3(null)
        onChange(cat.id)
    }

    const handleLevel2Select = (cat) => {
        setSelectedLevel2(cat)
        setSelectedLevel3(null)
        onChange(cat.id)
    }

    const handleLevel3Select = (cat) => {
        setSelectedLevel3(cat)
        onChange(cat.id)
        setIsOpen(false)
    }

    const handleSearchSelect = (cat) => {
        // Build full path
        if (cat.level === 1) {
            setSelectedLevel1(cat)
            setSelectedLevel2(null)
            setSelectedLevel3(null)
            onChange(cat.id)
        } else if (cat.level === 2) {
            const parent = categories.find(c => c.id === cat.parentId)
            setSelectedLevel1(parent || null)
            setSelectedLevel2(cat)
            setSelectedLevel3(null)
            onChange(cat.id)
        } else if (cat.level === 3) {
            const parent2 = categories.find(c => c.id === cat.parentId)
            const parent1 = parent2 ? categories.find(c => c.id === parent2.parentId) : null
            setSelectedLevel1(parent1 || null)
            setSelectedLevel2(parent2 || null)
            setSelectedLevel3(cat)
            onChange(cat.id)
        }
        setIsOpen(false)
        setSearch('')
    }

    const clearSelection = (e) => {
        e.stopPropagation()
        setSelectedLevel1(null)
        setSelectedLevel2(null)
        setSelectedLevel3(null)
        onChange('')
    }

    // Reset when value cleared externally
    useEffect(() => {
        if (!value && categories.length > 0) {
            setSelectedLevel1(null)
            setSelectedLevel2(null)
            setSelectedLevel3(null)
        }
    }, [value, categories])

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm">
                <Loader2 size={16} className="animate-spin text-green-500" />
                Loading categories...
            </div>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl bg-white 
                    focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm
                    ${error ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200 hover:border-slate-300'}`}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {displayParts ? (
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            {displayParts.map((part, i) => (
                                <span key={i} className="flex items-center gap-1 min-w-0">
                                    {i > 0 && <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />}
                                    <span className={`text-sm ${i === displayParts.length - 1 ? 'font-medium text-slate-800' : 'text-slate-400'} truncate`}>
                                        {part}
                                    </span>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-slate-400">Select Category</span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {displayParts && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={clearSelection}
                            onKeyDown={e => e.key === 'Enter' && clearSelection(e)}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                            <X size={14} />
                        </span>
                    )}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

            {/* Dropdown panel */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                    {/* Search bar */}
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search categories..."
                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Search results mode */}
                    {search.length >= 2 ? (
                        <div className="p-2 max-h-64 overflow-y-auto">
                            {searchResults.length === 0 ? (
                                <p className="text-xs text-slate-400 px-3 py-2">No results for "{search}"</p>
                            ) : (
                                searchResults.map(cat => {
                                    const parent2 = cat.level > 1 ? categories.find(c => c.id === cat.parentId) : null
                                    const parent1 = parent2 ? categories.find(c => c.id === parent2.parentId) : null
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleSearchSelect(cat)}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 transition text-left"
                                        >
                                            {/* Lucide icon for search results – replaces emoji */}
                                            {(() => { const SI = getCategoryLucideIcon(cat.slug, cat.name); return <SI size={16} className="flex-shrink-0 text-slate-500" /> })()}
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                                                {(parent1 || parent2) && (
                                                    <p className="text-xs text-slate-400">
                                                        {[parent1?.name, parent2?.name].filter(Boolean).join(' › ')}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    ) : (
                        /* Shopee-style 3-column drill-down */
                        <div className="flex border-t border-slate-100" style={{ maxHeight: '280px' }}>
                            {/* Column 1 – Level 1 */}
                            <div className="w-1/3 border-r border-slate-100 overflow-y-auto">
                                <p className="px-3 py-2 text-[10px] uppercase tracking-widest font-semibold text-slate-400 bg-slate-50 sticky top-0">Main</p>
                                {level1Categories.length === 0 ? (
                                    <p className="text-xs text-slate-400 px-3 py-2">No categories</p>
                                ) : level1Categories.map((cat, idx) => {
                                    const active = selectedLevel1?.id === cat.id
                                    const color = getCategoryColor(idx)
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleLevel1Select(cat)}
                                            className={`flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm transition
                                                ${active ? `${color.bg} font-semibold text-slate-800 border-r-2 border-green-500` : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {/* Lucide icon for Level-1 column */}
                                            {(() => { const L1I = getCategoryLucideIcon(cat.slug, cat.name); return <L1I size={16} className={`flex-shrink-0 ${active ? color.text : 'text-slate-400'}`} /> })()
                                            }
                                            <span className="truncate flex-1">{cat.name}</span>
                                            {level2Categories.length > 0 && active && (
                                                <ChevronRight size={12} className="text-green-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Column 2 – Level 2 */}
                            <div className="w-1/3 border-r border-slate-100 overflow-y-auto">
                                <p className="px-3 py-2 text-[10px] uppercase tracking-widest font-semibold text-slate-400 bg-slate-50 sticky top-0">Sub</p>
                                {!selectedLevel1 ? (
                                    <p className="text-xs text-slate-300 px-3 py-3 italic">Select main first</p>
                                ) : level2Categories.length === 0 ? (
                                    <div className="px-3 py-3 text-center">
                                        <Check size={16} className="text-green-500 mx-auto mb-1" />
                                        <p className="text-xs text-slate-400">No sub-categories</p>
                                    </div>
                                ) : level2Categories.map(cat => {
                                    const active = selectedLevel2?.id === cat.id
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleLevel2Select(cat)}
                                            className={`flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm transition
                                                ${active ? 'bg-green-50 font-semibold text-slate-800 border-r-2 border-green-500' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <span className="truncate flex-1">{cat.name}</span>
                                            {active && level3Categories.length > 0 && (
                                                <ChevronRight size={12} className="text-green-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Column 3 – Level 3 */}
                            <div className="w-1/3 overflow-y-auto">
                                <p className="px-3 py-2 text-[10px] uppercase tracking-widest font-semibold text-slate-400 bg-slate-50 sticky top-0">Specific</p>
                                {!selectedLevel2 ? (
                                    <p className="text-xs text-slate-300 px-3 py-3 italic">Select sub first</p>
                                ) : level3Categories.length === 0 ? (
                                    <div className="px-3 py-3 text-center">
                                        <Check size={16} className="text-green-500 mx-auto mb-1" />
                                        <p className="text-xs text-slate-400">No deeper level</p>
                                    </div>
                                ) : level3Categories.map(cat => {
                                    const active = selectedLevel3?.id === cat.id
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleLevel3Select(cat)}
                                            className={`flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm transition
                                                ${active ? 'bg-green-50 font-semibold text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <span className="truncate flex-1">{cat.name}</span>
                                            {active && <Check size={14} className="text-green-600 flex-shrink-0" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Footer note */}
                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                        {displayParts
                            ? `Selected: ${displayParts.join(' › ')}`
                            : 'Choose the most specific category that fits your product'}
                    </div>
                </div>
            )}
        </div>
    )
}
