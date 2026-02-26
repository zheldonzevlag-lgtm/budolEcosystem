/**
 * CategoryIcons.jsx
 *
 * WHY THIS FILE EXISTS:
 *   Centralises all category icon logic for the BudolShap platform.
 *   Previously used emojis which look inconsistent across OS / browsers
 *   and appear unprofessional in a marketplace context.
 *
 * WHAT IT DOES:
 *   - Maps every known category slug / name to a Lucide React icon component.
 *   - Exports a `getCategoryLucideIcon(slug, name)` function that returns
 *     the best-matching Lucide component (falls back to `Package`).
 *   - Exports `renderCategoryIcon(slug, name, className)` for easy JSX rendering.
 *   - Keeps `categoryColors` and `getCategoryColor()` for consistent colour theming.
 *   - Retains the PROFESSIONAL_ICON_MAP used by the admin icon-picker.
 *
 * TODO:
 *   - When the Category DB model gains an `icon` field that stores a Lucide
 *     icon name, this file should be the single source of truth for resolving
 *     that name to a component (use `resolveIconByName`).
 */

import {
    // Electronics
    Smartphone, Laptop, Camera, Headphones, Tv, Watch, Gamepad2, Monitor, Keyboard, Mouse, Tablet, Speaker,
    // Fashion
    Shirt, ShoppingBag, Gem, Glasses, Crown, Scissors, Footprints,
    // Home & Living
    Home, Sofa, Utensils, Blend, Lamp, Wrench, BedDouble,
    // Health & Beauty
    Heart, Droplets, Sparkles,
    // Food & Grocery
    UtensilsCrossed, ShoppingCart, Coffee, Apple,
    // Sports & Outdoors
    Dumbbell, Bike, Waves, Tent,
    // Toys, Games & Hobbies
    Baby, Blocks, Puzzle, Dice5,
    // Books & Media
    BookOpen, Music, Film,
    // Automotive
    Car,
    // Pets
    Dog, Cat, PawPrint,
    // Garden & Outdoors
    Flower2, Sprout, TreePine,
    // Travel
    Plane, Luggage,
    // Office & Business
    Briefcase, Archive, Printer,
    // Art & Craft
    Palette,
    // General / fallback
    Package, Package2, Box, Store, Tag, Gift, Star, Users, Layers, Grid, List, TrendingUp,
} from 'lucide-react'

// ─── PROFESSIONAL ICON MAP ────────────────────────────────────────────────────
// Used by the admin Category editor icon-picker.
// Key = display name shown in the picker UI.
export const PROFESSIONAL_ICON_MAP = {
    'Smartphone': Smartphone,
    'Laptop': Laptop,
    'Camera': Camera,
    'Headphones': Headphones,
    'TV': Tv,
    'Monitor': Monitor,
    'Watch': Watch,
    'Gamepad': Gamepad2,
    'Tablet': Tablet,
    'Speaker': Speaker,
    'Keyboard': Keyboard,
    // Fashion
    'Shirt': Shirt,
    'Shopping Bag': ShoppingBag,
    'Jewelry': Gem,
    'Glasses': Glasses,
    'Crown': Crown,
    'Hat': ShoppingBag,
    'Scissors': Scissors,
    'Footprints': Footprints,
    // Home & Living
    'Home': Home,
    'Sofa': Sofa,
    'Kitchen': Utensils,
    'Blender': Blend,
    'Lamp': Lamp,
    'Tools': Wrench,
    'Bed': BedDouble,
    // Health & Beauty
    'Heart': Heart,
    'Droplets': Droplets,
    'Sparkles': Sparkles,
    'Spa': Sparkles,
    // Food
    'Food': UtensilsCrossed,
    'Coffee': Coffee,
    'Restaurant': UtensilsCrossed,
    'Grocery': ShoppingCart,
    // Sports
    'Fitness': Dumbbell,
    'Sports': Dumbbell,
    'Cycling': Bike,
    'Swimming': Waves,
    'Camping': Tent,
    // Kids & Toys
    'Baby': Baby,
    'Toys': Gamepad2,
    'Puzzle': Puzzle,
    // Books & Media
    'Books': BookOpen,
    'Music': Music,
    'Movies': Film,
    // Automotive
    'Car': Car,
    // Pets
    'Pets': PawPrint,
    'Dog': Dog,
    'Cat': Cat,
    // Garden
    'Garden': Flower2,
    'Plants': Sprout,
    // Travel
    'Travel': Plane,
    'Luggage': Luggage,
    // Office & Business
    'Office': Briefcase,
    'Business': Briefcase,
    'Stationery': Archive,
    'Printer': Printer,
    // Art & Craft
    'Art': Palette,
    'Craft': Scissors,
    // General
    'Store': Store,
    'Cart': ShoppingCart,
    'Tag': Tag,
    'Gift': Gift,
    'Star': Star,
    'Users': Users,
    'Layers': Layers,
    'Grid': Grid,
    'List': List,
    'Package': Package,
    'Box': Box,
    'Trending': TrendingUp,
}

// ─── SLUG → LUCIDE ICON MAP ───────────────────────────────────────────────────
// Maps category slugs (and name keywords) to Lucide icon components.
// This replaces the old emoji-based getCategoryIcon() function.
const SLUG_ICON_MAP = {
    // ── Electronics & Gadgets ─────────────────────────────────────────────────
    'electronics': Tv,
    'gadgets': Smartphone,
    'mobile': Smartphone,
    'phones': Smartphone,
    'smartphones': Smartphone,
    'laptop': Laptop,
    'laptops': Laptop,
    'computers': Monitor,
    'computer': Monitor,
    'tablets': Tablet,
    'tablet': Tablet,
    'camera': Camera,
    'cameras': Camera,
    'headphones': Headphones,
    'earphones': Headphones,
    'earbuds': Headphones,
    'speakers': Speaker,
    'audio': Music,
    'mouse': Mouse,
    'keyboard': Keyboard,
    'monitor': Monitor,
    'tv': Tv,
    'television': Tv,
    'gaming': Gamepad2,
    'watch': Watch,
    'watches': Watch,
    'smartwatch': Watch,
    'home-theater': Tv,
    'cleaner': Wrench,

    // ── Fashion ───────────────────────────────────────────────────────────────
    'fashion': Shirt,
    'clothing': Shirt,
    'clothes': Shirt,
    'shirts': Shirt,
    'tops': Shirt,
    'bottoms': Shirt,
    'pants': Shirt,
    'jeans': Shirt,
    'dresses': ShoppingBag,
    'shoes': Footprints,
    'footwear': Footprints,
    'sneakers': Footprints,
    'bags': ShoppingBag,
    'handbags': ShoppingBag,
    'accessories': Gem,
    'jewelry': Gem,
    'sunglasses': Glasses,
    'hats': ShoppingBag,
    'caps': ShoppingBag,
    'underwear': Shirt,
    'swimwear': Waves,

    // ── Home & Living ─────────────────────────────────────────────────────────
    'home': Home,
    'home-living': Home,
    'furniture': Sofa,
    'kitchen': Utensils,
    'appliances': Home,
    'home-appliances': Home,
    'decoration': Flower2,
    'decor': Flower2,
    'bedding': BedDouble,
    'lighting': Lamp,
    'tools': Wrench,

    // ── Health & Beauty ───────────────────────────────────────────────────────
    'health': Heart,
    'beauty': Sparkles,
    'beauty-personal-care': Sparkles,
    'personal-care': Droplets,
    'skincare': Droplets,
    'makeup': Sparkles,
    'cosmetics': Sparkles,
    'wellness': Heart,
    'vitamins': Heart,
    'supplements': Heart,

    // ── Food & Grocery ────────────────────────────────────────────────────────
    'food': UtensilsCrossed,
    'food-groceries': ShoppingCart,
    'food-grocery': ShoppingCart,
    'grocery': ShoppingCart,
    'groceries': ShoppingCart,
    'snacks': Apple,
    'beverages': Coffee,
    'drinks': Coffee,

    // ── Sports & Outdoors ─────────────────────────────────────────────────────
    'sports': Dumbbell,
    'sports-outdoors': Dumbbell,
    'outdoor': Tent,
    'outdoors': Tent,
    'fitness': Dumbbell,
    'gym': Dumbbell,
    'cycling': Bike,
    'swimming': Waves,

    // ── Toys, Games & Hobbies ─────────────────────────────────────────────────
    'toys': Blocks,
    'toys-games-hobbies': Gamepad2,
    'games': Dice5,
    'hobbies': Puzzle,
    'kids': Baby,
    'baby': Baby,
    'children': Baby,
    'baby-kids': Baby,

    // ── Books & Media ─────────────────────────────────────────────────────────
    'books': BookOpen,
    'book': BookOpen,
    'music': Music,
    'movies': Film,

    // ── Automotive ────────────────────────────────────────────────────────────
    'automotive': Car,
    'car': Car,
    'motors': Car,

    // ── Pets ──────────────────────────────────────────────────────────────────
    'pets': PawPrint,
    'pet-supplies': PawPrint,

    // ── Garden ────────────────────────────────────────────────────────────────
    'garden': Flower2,

    // ── Travel ────────────────────────────────────────────────────────────────
    'travel': Plane,

    // ── Office & Business ─────────────────────────────────────────────────────
    'office': Briefcase,
    'stationery': Archive,
    'craft': Scissors,
    'art': Palette,

    // ── "All" shortcut ─────────────────────────────────────────────────────────
    'all': ShoppingCart,
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * getCategoryLucideIcon
 *
 * Returns the best-matching Lucide React component for a given category.
 * Prioritizes the explicit icon name from the database, then falls back
 * to slug/name string matching.
 *
 * @param {string} slug    - URL slug (e.g. "home-living")
 * @param {string} name    - Human-readable name (fallback key)
 * @param {string} dbIcon  - Explicit icon name stored in DB (e.g. "Smartphone")
 * @returns {React.ComponentType} Lucide icon component
 */
export const getCategoryLucideIcon = (slug, name, dbIcon = null) => {
    // 1. Prioritize explicit DB override
    if (dbIcon) {
        const component = resolveIconByName(dbIcon)
        if (component) return component
    }

    const key = (slug || name || '').toLowerCase()

    // 2. Exact slug match
    if (SLUG_ICON_MAP[key]) return SLUG_ICON_MAP[key]

    // 2. Partial match – slug contains a known key or vice versa
    for (const [k, icon] of Object.entries(SLUG_ICON_MAP)) {
        if (key.includes(k) || k.includes(key)) return icon
    }

    // 3. Default fallback
    return Package
}

/**
 * renderCategoryIcon
 *
 * Renders a Lucide icon for a category in JSX.
 *
 * @param {string} slug
 * @param {string} name
 * @param {string} dbIcon
 * @param {string} className
 * @returns {JSX.Element}
 */
export const renderCategoryIcon = (slug, name, dbIcon = null, className = 'w-6 h-6') => {
    const IconComponent = getCategoryLucideIcon(slug, name, dbIcon)
    return <IconComponent className={className} />
}

// ─── COLOUR PALETTE ───────────────────────────────────────────────────────────
// Cycles through these palettes based on array index so each category tile
// has a unique, harmonious background/text pairing.
export const categoryColors = [
    { bg: 'bg-orange-50', hover: 'hover:bg-orange-100', text: 'text-orange-600', border: 'border-orange-100' },
    { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', text: 'text-blue-600', border: 'border-blue-100' },
    { bg: 'bg-green-50', hover: 'hover:bg-green-100', text: 'text-green-600', border: 'border-green-100' },
    { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', text: 'text-purple-600', border: 'border-purple-100' },
    { bg: 'bg-pink-50', hover: 'hover:bg-pink-100', text: 'text-pink-600', border: 'border-pink-100' },
    { bg: 'bg-yellow-50', hover: 'hover:bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-100' },
    { bg: 'bg-red-50', hover: 'hover:bg-red-100', text: 'text-red-600', border: 'border-red-100' },
    { bg: 'bg-teal-50', hover: 'hover:bg-teal-100', text: 'text-teal-600', border: 'border-teal-100' },
    { bg: 'bg-indigo-50', hover: 'hover:bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-100' },
    { bg: 'bg-cyan-50', hover: 'hover:bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-100' },
]

export const getCategoryColor = (index) => categoryColors[index % categoryColors.length]

// ─── ADMIN ICON PICKER HELPERS ────────────────────────────────────────────────

/**
 * resolveIconByName
 *
 * Look up a Lucide icon component by its display name (as stored in the DB
 * `icon` field).  Used by admin pages that store a chosen icon name.
 *
 * @param {string} iconName
 * @returns {React.ComponentType|null}
 */
export const resolveIconByName = (iconName) => {
    if (!iconName) return null
    return PROFESSIONAL_ICON_MAP[iconName] || null
}

/**
 * renderIconByName
 *
 * Convenience wrapper – renders a named Lucide icon in JSX.
 *
 * @param {string} iconName
 * @param {string} className
 * @returns {JSX.Element|null}
 */
export const renderIconByName = (iconName, className = 'w-5 h-5') => {
    const IconComponent = resolveIconByName(iconName)
    if (!IconComponent) return null
    return <IconComponent className={className} />
}

// ─── LEGACY SHIMS ─────────────────────────────────────────────────────────────
// These deprecated aliases keep old callers from breaking while we migrate.
// TODO: Remove once all call-sites are updated to use the new API.

/** @deprecated Use getCategoryLucideIcon() instead */
export const getProfessionalIcon = resolveIconByName

/** @deprecated Use renderIconByName() instead */
export const renderProfessionalIcon = renderIconByName
