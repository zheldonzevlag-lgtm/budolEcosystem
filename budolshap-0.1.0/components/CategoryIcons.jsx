// Category icon mappings - emoji icons for common categories
export const getCategoryIcon = (slug, name) => {
    const key = (slug || name || '').toLowerCase()

    const iconMap = {
        // Electronics & Gadgets
        'electronics': '🖥️',
        'gadgets': '📱',
        'mobile': '📱',
        'phones': '📱',
        'smartphones': '📱',
        'laptop': '💻',
        'laptops': '💻',
        'computers': '💻',
        'computer': '💻',
        'tablets': '📲',
        'tablet': '📲',
        'camera': '📷',
        'cameras': '📷',
        'headphones': '🎧',
        'earphones': '🎧',
        'earbuds': '🎵',
        'speakers': '🔊',
        'audio': '🎵',
        'mouse': '🖱️',
        'keyboard': '⌨️',
        'monitor': '🖥️',
        'tv': '📺',
        'television': '📺',
        'gaming': '🎮',
        'watch': '⌚',
        'watches': '⌚',
        'smartwatch': '⌚',
        'pen': '✏️',
        'theater': '🎬',
        'home-theater': '🎬',
        'cleaner': '🧹',
        'robot-cleaner': '🤖',
        // Fashion
        'fashion': '👗',
        'clothing': '👕',
        'clothes': '👕',
        'shirts': '👕',
        'tops': '👚',
        'bottoms': '👖',
        'pants': '👖',
        'jeans': '👖',
        'dresses': '👗',
        'shoes': '👟',
        'footwear': '👟',
        'sneakers': '👟',
        'bags': '👜',
        'handbags': '👜',
        'accessories': '💍',
        'jewelry': '💍',
        'watches-fashion': '⌚',
        'sunglasses': '🕶️',
        'hats': '🧢',
        'caps': '🧢',
        'underwear': '🩲',
        'swimwear': '🩱',
        // Home & Living
        'home': '🏠',
        'home-living': '🏠',
        'furniture': '🛋️',
        'kitchen': '🍳',
        'appliances': '🏠',
        'home-appliances': '🏠',
        'decoration': '🪴',
        'decor': '🪴',
        'bedding': '🛏️',
        'lighting': '💡',
        'tools': '🔧',
        // Health & Beauty
        'health': '💊',
        'beauty': '💄',
        'skincare': '🧴',
        'makeup': '💄',
        'cosmetics': '💄',
        'wellness': '💆',
        'vitamins': '💊',
        'supplements': '💊',
        // Food & Grocery
        'food': '🥘',
        'grocery': '🛒',
        'groceries': '🛒',
        'snacks': '🍿',
        'beverages': '🥤',
        'drinks': '🥤',
        // Sports & Outdoors
        'sports': '⚽',
        'outdoor': '🏕️',
        'outdoors': '🏕️',
        'fitness': '💪',
        'gym': '💪',
        'cycling': '🚲',
        'swimming': '🏊',
        // Toys & Kids
        'toys': '🧸',
        'kids': '🧒',
        'baby': '👶',
        'children': '🧒',
        // Books & Media
        'books': '📚',
        'book': '📚',
        'music': '🎵',
        'movies': '🎬',
        // Automotive
        'automotive': '🚗',
        'car': '🚗',
        'motors': '🏍️',
        // Others
        'pets': '🐾',
        'garden': '🌱',
        'travel': '✈️',
        'office': '💼',
        'stationery': '📎',
        'craft': '✂️',
        'art': '🎨',
    }

    // Direct match
    if (iconMap[key]) return iconMap[key]

    // Partial match
    for (const [k, icon] of Object.entries(iconMap)) {
        if (key.includes(k) || k.includes(key)) return icon
    }

    // Default
    return '📦'
}

// Color palettes for categories (cycles through)
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
