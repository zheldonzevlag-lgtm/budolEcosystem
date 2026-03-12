'use client';
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import Loading from "@/components/Loading";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon, Eye, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/context/AuthContext";
import { useAuthUI } from "@/context/AuthUIContext";

export default function Cart() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const { cartItems, isLoading } = useSelector(state => state.cart);
    const dispatch = useDispatch();

    const { user } = useAuth();
    const { showLogin } = useAuthUI();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [hasOutOfStock, setHasOutOfStock] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [productsMap, setProductsMap] = useState({});
    const attemptedIdsRef = useRef(new Set());

    const handleToggleSelection = (itemKey) => {
        setSelectedItemIds(prev =>
            prev.includes(itemKey)
                ? prev.filter(id => id !== itemKey)
                : [...prev, itemKey]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItemIds(cartArray.filter(item => item.inStock).map(item => item.itemKey));
        } else {
            setSelectedItemIds([]);
        }
    };

    const selectedItems = cartArray.filter(item => selectedItemIds.includes(item.itemKey));
    const selectedTotalPrice = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Fetch product details for cart items (Only fetch if missing)
    useEffect(() => {
        const fetchMissingProducts = async () => {
            if (Object.keys(cartItems).length === 0) return;

            const itemKeys = Object.keys(cartItems);
            const productIds = Array.from(new Set(itemKeys.map(key => key.split('_')[0])));
            
            // Check for missing products in our map
            const missingIds = productIds.filter(id => !productsMap[id] && !attemptedIdsRef.current.has(id));

            if (missingIds.length > 0) {
                // Mark IDs as attempted to prevent infinite loops
                missingIds.forEach(id => attemptedIdsRef.current.add(id));

                setLoadingProducts(true);
                try {
                    const response = await fetch(`/api/products?ids=${missingIds.join(',')}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch products: ${response.statusText}`);
                    }
                    const fetchedProducts = await response.json();
                    
                    setProductsMap(prev => {
                        const newMap = { ...prev };
                        fetchedProducts.forEach(p => newMap[p.id] = p);
                        return newMap;
                    });
                } catch (error) {
                    console.error('Error fetching cart products:', error);
                } finally {
                    setLoadingProducts(false);
                }
            }
        };

        if (!isLoading) {
            fetchMissingProducts();
        }
    }, [cartItems, isLoading, productsMap]);

    // Build Cart Array whenever cartItems or productsMap changes
    useEffect(() => {
        if (Object.keys(cartItems).length === 0) {
            if (!isProcessing) {
                setCartArray([]);
                setTotalPrice(0);
            }
            return;
        }

        const itemKeys = Object.keys(cartItems);
        const arr = [];
        let total = 0;
        let outOfStockDetected = false;

        itemKeys.forEach(itemKey => {
            const [productId, ...variationParts] = itemKey.split('_');
            const variationId = variationParts.join('_');
            const baseProduct = productsMap[productId];

            if (baseProduct) {
                const quantity = cartItems[itemKey];
                let itemData = { ...baseProduct, quantity, itemKey, productId, variationId };

                // If there's a variation, update price, image, and stock status
                if (variationId && baseProduct.variation_matrix) {
                    const selectedVariation = baseProduct.variation_matrix.find(v => v.sku === variationId);

                    if (selectedVariation) {
                        if (baseProduct.tier_variations) {
                            const variationNames = selectedVariation.tier_index.map((optionIdx, tierIdx) => {
                                const tier = baseProduct.tier_variations[tierIdx];
                                return tier?.options?.[optionIdx] || '';
                            }).filter(Boolean);
                            itemData.variationName = variationNames.join(', ');
                        }

                        itemData.price = selectedVariation.price;
                        if (selectedVariation.mrp) itemData.mrp = selectedVariation.mrp;
                        if (selectedVariation.image) itemData.images = [selectedVariation.image, ...baseProduct.images];
                        itemData.inStock = selectedVariation.stock > 0;
                    }
                }

                arr.push(itemData);

                if (itemData.inStock) {
                    total += itemData.price * quantity;
                } else {
                    outOfStockDetected = true;
                }
            }
        });

        setCartArray(arr);
        setTotalPrice(total);
        setHasOutOfStock(outOfStockDetected);
    }, [cartItems, productsMap, isProcessing]);

    const handleDeleteItemFromCart = (productId, variationId) => {
        dispatch(deleteItemFromCart({ productId, variationId }));
    };

    // Show loading while cart is being fetched
    if (isLoading || (loadingProducts && cartArray.length === 0)) {
        return <Loading />;
    }



    return (cartArray.length > 0 || isProcessing) ? (
        <div className="min-h-screen mx-6 text-slate-800">
            <div className="max-w-7xl mx-auto ">
                <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

                {hasOutOfStock && (
                    <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h3 className="font-semibold text-red-800 text-lg">Out of Stock Items Detected</h3>
                                <p className="text-red-700 text-sm mt-1">
                                    Some items in your cart are currently unavailable. Please remove them to proceed with your order.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">
                    {/* Desktop Table View */}
                    <table className="w-full max-w-4xl text-slate-600 table-auto max-md:hidden">
                        <thead>
                            <tr className="max-sm:text-sm border-b border-slate-100">
                                <th className="text-left py-4 px-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedItemIds.length === cartArray.filter(item => item.inStock).length && cartArray.filter(item => item.inStock).length > 0}
                                        onChange={handleSelectAll}
                                        className="size-4 rounded accent-indigo-600 cursor-pointer"
                                    />
                                </th>
                                <th className="text-left py-4">Product</th>
                                <th className="text-left py-4">Store</th>
                                <th className="py-4">Quantity</th>
                                <th className="py-4">Total Price</th>
                                <th className="max-md:hidden py-4">Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartArray.map((item, index) => (
                                <tr key={index} className={`space-x-2 border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${!item.inStock ? 'bg-red-50/30' : ''}`}>
                                    <td className="py-4 px-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedItemIds.includes(item.itemKey)}
                                            onChange={() => handleToggleSelection(item.itemKey)}
                                            disabled={!item.inStock}
                                            className={`size-4 rounded accent-indigo-600 cursor-pointer ${!item.inStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                                        />
                                    </td>
                                    <td className="flex gap-3 my-4">
                                        <div
                                            className="relative flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md group overflow-hidden cursor-pointer"
                                            onClick={() => item.images[0] && setPreviewImage(item.images[0])}
                                        >
                                            {item.images[0] ? (
                                                <Image
                                                    src={item.images[0]}
                                                    className={`h-14 w-auto transition-all duration-300 ${!item.inStock ? 'opacity-50' : ''}`}
                                                    alt=""
                                                    width={45}
                                                    height={45}
                                                />
                                            ) : (
                                                <div className="h-14 w-14 flex items-center justify-center bg-slate-200">
                                                    <span className="text-xs text-slate-400">No img</span>
                                                </div>
                                            )}
                                            {/* Eye Icon Overlay */}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <Eye className="text-white h-6 w-6" />
                                            </div>
                                            {!item.inStock && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-md z-10">
                                                    <span className="text-white text-xs font-bold">OUT</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className={`max-sm:text-sm ${!item.inStock ? 'text-slate-400' : ''}`}>{item.name}</p>
                                                {!item.inStock && (
                                                    <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-semibold">
                                                        Out of Stock
                                                    </span>
                                                )}
                                            </div>
                                            {item.variationName && (
                                                <p className="text-xs font-medium text-green-600 mt-1">
                                                    {item.variationName}
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-500 mt-1">{item.category}</p>
                                            <p className={!item.inStock ? 'line-through text-slate-400 font-medium' : 'font-medium'}>{currency}{Number(item.price).toLocaleString()}</p>
                                        </div>
                                    </td>
                                    <td className="text-left align-top py-4">
                                        {item.store && (
                                            <div className="text-sm">
                                                <p className="font-medium text-slate-700">{item.store.name}</p>
                                                {(item.store.addresses?.[0] || item.store.address) ? (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {item.store.addresses?.[0]
                                                            ? [item.store.addresses[0].city, item.store.addresses[0].district].filter(Boolean).join(', ')
                                                            : item.store.address}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-red-400 mt-1 italic">
                                                        No address set
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {item.inStock ? (
                                            <Counter productId={item.productId} variationId={item.variationId} />
                                        ) : (
                                            <span className="text-slate-400 text-sm">N/A</span>
                                        )}
                                    </td>
                                    <td className={`text-center ${!item.inStock ? 'line-through text-slate-400 font-medium' : 'font-medium'}`}>
                                        {currency}{(item.price * (cartItems[item.itemKey] || item.quantity)).toLocaleString()}
                                    </td>
                                    <td className="text-center max-md:hidden">
                                        <button onClick={() => handleDeleteItemFromCart(item.productId, item.variationId)} className="text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all">
                                            <Trash2Icon size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="w-full md:hidden space-y-4">
                        <div className="flex items-center gap-2 pb-2 px-1 border-b border-slate-100">
                            <input
                                type="checkbox"
                                checked={selectedItemIds.length === cartArray.filter(item => item.inStock).length && cartArray.filter(item => item.inStock).length > 0}
                                onChange={handleSelectAll}
                                className="size-4 rounded accent-indigo-600 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-700">Select All Items</span>
                        </div>
                        {cartArray.map((item, index) => (
                            <div key={index} className={`bg-white border rounded-lg p-4 relative ${!item.inStock ? 'bg-red-50 border-red-200' : 'border-slate-200'}`}>
                                <div className="absolute top-4 left-4 z-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedItemIds.includes(item.itemKey)}
                                        onChange={() => handleToggleSelection(item.itemKey)}
                                        disabled={!item.inStock}
                                        className={`size-4 rounded accent-indigo-600 cursor-pointer ${!item.inStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div className="flex gap-3 mb-3 ml-7">
                                    <div className="relative flex-shrink-0">
                                        <div
                                            className="relative flex items-center justify-center bg-slate-100 size-18 rounded-md group overflow-hidden cursor-pointer"
                                            onClick={() => item.images[0] && setPreviewImage(item.images[0])}
                                        >
                                            {item.images[0] ? (
                                                <Image
                                                    src={item.images[0]}
                                                    className={`h-16 w-auto ${!item.inStock ? 'opacity-50' : ''}`}
                                                    alt=""
                                                    width={64}
                                                    height={64}
                                                />
                                            ) : (
                                                <div className="h-16 w-16 flex items-center justify-center bg-slate-200">
                                                    <span className="text-xs text-slate-400">No img</span>
                                                </div>
                                            )}
                                            {/* Eye Icon Overlay */}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <Eye className="text-white h-5 w-5" />
                                            </div>
                                            {!item.inStock && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-md">
                                                    <span className="text-white text-xs font-bold">OUT</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className={`text-sm font-medium ${!item.inStock ? 'text-slate-400' : 'text-slate-800'}`}>{item.name}</p>
                                                    {!item.inStock && (
                                                        <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-semibold whitespace-nowrap">
                                                            Out of Stock
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.category}</p>
                                            </div>
                                            <button onClick={() => handleDeleteItemFromCart(item.productId, item.variationId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full active:scale-95 transition-all flex-shrink-0">
                                                <Trash2Icon size={16} />
                                            </button>
                                        </div>
                                        {item.store && (
                                            <div className="text-xs text-slate-600 mb-2">
                                                <p className="font-medium">{item.store.name}</p>
                                                {(item.store.addresses?.[0] || item.store.address) ? (
                                                    <p className="text-slate-500">
                                                        {item.store.addresses?.[0]
                                                            ? [item.store.addresses[0].city, item.store.addresses[0].district].filter(Boolean).join(', ')
                                                            : item.store.address}
                                                    </p>
                                                ) : (
                                                    <p className="text-red-400 italic">
                                                        No address set
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quantity and Price Row - Always Visible */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-600 font-medium">Quantity:</span>
                                        {item.inStock ? (
                                            <Counter productId={item.productId} variationId={item.variationId} />
                                        ) : (
                                            <span className="text-slate-400 text-sm">N/A</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-600 block mb-0.5">Total Price:</span>
                                        <span className={`text-base font-bold ${!item.inStock ? 'line-through text-slate-400' : 'text-green-600'}`}>
                                            {currency}{(item.price * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <OrderSummary
                        totalPrice={selectedTotalPrice}
                        items={selectedItems}
                        hasOutOfStock={hasOutOfStock}
                        onProcessing={setIsProcessing}
                    />
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-6 left-6 z-10 select-none transition-all hover:scale-105 group/logo">
                            <div className="bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20">
                                <Image
                                    src="/assets/budolShap/budolShap_logo_white.png"
                                    alt="budolShap Logo"
                                    width={400}
                                    height={120}
                                    quality={100}
                                    priority
                                    className="h-16 w-auto object-contain opacity-100 brightness-110 contrast-110"
                                />
                            </div>
                        </div>
                        <button
                            className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="h-6 w-6 text-slate-700" />
                        </button>
                        <div className="p-8 flex items-center justify-center bg-slate-50 min-h-[300px]">
                            <div className="relative w-full h-[50vh]">
                                <Image
                                    src={previewImage}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 1024px) 100vw, 80vw"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    ) : (
        <div className="min-h-[80vh] mx-6 flex flex-col items-center justify-center text-slate-400 gap-4">
            <h1 className="text-2xl sm:text-4xl font-semibold">
                {isProcessing ? "Processing your order..." : "Your cart is empty"}
            </h1>
            {isProcessing && (
                <div className="flex flex-col items-center gap-4">
                    <Loading />
                    <p className="text-sm">Please do not close this page.</p>
                </div>
            )}
            {!user && !isProcessing && (
                <button
                    onClick={() => showLogin('/cart')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors"
                >
                    Login to view your saved cart
                </button>
            )}
        </div>
    );
}