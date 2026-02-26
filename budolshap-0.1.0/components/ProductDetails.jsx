'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import toast from 'react-hot-toast';

const ProductDetails = ({ product }) => {

    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();

    const router = useRouter()
    const imageRef = useRef(null);
    const thumbnailRef = useRef(null);
    const [zoomStyle, setZoomStyle] = useState({ display: 'none' });

    // Safely handle images
    const images = Array.isArray(product?.images)
        ? product.images
        : (typeof product?.images === 'string'
            ? (product.images.startsWith('[') ? JSON.parse(product.images) : [product.images])
            : []);

    const videos = Array.isArray(product?.videos)
        ? product.videos
        : (typeof product?.videos === 'string'
            ? (product.videos.startsWith('[') ? JSON.parse(product.videos) : [product.videos])
            : []);

    const videoItems = videos
        .map((video) => (video?.url || video))
        .filter(Boolean)
        .map((src) => ({ type: 'video', src }))

    const imageItems = images
        .filter(Boolean)
        .map((src) => ({ type: 'image', src }))

    const galleryItems = [...videoItems, ...imageItems]
    const fallbackImage = images[0] || '/images/placeholder-product.png'
    const initialMedia = galleryItems[0] || { type: 'image', src: fallbackImage }
    const [mainImage, setMainImage] = useState(fallbackImage);
    const [mainMedia, setMainMedia] = useState(initialMedia);
    const [activeIndex, setActiveIndex] = useState(0);
    const [startIndex, setStartIndex] = useState(0);
    const [selectedIndices, setSelectedIndices] = useState({}); // { 0: optionIndex, 1: optionIndex }
    const [quantity, setQuantity] = useState(1);

    const incrementQuantity = () => setQuantity(prev => prev + 1);
    const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    // Tier-Variation Logic (Shopee Style)
    const tiers = product.tier_variations || [];
    const matrix = product.variation_matrix || [];

    const handleVariationSelect = (tierIndex, optionIndex) => {
        const isSelected = selectedIndices[tierIndex] === optionIndex;

        // Toggle selection logic (deselect if clicked again)
        if (isSelected) {
            const newIndices = { ...selectedIndices };
            delete newIndices[tierIndex];
            setSelectedIndices(newIndices);

            // Revert image to default if main variation is deselected
            // Assuming 1st tier (index 0) is usually the "Image" tier (e.g. Color)
            if (tierIndex === 0) {
                const fallbackImage = images[0] || '/images/placeholder-product.png'
                setMainImage(fallbackImage);
                setMainMedia({ type: 'image', src: fallbackImage });
            }
        } else {
            setSelectedIndices(prev => ({
                ...prev,
                [tierIndex]: optionIndex
            }));

            // Smart Image Update:
            // If the user selects a variation that has specific images (usually Tier 1), update main image
            // even if the full combination isn't selected yet.
            const potentialMatch = matrix.find(item => item.tier_index[tierIndex] === optionIndex);
            if (potentialMatch && potentialMatch.image) {
                setMainImage(potentialMatch.image);
                setMainMedia({ type: 'image', src: potentialMatch.image });
            }
        }
    };

    // Find the matching SKU model from the matrix based on selected indices
    const currentSKU = matrix.find(item => {
        return tiers.every((_, tIdx) => {
            return item.tier_index[tIdx] === selectedIndices[tIdx];
        });
    });

    // Price Range Logic
    let minPrice = product.price;
    let maxPrice = product.price;
    let minMrp = product.mrp;
    let maxMrp = product.mrp;

    if (matrix.length > 0) {
        const prices = matrix.map(m => m.price);
        minPrice = Math.min(...prices);
        maxPrice = Math.max(...prices);

        const mrps = matrix.map(m => m.mrp || m.price); // Fallback to price if mrp missing
        minMrp = Math.min(...mrps);
        maxMrp = Math.max(...mrps);
    }

    // Determine what price/stock to display
    const isSelectionComplete = tiers.length === 0 || (tiers.length > 0 && Object.keys(selectedIndices).length === tiers.length);

    // Logic for the requested "Price Range" to be shown after stock
    const priceRange = minPrice !== maxPrice ? `${currency}${minPrice.toLocaleString()} - ${currency}${maxPrice.toLocaleString()}` : null;

    // Price Logic: Prioritize variation matrix if it exists
    const displayPrice = (isSelectionComplete && currentSKU) 
        ? currentSKU.price 
        : (matrix.length > 0 ? minPrice : product.price);

    const displayMrp = (isSelectionComplete && currentSKU) 
        ? currentSKU.mrp 
        : (matrix.length > 0 ? minMrp : product.mrp);

    // Stock: If selected, show specific stock. If not, show total.
    const totalStock = matrix.reduce((acc, item) => acc + item.stock, 0); // Approx total

    // Filter to find matching stock based on current selection (partial or full)
    const matchingStock = matrix.filter(item => {
        return Object.entries(selectedIndices).every(([tIdx, oIdx]) => {
            return item.tier_index[tIdx] === oIdx;
        });
    }).reduce((acc, item) => acc + item.stock, 0);

    const displayStock = Object.keys(selectedIndices).length > 0 ? matchingStock : totalStock;

    // Out of Stock Logic
    const isOutOfStock = tiers.length === 0
        ? !product.inStock
        : (isSelectionComplete && currentSKU ? currentSKU.stock === 0 : totalStock === 0);

    // Update main image if SKU has one (Final confirmation)
    if (currentSKU?.image && mainImage !== currentSKU.image) {
        setMainImage(currentSKU.image);
        setMainMedia({ type: 'image', src: currentSKU.image });
    }

    // Generate unique ID for cart
    const variationId = currentSKU?.sku || '';
    const itemKey = variationId ? `${productId}_${variationId}` : productId;

    const addToCartHandler = () => {
        if (!isSelectionComplete) {
            toast.error('Please select all options before adding to cart')
            return;
        }
        dispatch(addToCart({ productId, variationId, quantity }))
        toast.success('Added to cart')
    }

    // Helper to format price display (handle range strings vs numbers)
    const formatPrice = (val) => {
        if (typeof val === 'string') return val; // Range "100 - 200"
        return val.toLocaleString();
    }

    const handleScrollUp = (e) => {
        e.stopPropagation();
        if (activeIndex > 0) {
            const newIndex = activeIndex - 1;
            setActiveIndex(newIndex);
            const nextItem = galleryItems[newIndex];
            if (nextItem?.type === 'image') {
                setMainImage(nextItem.src);
            }
            if (nextItem?.type === 'video') {
                setZoomStyle({ display: 'none' });
            }
            if (nextItem) {
                setMainMedia(nextItem);
            }
            if (newIndex < startIndex) {
                setStartIndex(newIndex);
            }
        }
    };

    const handleScrollDown = (e) => {
        e.stopPropagation();
        if (activeIndex < galleryItems.length - 1) {
            const newIndex = activeIndex + 1;
            setActiveIndex(newIndex);
            const nextItem = galleryItems[newIndex];
            if (nextItem?.type === 'image') {
                setMainImage(nextItem.src);
            }
            if (nextItem?.type === 'video') {
                setZoomStyle({ display: 'none' });
            }
            if (nextItem) {
                setMainMedia(nextItem);
            }
            if (newIndex >= startIndex + 4) {
                setStartIndex(newIndex - 3);
            }
        }
    };

    const handleMouseMove = (e) => {
        if (mainMedia.type !== 'image') return;
        if (!imageRef.current) return;

        const { left, top, width, height } = imageRef.current.getBoundingClientRect();
        const x = ((e.pageX - left - window.scrollX) / width) * 100;
        const y = ((e.pageY - top - window.scrollY) / height) * 100;

        setZoomStyle({
            display: 'block',
            backgroundImage: `url(${mainImage})`,
            backgroundPosition: `${x}% ${y}%`,
            backgroundSize: '200%' // 2x magnification
        });
    };

    const handleMouseLeave = () => {
        setZoomStyle({ display: 'none' });
    };

    // Use effect to attach non-passive wheel listener for preventing default scroll
    useEffect(() => {
        const container = thumbnailRef.current;
        if (!container) return;

        const handleThumbnailScroll = (e) => {
            if (galleryItems.length > 4) {
                e.preventDefault();
                e.stopPropagation();
                if (e.deltaY > 0) {
                    setStartIndex(prev => Math.min(prev + 1, galleryItems.length - 4));
                } else {
                    setStartIndex(prev => Math.max(prev - 1, 0));
                }
            }
        };

        container.addEventListener('wheel', handleThumbnailScroll, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleThumbnailScroll);
        };
    }, [galleryItems.length]);

    // Safely calculate rating
    const ratings = Array.isArray(product?.rating) ? product.rating : [];
    const averageRating = ratings.length > 0
        ? ratings.reduce((acc, item) => acc + item.rating, 0) / ratings.length
        : 0;

    return (
        <div className="flex max-lg:flex-col gap-12">
            <div className="flex flex-col gap-4">
                <div className="flex max-sm:flex-col-reverse gap-3">
                <div 
                    className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible custom-scrollbar"
                    ref={thumbnailRef}
                >
                    {galleryItems.slice(startIndex, startIndex + 4).map((item, index) => {
                        const globalIndex = startIndex + index;
                        return (
                        <div 
                            key={globalIndex} 
                            onClick={() => {
                                if (item.type === 'image') {
                                    setMainImage(item.src);
                                }
                                if (item.type === 'video') {
                                    setZoomStyle({ display: 'none' });
                                }
                                setMainMedia(item);
                                setActiveIndex(globalIndex);
                            }} 
                            onMouseEnter={() => {
                                if (item.type === 'image') {
                                    setMainImage(item.src);
                                }
                                if (item.type === 'video') {
                                    setZoomStyle({ display: 'none' });
                                }
                                setMainMedia(item);
                                setActiveIndex(globalIndex);
                            }}
                            className={`bg-slate-100 flex items-center justify-center size-26 rounded-lg group cursor-pointer border-2 ${globalIndex === activeIndex ? 'border-blue-500' : 'border-transparent'}`}
                        >
                            {item.type === 'image' ? (
                                <Image src={item.src} className="group-hover:scale-103 group-active:scale-95 transition object-contain" alt="" width={95} height={95} />
                            ) : (
                                <div className="relative w-full h-full flex items-center justify-center bg-black">
                                    <video src={item.src} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-8 w-8 rounded-full bg-black/60 flex items-center justify-center">
                                            <svg className="h-4 w-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <polygon points="8,5 19,12 8,19" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )})}
                </div>
                <div
                    className={`relative flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg overflow-hidden ${mainMedia.type === 'video' ? 'cursor-default' : 'cursor-crosshair'}`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    ref={imageRef}
                >
                    {mainMedia.type === 'video' ? (
                        <div className="relative w-full h-full bg-black">
                            <video src={mainMedia.src} className="w-full h-full object-cover" controls playsInline />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="h-14 w-14 rounded-full bg-black/60 flex items-center justify-center">
                                    <svg className="h-7 w-7 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <polygon points="8,5 19,12 8,19" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Image src={mainImage} alt="" width={250} height={250} className="object-contain w-full h-full" />
                    )}

                    {/* Magnifier Overlay (Desktop Only) */}
                    <div
                        className="absolute inset-0 pointer-events-none hidden lg:block"
                        style={{
                            ...zoomStyle,
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: '#f8fafc'
                        }}
                    />

                    {/* Navigation Arrows */}
                    {galleryItems.length > 4 && (
                        <div 
                            className="absolute bottom-4 right-4 flex flex-col gap-2 z-50"
                            onMouseEnter={() => setZoomStyle({ display: 'none' })}
                            onMouseMove={(e) => e.stopPropagation()}
                            onMouseLeave={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={handleScrollUp}
                                disabled={activeIndex === 0}
                                className={`p-2 rounded-full bg-white/80 shadow-md transition-all hover:bg-white ${activeIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                            >
                                <ChevronUp className="w-6 h-6 text-slate-700" />
                            </button>
                            <button 
                                onClick={handleScrollDown}
                                disabled={activeIndex === galleryItems.length - 1}
                                className={`p-2 rounded-full bg-white/80 shadow-md transition-all hover:bg-white ${activeIndex === galleryItems.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                            >
                                <ChevronDown className="w-6 h-6 text-slate-700" />
                            </button>
                        </div>
                    )}
                </div>
                </div>
            </div>
            <div className="flex-1">
                <h1 className="text-2xl font-medium text-slate-800">{product.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center" >
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                    </div>
                    <p className="text-sm text-slate-500">{ratings.length} Reviews</p>
                </div>

                <div className="flex flex-col gap-1 mt-4">
                    <div className="flex items-center gap-4">
                        <p className="text-3xl font-medium text-slate-800">
                            {currency}{typeof displayPrice === 'string' ? displayPrice : displayPrice.toLocaleString()}
                        </p>
                        {/* Only show MRP strike-through if it's strictly greater than price (handling ranges roughly) */}
                        {displayMrp > displayPrice && (
                            <p className="text-base text-slate-400 line-through">
                                {currency}{typeof displayMrp === 'string' ? displayMrp : displayMrp.toLocaleString()}
                            </p>
                        )}
                    </div>

                    {/* Savings Display */}
                    {!Number.isNaN(Number(displayMrp)) && !Number.isNaN(Number(displayPrice)) && displayMrp > displayPrice && (
                        <p className="text-sm text-green-600 flex items-center gap-2">
                            <TagIcon size={14} />
                            Save {Math.round(((displayMrp - displayPrice) / displayMrp) * 100)}% right now
                        </p>
                    )}
                </div>



                {/* Variation Selection */}
                <div className="flex flex-col gap-6 mt-8">
                    {tiers.map((tier, tIdx) => (
                        <div key={tier.name} className="flex flex-col gap-3">
                            <p className="text-sm font-medium text-slate-700">{tier.name}</p>
                            <div className="flex flex-wrap gap-3">
                                {tier.options.map((option, oIdx) => {
                                    const isSelected = selectedIndices[tIdx] === oIdx;

                                    // Check if this option is available based on current selection of other tiers
                                    let isOptionDisabled = false;

                                    // 1. Check if this option has ANY valid combination in the matrix at all
                                    const hasAnyValidCombo = matrix.some(item => item.tier_index[tIdx] === oIdx);
                                    if (!hasAnyValidCombo) {
                                        isOptionDisabled = true;
                                    } 
                                    // 2. Complex dependency check for multiple tiers if not already disabled
                                    else if (tiers.length > 1) {
                                        // Create a hypothetical selection including this option
                                        const potentialSelection = { ...selectedIndices, [tIdx]: oIdx };

                                        // Check if this potential selection is valid with ANY combination of remaining unselected tiers
                                        // But typically we only check against *already selected* other tiers to prevent dead-ends.

                                        // Shopee Logic: If I selected 'Red' (Tier 0), and I look at 'Small' (Tier 1),
                                        // is Red-Small available?

                                        const otherTierIndices = tiers.map((_, i) => i).filter(i => i !== tIdx);
                                        const hasConflict = otherTierIndices.some(otherTIdx => {
                                            const otherSelectedIdx = selectedIndices[otherTIdx];
                                            if (otherSelectedIdx !== undefined) {
                                                // Check if match exists for [This Tier: Option] + [Other Tier: Selected Option]
                                                const match = matrix.find(item =>
                                                    item.tier_index[tIdx] === oIdx &&
                                                    item.tier_index[otherTIdx] === otherSelectedIdx
                                                );
                                                return !match || match.stock === 0;
                                            }
                                            return false;
                                        });

                                        if (hasConflict) isOptionDisabled = true;
                                    }

                                    return (
                                        <button
                                            key={option}
                                            disabled={isOptionDisabled}
                                            onClick={() => handleVariationSelect(tIdx, oIdx)}
                                            className={`px-4 py-2 text-sm rounded border transition-all ${isSelected
                                                ? "border-green-600 text-green-600 bg-green-50 ring-1 ring-green-600 font-medium"
                                                : isOptionDisabled
                                                    ? "border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed opacity-60"
                                                    : "border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800"
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quantity and Stock Display */}
                <div className="mt-8 flex items-center gap-6">
                    <div className="flex items-center border border-slate-300 rounded overflow-hidden w-max">
                        <button onClick={decrementQuantity} className="px-4 py-2 hover:bg-slate-100 transition text-slate-600">-</button>
                        <div className="px-4 py-2 text-slate-800 font-medium min-w-[40px] text-center border-x border-slate-300">{quantity}</div>
                        <button onClick={incrementQuantity} className="px-4 py-2 hover:bg-slate-100 transition text-slate-600">+</button>
                    </div>

                    <div className="text-sm text-slate-500 flex items-center gap-4">
                        {tiers.length === 0 ? (
                             product.inStock ? <span className="text-green-600 font-medium">In Stock</span> : <span className="text-red-500 font-medium">Out of Stock</span>
                        ) : (
                            Object.keys(selectedIndices).length > 0 ? (
                                <span>Stock: <span className="font-medium text-slate-700">{displayStock}</span> pieces available</span>
                            ) : (
                                <span>Stock: <span className="font-medium text-slate-700">{totalStock}</span> pieces total</span>
                            )
                        )}

                        {!isSelectionComplete && priceRange && (
                            <span className="text-slate-400 border-l pl-4 border-slate-300">Price Range: {priceRange}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-8">
                    <button
                        onClick={addToCartHandler}
                        disabled={isOutOfStock}
                        className={`px-10 py-2.5 rounded text-white font-medium transition-all ${isOutOfStock
                            ? "bg-slate-300 cursor-not-allowed"
                            : "bg-slate-800 hover:bg-slate-900 active:scale-95"
                            }`}
                    >
                        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </button>
                </div>
                <hr className="border-gray-300 my-5" />
                <div className="flex flex-col gap-4 text-slate-500">
                    <p className="flex gap-3 items-start"> <EarthIcon className="text-slate-300 shrink-0" /> <span>Free shipping via <span className="font-semibold"><span className="text-green-500">budol</span>Express</span> & payment via <span className="font-semibold"><span className="text-green-500">budol</span>Pay</span></span></p>
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400" /> 100% Secured Payment </p>
                    <p className="flex gap-3"> <UserIcon className="text-slate-400" /> Trusted by top brands </p>
                </div>

            </div>
        </div>
    )
}

export default ProductDetails
