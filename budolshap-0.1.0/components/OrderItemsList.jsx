import Image from 'next/image';
import { PhoneIcon, MessageCircleIcon } from 'lucide-react';
import BudolPayText from './payment/BudolPayText';

export default function OrderItemsList({ order }) {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₱';

    // Calculate totals
    const subtotal = order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = order.shippingCost || 0;
    const discount = order.discount || 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 h-fit">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Order Items</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {order.orderItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 hover:bg-slate-60 transition-colors">
                            {/* Product Image */}
                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200">
                                {item.product.images && item.product.images[0] ? (
                                    <Image
                                        src={item.product.images[0]}
                                        alt={item.product.name}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                ) : (
                                    <span className="text-slate-400 text-xs">No Image</span>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">{item.product.name}</p>
                                <p className="text-sm text-slate-500">
                                    {currency}{Number(item.price).toLocaleString()} × {item.quantity}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Sold by: <span className="font-medium text-slate-700">{order.store?.name}</span>
                                </p>
                                {order.store?.contact && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <PhoneIcon size={14} className="text-slate-400" />
                                            <span>{order.store.contact}</span>
                                        </div>
                                        <button
                                            className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full w-fit transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // TODO: Implement chat functionality
                                                alert('Chat feature coming soon!');
                                            }}
                                        >
                                            <MessageCircleIcon size={14} />
                                            Chat the Seller
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Price */}
                            < div className="text-right flex-shrink-0" >
                                <p className="font-semibold text-slate-800">
                                    {currency}{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div >

            {/* Payment Summary */}
            < div className="lg:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 h-fit" >
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Payment Summary</h3>
                </div>
                <div className="p-6 space-y-3">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span className="font-medium">{currency}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Shipping Fee</span>
                        <span className="font-medium">
                            {order.shipping?.cost > 0 || shippingCost > 0 
                                ? `${currency}${(order.shipping?.cost || shippingCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                : 'FREE'}
                        </span>
                    </div>
                    {order.shipping?.shippingDiscount > 0 && (
                        <div className="flex justify-between text-green-600 text-xs pl-4">
                            <span>↳ Seller Subsidy</span>
                            <span className="font-medium">-{currency}{order.shipping.shippingDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    {order.shipping?.voucherAmount > 0 && (
                        <div className="flex justify-between text-blue-600 text-xs pl-4">
                            <span>↳ Shipping Voucher</span>
                            <span className="font-medium">-{currency}{order.shipping.voucherAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span className="font-medium">-{currency}{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    <div className="border-t border-slate-200 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">Total Amount</span>
                            <span className="text-xl font-bold text-green-600">
                                {currency}{order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {order.returns && order.returns.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 px-6 pb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-800">Return Summary</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${order.returns[0].status === 'REFUNDED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {order.returns[0].status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Refund Amount</span>
                                <span className="font-bold text-green-600">{currency}{Number(order.returns[0].refundAmount).toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 italic">
                                {order.returns[0].status === 'REFUNDED' 
                                    ? <><BudolPayText text="budolPay" /> funds have been released to your wallet/payment method.</> 
                                    : <>Funds are securely locked in <BudolPayText text="budolShap" /> Escrow.</>}
                            </p>
                        </div>
                    )}
                </div>

                {/* Payment Method Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Paid via</span>
                        {order.paymentMethod === 'BUDOL_PAY' ? (
                            <span className="font-semibold text-slate-700"><BudolPayText text="budolPay" /></span>
                        ) : order.paymentMethod === 'BUDOL_CARE' ? (
                            <span className="font-semibold text-slate-700"><BudolPayText text="budolCare" /></span>
                        ) : (
                            <span className="font-semibold text-slate-700">{order.paymentMethod}</span>
                        )}
                    </div>
                    <span className={`
                        px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                    `}>
                        {order.isPaid ? 'Paid' : 'Pending'}
                    </span>
                </div>
            </div >
        </div >
    );
}
