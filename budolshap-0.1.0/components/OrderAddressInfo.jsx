import { MapPinIcon, InfoIcon, PhoneIcon, MailIcon } from 'lucide-react';
import { formatManilaTime } from "@/lib/dateUtils";

export default function OrderAddressInfo({ order }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 h-full">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <MapPinIcon size={18} className="text-slate-500" />
                    <h3 className="font-semibold text-slate-800">Delivery Address</h3>
                </div>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-lg mb-1">{order.address.name}</h4>
                            <p className="text-slate-600 leading-relaxed">
                                {order.address.street}<br />
                                {order.address.city}, {order.address.state} {order.address.zip}<br />
                                {order.address.country}
                            </p>

                            <div className="mt-4 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <PhoneIcon size={16} />
                                    <span>{order.address.phone}</span>
                                </div>
                                {order.address.email && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <MailIcon size={16} />
                                        <span>{order.address.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 h-full">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <InfoIcon size={18} className="text-slate-500" />
                    <h3 className="font-semibold text-slate-800">Order Information</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-slate-500">Order ID</span>
                        <span className="font-mono font-medium text-slate-700">#{order.id}</span>
                    </div>
                    {order.shipping?.bookingId && (
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-slate-500">Tracking ID</span>
                            <span className="font-mono font-medium text-slate-700">{order.shipping.bookingId}</span>
                        </div>
                    )}
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-slate-500">Date Placed</span>
                        <span className="font-medium text-slate-700">
                            {formatManilaTime(order.createdAt)}
                        </span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-slate-500">Status</span>
                        <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                order.status === 'REFUNDED' ? 'bg-orange-100 text-orange-700' :
                                    ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED'].includes(order.status) ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-700'
                            }`}>
                            {['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED'].includes(order.status)
                                ? (order.status === 'RETURN_APPROVED' && order.returns?.find(r => r.status === 'APPROVED')?.trackingNumber ? 'ITEM RETURNING' : order.status.replace(/_/g, ' '))
                                : order.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                    {order.store && (
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-slate-500">Store</span>
                            <span className="font-medium text-blue-600">{order.store.name}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
