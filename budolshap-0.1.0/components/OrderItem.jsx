'use client'
import Image from "next/image";
import { DotIcon, Star, MessageSquare, Truck } from "lucide-react";
import BudolPayText from './payment/BudolPayText';
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";

const OrderItem = ({ order, onRepay }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const [ratingModal, setRatingModal] = useState(null);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const router = useRouter();

    const { ratings } = useSelector(state => state.rating);

    // Return status helpers
    const hasActiveReturn = order.returns && order.returns.length > 0;
    const activeReturn = hasActiveReturn ? order.returns[0] : null;
    const isReturning = (order.status === 'RETURN_APPROVED' && activeReturn?.trackingNumber) || (order.status === 'IN_TRANSIT' && hasActiveReturn);
    const isRefunded = order.status === 'REFUNDED';
    const isReturnRequested = order.status === 'RETURN_REQUESTED';
    const isReturnDisputed = order.status === 'RETURN_DISPUTED';

    // Helper function to capitalize first letter
    const capitalizeFirstLetter = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };


    const handleCancelOrder = async (e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to cancel this order?")) return;

        try {
            const res = await fetch(`/api/orders/${order.id}/cancel`, {
                method: 'POST'
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to cancel order");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <tr className={`hidden md:table-row text-sm cursor-pointer hover:bg-slate-100 transition-all duration-200 ${order.paymentStatus === 'cancelled' ? 'opacity-50' : ''}`} onClick={() => router.push(`/orders/${order.id}`)}>

                <td className="text-left px-4 py-2">
                    <div className="flex flex-col gap-6">
                        {order.orderItems.map((item, index) => {
                            // Get variation details if available
                            let displayImage = item.product.images?.[0];
                            let variationName = null;

                            if (item.variationId && item.product.variation_matrix) {
                                const selectedVariation = item.product.variation_matrix.find(v => v.sku === item.variationId);
                                if (selectedVariation) {
                                    // Get variation name from tier_variations
                                    if (item.product.tier_variations) {
                                        const variationNames = selectedVariation.tier_index.map((optionIdx, tierIdx) => {
                                            const tier = item.product.tier_variations[tierIdx];
                                            return tier?.options?.[optionIdx] || '';
                                        }).filter(Boolean);
                                        variationName = variationNames.join(', ');
                                    }
                                    // Use variation image if available
                                    if (selectedVariation.image) {
                                        displayImage = selectedVariation.image;
                                    }
                                }
                            }

                            return (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md">
                                        {displayImage ? (
                                            <Image
                                                className="h-14 w-auto"
                                                src={displayImage}
                                                alt="product_img"
                                                width={50}
                                                height={50}
                                            />
                                        ) : (
                                            <div className="text-slate-400 text-xs text-center">No Image</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center text-sm">
                                        <p className="font-medium text-slate-600 text-base">{item.product.name}</p>
                                        {variationName && (
                                            <p className="text-xs font-medium text-green-600 mt-0.5">{variationName}</p>
                                        )}
                                        <p>{currency}{Number(item.price).toLocaleString()} Qty : {item.quantity} </p>
                                        {index === 0 && (
                                            <div className="relative w-fit">
                                                <div className="group cursor-help transition-colors hover:text-slate-800">
                                                    <span className="text-slate-500">Shipping Fee: </span>
                                                    <span className="text-green-600 font-medium">{currency}{Number(order.shippingCost || 0).toLocaleString()}</span>

                                                    {/* Transparent Shipping Breakdown Tooltip */}
                                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block group-active:block bg-white border border-slate-200 text-slate-800 text-[10px] font-medium rounded-lg p-2 min-w-[180px] z-30 shadow-xl animate-in fade-in zoom-in duration-200">
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-slate-500 border-b border-slate-50 pb-1 mb-1">
                                                                <span>Shipping Breakdown</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Total Cost:</span>
                                                                <span>{currency}{Number(order.shipping?.cost || order.shippingCost || 0).toLocaleString()}</span>
                                                            </div>
                                                            {order.shipping?.shippingDiscount > 0 && (
                                                                <div className="flex justify-between text-green-600">
                                                                    <span>↳ Seller Subsidy:</span>
                                                                    <span>-{currency}{Number(order.shipping.shippingDiscount).toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            {order.shipping?.voucherAmount > 0 && (
                                                                <div className="flex justify-between text-blue-600">
                                                                    <span>↳ Shipping Voucher:</span>
                                                                    <span>-{currency}{Number(order.shipping.voucherAmount).toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            <div className="border-t border-slate-100 mt-1 pt-1 flex justify-between font-bold text-slate-900">
                                                                <span>Net Shipping Fee:</span>
                                                                <span>{currency}{Number(order.shippingCost || 0).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-white"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <p className="mb-1">{new Date(order.createdAt).toDateString()}</p>
                                        <div className="mt-1">
                                            {(() => {
                                                // 1. Check API data (Database)
                                                const dbRating = item.product.rating && item.product.rating[0];

                                                // 2. Check Redux state (Optimistic)
                                                const reduxRating = ratings.find(r => r.orderId === order.id && r.productId === item.product.id);

                                                // 3. Consolidated Rating Object
                                                const finalRating = dbRating || reduxRating;

                                                return finalRating ? (
                                                    <Rating value={finalRating.rating} />
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRatingModal({ orderId: order.id, productId: item.product.id });
                                                        }}
                                                        className={`text-green-500 hover:bg-green-50 transition ${(!['DELIVERED', 'COMPLETED'].includes(order.status) || hasActiveReturn || isRefunded) && 'hidden'}`}
                                                    >
                                                        Rate Product
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {/* Summary breakdown removed as per request */}
                    </div>
                </td>

                <td className="text-left max-md:hidden px-4 py-2">
                    <p className="font-medium text-slate-700">{order.store?.name || 'Unknown Store'}</p>
                    <div className="text-slate-500 text-sm mt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Shipping To:</p>
                        <p className="font-medium text-slate-600">{order.user?.name || order.address?.name}</p>
                        <p>{order.address?.street}</p>
                        <p>{order.address?.city}, {order.address?.state}, {order.address?.zip}, {order.address?.country}</p>
                        <p>{order.address?.phone}</p>
                    </div>
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden px-4 py-2">
                    <div className={`flex items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-medium w-fit ${order.shipping?.failureReason || ['CANCELLED', 'REFUNDED'].includes(order.status) || order.paymentStatus === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : isReturning
                            ? 'bg-amber-100 text-amber-800'
                            : ['DELIVERED', 'COMPLETED'].includes(order.status)
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'PENDING_VERIFICATION'
                                    ? 'bg-amber-100 text-amber-800'
                                    : ['SHIPPED', 'IN_TRANSIT', 'SHIPPING'].includes(order.status)
                                        ? 'bg-purple-100 text-purple-800'
                                        : ['TO_SHIP', 'BOOKED'].includes(order.status)
                                            ? 'bg-blue-100 text-blue-800'
                                            : ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED'].includes(order.status)
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-slate-100 text-slate-800'
                        }`}>
                        {order.paymentStatus === 'cancelled'
                            ? 'Cancelled'
                            : order.shipping?.failureReason
                                ? 'Delivery Cancelled'
                                : order.status === 'RETURN_REQUESTED'
                                    ? 'Return Requested'
                                    : order.status === 'RETURN_APPROVED'
                                        ? (activeReturn?.status === 'BOOKING_REQUESTED' ? 'Return: Pending Booking' :
                                            activeReturn?.status === 'BOOKED' ? 'Return: Courier Booked' :
                                                ['PICKED_UP', 'SHIPPED', 'IN_TRANSIT'].includes(activeReturn?.status) ? 'Item Returning' :
                                                    activeReturn?.status === 'DELIVERED' ? 'Return: Delivered to Store' :
                                                        'Return Approved')
                                        : order.status === 'RETURN_DISPUTED'
                                            ? 'Return Disputed'
                                            : order.status === 'REFUNDED'
                                                ? 'REFUNDED'
                                                : ['SHIPPED', 'IN_TRANSIT', 'SHIPPING'].includes(order.status)
                                                    ? 'IN TRANSIT'
                                                    : order.status === 'PENDING_VERIFICATION'
                                                        ? 'Verifying Payment'
                                                        : ['DELIVERED', 'COMPLETED'].includes(order.status)
                                                            ? 'DELIVERED'
                                                            : order.status === 'TO_SHIP'
                                                                ? 'READY FOR PICKUP'
                                                                : ['ORDER_PLACED', 'PAID', 'PROCESSING'].includes(order.status)
                                                                    ? 'PROCESSING'
                                                                    : capitalizeFirstLetter(order.status.split('_').join(' ').toLowerCase())
                        }
                    </div>
                    {order.shipping?.bookingId && (
                        <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                            <span className="font-medium">Tracking ID:</span> <BudolPayText text={order.shipping.bookingId} />
                        </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                        <span className="font-medium">Order ID:</span> <BudolPayText text={order.id} />
                    </div>

                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden px-4 py-2">
                    <div
                        className={`flex items-center justify-center gap-1 rounded-full p-1 ${order.isPaid
                            ? 'text-green-500 bg-green-100'
                            : ['cancelled', 'failed', 'expired'].includes(order.paymentStatus)
                                ? 'text-slate-500 bg-slate-100'
                                : order.status === 'PENDING_VERIFICATION'
                                    ? 'text-amber-600 bg-amber-50'
                                    : order.paymentMethod === 'COD'
                                        ? 'text-orange-500 bg-orange-100'
                                        : 'text-red-500 bg-red-100'
                            }`}
                    >
                        {order.isPaid
                            ? 'Paid'
                            : order.paymentStatus === 'cancelled'
                                ? 'Cancelled'
                                : order.paymentStatus === 'failed'
                                    ? 'Payment Failed'
                                    : order.paymentStatus === 'expired'
                                        ? 'Payment Expired'
                                        : order.status === 'PENDING_VERIFICATION'
                                            ? 'Verifying'
                                            : order.paymentMethod === 'COD'
                                                ? 'Pending (COD)'
                                                : 'Unpaid'
                        }
                    </div>
                    <div className="text-xs text-slate-500 mt-1 text-center font-medium">
                        via {order.paymentMethod === 'BUDOL_PAY' ? (
                            <BudolPayText text="budolPay" className="text-sm" />
                        ) : order.paymentMethod === 'BUDOL_CARE' ? (
                            <BudolPayText text="budolCare" className="text-sm" />
                        ) : (
                            <span className="font-bold text-green-600">{order.paymentMethod}</span>
                        )}
                    </div>

                    {!order.isPaid && !['cancelled', 'failed', 'expired'].includes(order.paymentStatus) && order.paymentMethod !== 'COD' && order.paymentMethod !== 'BUDOL_PAY' && order.status === 'ORDER_PLACED' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRepay && onRepay(order); }}
                            className="text-xs bg-green-500 text-white px-4 py-1.5 rounded mt-3 hover:bg-green-600 w-full"
                        >
                            Pay Now
                        </button>
                    )}

                    {!order.isPaid && !['cancelled', 'failed', 'expired'].includes(order.paymentStatus) && order.status === 'ORDER_PLACED' && (
                        <button
                            onClick={handleCancelOrder}
                            className="text-xs text-red-500 hover:text-red-700 underline mt-2 block w-full text-center"
                        >
                            Cancel Order
                        </button>
                    )}
                </td>

                <td className="text-left text-sm max-md:hidden px-4 py-2">
                    {isReturning && activeReturn?.returnShipping?.shareLink ? (
                        <div className="flex flex-col items-start gap-1">
                            <Image src="/lalamove-logo.png" alt="Lalamove" width={150} height={130} className="object-contain w-16 h-auto" />
                            <a
                                href={activeReturn.returnShipping.shareLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-amber-600 font-bold hover:underline whitespace-nowrap"
                            >
                                Track Return
                            </a>
                        </div>
                    ) : order.shipping && order.shipping.provider === 'lalamove' ? (
                        <div className="flex flex-col items-start gap-1">
                            <Image src="/lalamove-logo.png" alt="Lalamove" width={150} height={130} className="object-contain w-16 h-auto" />
                            {order.shipping.shareLink ? (
                                <a
                                    href={order.shipping.shareLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-600 hover:underline whitespace-nowrap"
                                >
                                    Track Delivery
                                </a>
                            ) : (
                                <span className="text-slate-400 whitespace-nowrap">Pending Booking</span>
                            )}
                        </div>
                    ) : order.shipping && order.shipping.provider === 'bud_express' ? (
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-green-600 font-bold italic whitespace-nowrap">BUD EXPRESS</span>
                            <span className="text-slate-400 text-[10px] whitespace-nowrap">Fast Delivery</span>
                        </div>
                    ) : order.shipping && order.shipping.provider ? (
                        <span className="text-slate-600 font-medium whitespace-nowrap">
                            {capitalizeFirstLetter(order.shipping.provider.replace('_', ' '))}
                        </span>
                    ) : (
                        <span className="text-slate-400 whitespace-nowrap">Standard Delivery</span>
                    )}
                </td>
            </tr>
            {/* Mobile Card View (BudolShap PH Inspired - Green Theme) */}
            <tr className={`md:hidden ${order.paymentStatus === 'cancelled' ? 'opacity-50' : ''}`}>
                <td colSpan={7} className="px-0 py-2">
                    <div
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="bg-white border-y md:border border-slate-100 mb-3 overflow-hidden shadow-sm cursor-pointer active:bg-slate-50 transition-colors"
                    >
                        {/* Store Header */}
                        <div className="px-4 py-3 border-b border-slate-50 flex items-start justify-between bg-white gap-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-50 flex-shrink-0 mt-0.5">
                                    {order.store?.logo ? (
                                        <Image
                                            src={order.store.logo}
                                            alt={order.store.name}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-contain p-0.5"
                                        />
                                    ) : (
                                        <span className="text-[12px] font-bold text-green-600">BS</span>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 pt-0.5">
                                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-1 leading-tight line-clamp-2">
                                        {order.store?.name || 'Budol Seller'}
                                        <svg className="w-3 h-3 text-slate-400 flex-shrink-0 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-start gap-1 flex-shrink-0 pt-0.5">
                                <span className={`text-[10px] font-bold uppercase whitespace-nowrap border rounded px-1.5 py-0.5 tracking-tight ${order.status === 'PENDING_VERIFICATION'
                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                    : isReturning
                                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                                        : 'bg-green-50/30 text-green-600 border-green-100'
                                    }`}>
                                    {order.status === 'RETURN_REQUESTED' ? 'Return Requested'
                                        : order.status === 'RETURN_APPROVED' ? (
                                            activeReturn?.status === 'BOOKING_REQUESTED' ? 'Pending Booking' :
                                                activeReturn?.status === 'BOOKED' ? 'Courier Booked' :
                                                    ['PICKED_UP', 'SHIPPED', 'IN_TRANSIT'].includes(activeReturn?.status) ? 'Item Returning' :
                                                        activeReturn?.status === 'DELIVERED' ? 'Arrived at Store' :
                                                            'Return Approved'
                                        )
                                            : order.status === 'RETURN_DISPUTED' ? 'Return Disputed'
                                                : order.status === 'REFUNDED' ? 'Refunded'
                                                    : order.status === 'DELIVERED' ? 'Delivered'
                                                        : order.status === 'PENDING_VERIFICATION' ? 'Verifying Payment'
                                                            : ['ORDER_PLACED', 'PAID', 'PROCESSING'].includes(order.status) ? 'Processing'
                                                                : order.status.replace(/_/g, ' ')}
                                </span>
                                {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && !hasActiveReturn && !isRefunded && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRatingModal({ orderId: order.id, productId: order.orderItems[0].product.id });
                                        }}
                                        className="text-green-600 hover:text-green-700 transition-colors py-1 pl-1"
                                        title="Rate Product"
                                    >
                                        <Star size={12} fill="currentColor" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Product Items */}
                        <div className="px-4 py-4 space-y-4">
                            {order.orderItems.map((item, idx) => {
                                // Get variation details if available
                                let displayImage = item.product.images?.[0];
                                let variationName = null;

                                if (item.variationId && item.product.variation_matrix) {
                                    const selectedVariation = item.product.variation_matrix.find(v => v.sku === item.variationId);
                                    if (selectedVariation) {
                                        // Get variation name from tier_variations
                                        if (item.product.tier_variations) {
                                            const variationNames = selectedVariation.tier_index.map((optionIdx, tierIdx) => {
                                                const tier = item.product.tier_variations[tierIdx];
                                                return tier?.options?.[optionIdx] || '';
                                            }).filter(Boolean);
                                            variationName = variationNames.join(', ');
                                        }
                                        // Use variation image if available
                                        if (selectedVariation.image) {
                                            displayImage = selectedVariation.image;
                                        }
                                    }
                                }

                                return (
                                    <div key={idx} className="flex gap-3">
                                        <div className="w-20 h-20 bg-slate-50 rounded border border-slate-100 flex-shrink-0">
                                            {displayImage ? (
                                                <Image
                                                    src={displayImage}
                                                    alt={item.product.name}
                                                    width={80}
                                                    height={80}
                                                    className="w-full h-full object-contain rounded"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300">No Image</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[14px] text-slate-800 leading-tight line-clamp-2 mb-1">
                                                {item.product.name}
                                            </h3>
                                            {variationName && (
                                                <p className="text-xs font-medium text-green-600 mb-1">{variationName}</p>
                                            )}
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                <p className="text-[12px] text-slate-400">
                                                    Qty: {item.quantity}
                                                </p>
                                                <p className="text-[13px] font-medium text-slate-700">
                                                    {currency}{Number(item.price).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>



                        <div className="border-t border-slate-50 mx-4" />

                        {/* Payment Information Section */}
                        <div className="px-4 py-3 space-y-2.5">
                            <h4 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">Payment Information</h4>

                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-slate-500">Payment Method</span>
                                <div className="flex items-center gap-1 font-semibold text-slate-800">
                                    {order.paymentMethod === 'GCASH' && <span className="text-blue-600">GCash</span>}
                                    {order.paymentMethod === 'MAYA' && <span className="text-green-500">Maya</span>}
                                    {order.paymentMethod === 'QRPH' && <span className="text-red-600">QRPh</span>}
                                    {order.paymentMethod === 'COD' && <span className="text-green-600">COD</span>}
                                    {order.paymentMethod === 'BUDOL_PAY' && (
                                        <div className="font-bold">
                                            <BudolPayText text="budolPay" />
                                        </div>
                                    )}
                                    {!['GCASH', 'MAYA', 'QRPH', 'COD', 'BUDOL_PAY'].includes(order.paymentMethod) && <span>{order.paymentMethod}</span>}
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-slate-500">Subtotal</span>
                                <span className="text-slate-800">{currency}{Number(order.total - order.shippingCost).toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-slate-500">Shipping Fee</span>
                                <span className="text-slate-800">{currency}{Number(order.shippingCost).toLocaleString()}</span>
                            </div>

                            {order.isCouponUsed && (
                                <div className="flex justify-between items-center text-[12px]">
                                    <span className="text-slate-500">Voucher Discount</span>
                                    <span className="text-green-600">-{currency}{(order.coupon?.discount || 0).toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[14px] font-bold text-slate-900 tracking-tight">Order Total</span>
                                <span className="text-base font-bold text-green-600">{currency}{Number(order.total).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="border-t border-slate-100">
                            {/* Full width ID Info */}
                            <div className="px-4 py-2 border-b border-slate-50 flex flex-col gap-1 text-[12px]">
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-slate-500 font-medium">Order Id</span>
                                    <span className="text-slate-400 font-mono tracking-tighter truncate max-w-[200px]">
                                        <BudolPayText text={order.id} />
                                    </span>
                                </div>
                                {order.shipping?.bookingId && (
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-slate-500 font-medium">Tracking Id</span>
                                        <span className="text-slate-400 font-mono tracking-tighter truncate max-w-[200px]">
                                            <BudolPayText text={order.shipping.bookingId} />
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Need Help Row */}
                            <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between overflow-hidden">
                                <span className="text-[13px] text-slate-800 font-medium">Need Help?</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowComingSoon(true);
                                    }}
                                    className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm"
                                >
                                    <MessageSquare size={14} className="fill-blue-600/10" />
                                    <span className="text-[12px] font-bold whitespace-nowrap">
                                        Chat <BudolPayText text="budolCare" />
                                    </span>
                                </button>
                            </div>

                            {/* Cancel Order Row (If applicable) */}
                            {order.status === 'ORDER_PLACED' && !order.isPaid && (
                                <div className="px-4 py-3 border-b border-slate-50 text-center">
                                    <button
                                        onClick={handleCancelOrder}
                                        className="text-[13px] text-green-600 font-medium hover:text-green-700 transition-colors w-full"
                                    >
                                        Cancel Order
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Contact Seller Button */}
                        <div className="px-4 py-3 bg-white">
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-green-600 text-white py-2 rounded text-[14px] font-semibold active:bg-green-700 transition-colors shadow-sm"
                            >
                                Contact Seller
                            </button>
                        </div>
                    </div>



                    {/* Pay Now Button (If applicable) */}
                    {!order.isPaid && !['cancelled', 'failed', 'expired'].includes(order.paymentStatus) && order.paymentMethod !== 'COD' && order.paymentMethod !== 'BUDOL_PAY' && order.status === 'ORDER_PLACED' && (
                        <div className="px-4 mb-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); onRepay && onRepay(order); }}
                                className="w-full bg-green-500 text-white py-3 rounded-lg font-bold shadow-md"
                            >
                                Complete Payment
                            </button>
                        </div>
                    )}
                </td>
            </tr>
            {/* Render RatingModal outside table structure */}
            {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}

            {/* Coming Soon Popup */}
            {showComingSoon && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    onClick={() => setShowComingSoon(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-8 shadow-2xl scale-in-center max-w-[280px] w-full text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare size={32} className="text-blue-600 animate-bounce" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Coming Soon!</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6">
                            I'm currently strategizing <BudolPayText text="budolCare" /> chat experience for you.
                        </p>
                        <button
                            onClick={() => setShowComingSoon(false)}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default OrderItem