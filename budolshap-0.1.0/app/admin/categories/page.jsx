'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, Search, FolderTree, X, Tag, Package, BarChart3, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { getCategoryIcon, getCategoryColor } from '@/components/CategoryIcons'

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parentId: '',
        level: 1,
        sortOrder: 0,
        isActive: true,
        image: '',
        icon: ''
    })
    const [expandedCategories, setExpandedCategories] = useState(new Set())
    const [filterLevel, setFilterLevel] = useState('all')
    const [uploadingImage, setUploadingImage] = useState(false)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/categories?flat=true')
            const data = await res.json()
            if (res.ok) {
                setCategories(data)
            } else {
                toast.error(data.error || 'Failed to fetch categories')
            }
        } catch (error) {
            toast.error('Failed to fetch categories')
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingImage(true)
        try {
            const reader = new FileReader()
            reader.onload = async (event) => {
                const base64 = event.target.result
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64, type: 'category' })
                })
                const data = await res.json()
                if (res.ok) {
                    setFormData({ ...formData, image: data.url })
                    toast.success('Image uploaded!')
                } else {
                    toast.error(data.error || 'Failed to upload image')
                }
                setUploadingImage(false)
            }
            reader.readAsDataURL(file)
        } catch (error) {
            toast.error('Failed to upload image')
            setUploadingImage(false)
        }
    }

    const removeImage = () => {
        setFormData({ ...formData, image: '' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const url = '/api/admin/categories'
            const method = editingCategory ? 'PUT' : 'POST'
            const body = editingCategory ? { ...formData, id: editingCategory.id } : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const data = await res.json()

            if (res.ok) {
                toast.success(editingCategory ? 'Category updated!' : 'Category created!')
                setShowModal(false)
                resetForm()
                fetchCategories()
            } else {
                toast.error(data.error || 'Failed to save category')
            }
        } catch (error) {
            toast.error('Failed to save category')
        }
    }

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return

        try {
            const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (res.ok) {
                toast.success(data.message || 'Category deleted')
                fetchCategories()
            } else {
                toast.error(data.error || 'Failed to delete category')
            }
        } catch {
            toast.error('Failed to delete category')
        }
    }

    const openEditModal = (category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            slug: category.slug,
            parentId: category.parentId || '',
            level: category.level,
            sortOrder: category.sortOrder || 0,
            isActive: category.isActive,
            image: category.image || '',
            icon: category.icon || ''
        })
        setShowModal(true)
    }

    const openAddModal = (parentId = null, level = 1) => {
        resetForm()
        if (parentId) {
            const parent = categories.find(c => c.id === parentId)
            if (parent) setFormData(prev => ({ ...prev, parentId, level: parent.level + 1 }))
        }
        setShowModal(true)
    }

    const resetForm = () => {
        setEditingCategory(null)
        setFormData({ name: '', slug: '', parentId: '', level: 1, sortOrder: 0, isActive: true, image: '', icon: '' })
    }

    const toggleExpand = (id) => {
        setExpandedCategories(prev => {
            const s = new Set(prev)
            s.has(id) ? s.delete(id) : s.add(id)
            return s
        })
    }

    const expandAll = () => setExpandedCategories(new Set(categories.map(c => c.id)))
    const collapseAll = () => setExpandedCategories(new Set())

    const buildTree = (cats, parentId = null) => {
        // Initial filter for the specified parent
        let items = cats.filter(c => c.parentId === parentId)

        // If we're looking for roots (parentId is null) and found none, but there are categories,
        // it means we're in a filtered view. We should treat categories with no parent IN THE SET as roots.
        if (parentId === null && items.length === 0 && cats.length > 0) {
            const catIds = new Set(cats.map(c => c.id))
            items = cats.filter(c => !c.parentId || !catIds.has(c.parentId))
        }

        return items
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map(cat => ({ ...cat, children: buildTree(cats, cat.id) }))
    }

    const filteredCategories = categories.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesLevel = filterLevel === 'all' || cat.level === parseInt(filterLevel)
        return matchesSearch && matchesLevel
    })

    const categoryTree = buildTree(searchTerm || filterLevel !== 'all' ? filteredCategories : categories)

    // Stats
    const stats = {
        total: categories.length,
        level1: categories.filter(c => c.level === 1).length,
        level2: categories.filter(c => c.level === 2).length,
        level3: categories.filter(c => c.level === 3).length,
        totalProducts: categories.reduce((sum, c) => sum + (c._count?.products || 0), 0),
    }

    const getLevelStyle = (level) => {
        const styles = {
            1: 'bg-blue-100 text-blue-700 border border-blue-200',
            2: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            3: 'bg-purple-100 text-purple-700 border border-purple-200',
        }
        return styles[level] || 'bg-gray-100 text-gray-700'
    }

    const getLevelLabel = (level) => ({ 1: 'Main', 2: 'Sub', 3: 'Leaf' }[level] || `L${level}`)

    const renderCategoryRow = (category, level = 0) => {
        const hasChildren = category.children?.length > 0
        const isExpanded = expandedCategories.has(category.id)
        const icon = getCategoryIcon(category.slug, category.name)
        const color = getCategoryColor(level)

        return (
            <>
                <tr key={category.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                    {/* Name */}
                    <td className="py-3 px-4">
                        <div className="flex items-center" style={{ paddingLeft: `${level * 28}px` }}>
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(category.id)}
                                    className="p-1 hover:bg-slate-200 rounded-lg mr-2 transition-colors"
                                >
                                    {isExpanded
                                        ? <ChevronDown size={15} className="text-slate-500" />
                                        : <ChevronRight size={15} className="text-slate-500" />}
                                </button>
                            ) : (
                                <span className="w-7" />
                            )}
                            {/* Icon preview */}
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base mr-2.5 flex-shrink-0 overflow-hidden">
                                {category.image ? (
                                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className={color.bg}>{icon}</span>
                                )}
                            </span>
                            <div>
                                <span className="font-medium text-slate-700 text-sm">{category.name}</span>
                                {hasChildren && (
                                    <span className="ml-2 text-xs text-slate-400">({category.children.length} sub)</span>
                                )}
                            </div>
                        </div>
                    </td>
                    {/* Slug */}
                    <td className="py-3 px-4">
                        <code className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono">
                            {category.slug}
                        </code>
                    </td>
                    {/* Level */}
                    <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelStyle(category.level)}`}>
                            {getLevelLabel(category.level)}
                        </span>
                    </td>
                    {/* Products */}
                    <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                            <Package size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600 font-medium">{category._count?.products || 0}</span>
                        </div>
                    </td>
                    {/* Status */}
                    <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${category.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                            {category.isActive ? 'Active' : 'Hidden'}
                        </span>
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {level < 3 && (
                                <button
                                    onClick={() => openAddModal(category.id, category.level + 1)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                    title="Add Subcategory"
                                >
                                    <Plus size={15} />
                                </button>
                            )}
                            <button
                                onClick={() => openEditModal(category)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                            >
                                <Edit2 size={15} />
                            </button>
                            <button
                                onClick={() => handleDelete(category.id, category.name)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30"
                                title="Delete"
                                disabled={hasChildren}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </td>
                </tr>
                {hasChildren && isExpanded && category.children.map(child => renderCategoryRow(child, level + 1))}
            </>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Product Categories</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage the category hierarchy (up to 3 levels)</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchCategories}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => openAddModal()}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition shadow-sm shadow-green-200 text-sm font-medium"
                    >
                        <Plus size={18} />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: 'Total', value: stats.total, icon: FolderTree, color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'Main (L1)', value: stats.level1, icon: Tag, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Sub (L2)', value: stats.level2, icon: Tag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Leaf (L3)', value: stats.level3, icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Products', value: stats.totalProducts, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-4 flex items-center gap-3`}>
                        <stat.icon size={20} className={stat.color} />
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                            <p className="text-xs text-slate-500">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Level filter */}
                        {['all', '1', '2', '3'].map(l => (
                            <button
                                key={l}
                                onClick={() => setFilterLevel(l)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${filterLevel === l
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {l === 'all' ? 'All Levels' : `Level ${l}`}
                            </button>
                        ))}
                        <div className="w-px h-5 bg-slate-200 mx-1" />
                        <button onClick={expandAll} className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                            Expand All
                        </button>
                        <button onClick={collapseAll} className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                            Collapse
                        </button>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw size={28} className="animate-spin text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Loading categories...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-12 text-center">
                        <FolderTree size={48} className="mx-auto mb-4 text-slate-200" />
                        <p className="font-medium text-slate-500">No categories yet</p>
                        <p className="text-sm text-slate-400 mt-1">Create your first category to get started</p>
                        <button
                            onClick={() => openAddModal()}
                            className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                        >
                            <Plus size={16} /> Create First Category
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Category</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Slug</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Level</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Products</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryTree.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                                            No categories match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    categoryTree.map(cat => renderCategoryRow(cat))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {editingCategory ? 'Edit Category' : 'New Category'}
                                </h2>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {editingCategory ? 'Update the category details' : 'Add a new category to the tree'}
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowModal(false); resetForm() }}
                                className="p-2 hover:bg-slate-100 rounded-xl transition"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Icon preview */}
                            {formData.name && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Category" className="w-12 h-12 rounded-lg object-cover" />
                                    ) : (
                                        <span className="text-3xl">{getCategoryIcon(formData.slug, formData.name)}</span>
                                    )}
                                    <div>
                                        <p className="font-medium text-slate-700">{formData.name || 'Category Name'}</p>
                                        <p className="text-xs text-slate-400">{formData.slug || 'slug'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category Image</label>
                                {formData.image ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={formData.image}
                                            alt="Category"
                                            className="w-24 h-24 rounded-xl object-cover border border-slate-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-md"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {uploadingImage ? (
                                                <RefreshCw size={20} className="animate-spin text-slate-400 mb-1" />
                                            ) : (
                                                <FolderTree size={20} className="text-slate-400 mb-1" />
                                            )}
                                            <p className="text-xs text-slate-500">
                                                {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploadingImage}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Icon/Emoji Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Icon (Emoji)</label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                    placeholder="e.g. 📦 or 🛒 (single emoji)"
                                    maxLength={10}
                                />
                                <p className="text-xs text-slate-400 mt-1">Enter an emoji or icon to display alongside the category</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        const name = e.target.value
                                        const autoSlug = !editingCategory || !formData.slug
                                            ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                                            : formData.slug
                                        setFormData({ ...formData, name, slug: autoSlug })
                                    }}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                    placeholder="e.g. Electronics"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">URL Slug <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                                    placeholder="e.g. electronics"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Parent Category</label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => {
                                        const parentId = e.target.value
                                        let level = 1
                                        if (parentId) {
                                            const parent = categories.find(c => c.id === parentId)
                                            if (parent) level = Math.min(parent.level + 1, 3)
                                        }
                                        setFormData({ ...formData, parentId, level })
                                    }}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                                >
                                    <option value="">None (Top Level)</option>
                                    {categories
                                        .filter(c => c.level < 3)
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {'  '.repeat(cat.level - 1)}{getCategoryIcon(cat.slug, cat.name)} {cat.name} (Level {cat.level})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Level badge */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Level (auto)</label>
                                    <div className="px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-600 flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelStyle(formData.level)}`}>
                                            {getLevelLabel(formData.level)}
                                        </span>
                                        Level {formData.level}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Sort Order</label>
                                    <input
                                        type="number"
                                        value={formData.sortOrder}
                                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-green-500 transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Active</p>
                                    <p className="text-xs text-slate-400">Visible to buyers on the storefront</p>
                                </div>
                            </label>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm() }}
                                    className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition font-medium shadow-sm"
                                >
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
