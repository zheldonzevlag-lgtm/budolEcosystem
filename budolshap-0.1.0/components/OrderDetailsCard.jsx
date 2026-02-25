import Image from 'next/image';
import BudolPayText from './payment/BudolPayText';
import { formatManilaTime } from "@/lib/dateUtils";

export default function OrderDetailsCard({ order }) {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₱';

    // Calculate totals
    const subtotal = order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = order.shippingCost || 0;
    const discount = order.discount || 0;

    return (
        <div className="bg-white rounded-xl shadow-sm mb-6">
            {/* Order Items Section */}
            <div className="p-6 md:p-8 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-800 mb-6">Order Items</h3>
                <div className="space-y-4">
                    {order.orderItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            {/* Product Image */}
                            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                {item.product.images && item.product.images[0] ? (
                                    <Image
                                        src={item.product.images[0]}
                                        alt={item.product.name}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                ) : (
                                    <span className="text-slate-400 text-xs">No Image</span>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{item.product.name}</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {currency}{item.price} × {item.quantity}
                                </p>
                                {item.product.category && (
                                    <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {item.product.category}
                                    </span>
                                )}
                            </div>

                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-slate-800 text-lg">
                                    {currency}{(item.price * item.quantity).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Summary Section */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white">
                <h3 className="text-xl font-semibold text-slate-800 mb-6">Order Summary</h3>

                <div className="space-y-3">
                    {/* Subtotal */}
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span className="font-medium">{currency}{Number(subtotal).toLocaleString()}</span>
                    </div>

                    {/* Shipping */}
                    <div className="flex justify-between text-slate-600">
                        <span>Shipping Fee</span>
                        <span className="font-medium">
                            {shippingCost > 0 ? `${currency}${Number(shippingCost).toLocaleString()}` : 'FREE'}
                        </span>
                    </div>

                    {/* Discount */}
                    {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span className="font-medium">-{currency}{Number(discount).toLocaleString()}</span>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-slate-300 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-slate-800">Total</span>
                            <span className="text-2xl font-bold text-green-600">
                                {currency}{Number(order.total).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Payment Method</p>
                            <p className="font-semibold text-slate-800 flex items-center gap-2">
                                {order.paymentMethod === 'COD' && '💵'}
                                {order.paymentMethod === 'GCASH' && '💳'}
                                {order.paymentMethod === 'CARD' && '💳'}
                                {order.paymentMethod === 'BUDOL_PAY' ? (
                                    <BudolPayText text="budolPay" />
                                ) : (
                                    order.paymentMethod
                                )}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500 mb-1">Payment Status</p>
                            <span className={`
                                inline-block px-3 py-1 rounded-full text-sm font-medium
                                ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                            `}>
                                {order.isPaid ? '✓ Paid' : 'Pending'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delivery Address Section */}
            <div className="p-6 md:p-8 border-t border-slate-200">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Delivery Address</h3>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">📍</span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 text-lg mb-2">{order.address.name}</p>
                            <p className="text-slate-600">{order.address.street}</p>
                            <p className="text-slate-600">
                                {order.address.city}, {order.address.state} {order.address.zip}
                            </p>
                            <p className="text-slate-600">{order.address.country}</p>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-slate-700 flex items-center gap-2">
                                    <span>📞</span>
                                    <span className="font-medium">{order.address.phone}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Information Section */}
            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Order Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Order ID</p>
                        <p className="font-mono text-sm text-slate-800 break-all">#<BudolPayText text={order.id} /></p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Order Date</p>
                        <p className="font-medium text-slate-800">
                            {formatManilaTime(order.createdAt)}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Order Status</p>
                        <p className="font-semibold text-slate-800">{order.status.replace(/_/g, ' ')}</p>
                    </div>
                    {order.store && (
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-500 mb-1">Store</p>
                            <p className="font-semibold text-slate-800">{order.store.name}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
