'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loading from '@/components/Loading';

export default function WaybillPage() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                if (!res.ok) throw new Error('Failed to fetch order details');
                const data = await res.json();
                setOrder(data.order);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchOrder();
    }, [orderId]);

    if (loading) return <Loading />;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!order) return <div className="p-8 text-center">Order not found</div>;

    const returnRequest = order.returns?.[0];
    const isReturn = !!returnRequest;
    
    // For returns, sender is buyer, recipient is store
    const sender = isReturn ? {
        name: order.user.name,
        phone: order.address.phone || order.user.phone,
        address: `${order.address.street}, ${order.address.barangay}, ${order.address.city}, ${order.address.province}`
    } : {
        name: order.store.name,
        phone: order.store.contact,
        address: order.store.address
    };

    const recipient = isReturn ? {
        name: order.store.name,
        phone: order.store.contact,
        address: order.store.address
    } : {
        name: order.user.name,
        phone: order.address.phone || order.user.phone,
        address: `${order.address.street}, ${order.address.barangay}, ${order.address.city}, ${order.address.province}`
    };

    return (
        <div className="min-h-screen bg-white p-4 sm:p-8 flex flex-col items-center">
            {/* Print Controls (hidden when printing) */}
            <div className="mb-8 flex gap-4 print:hidden">
                <button 
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-orange-600 transition-colors"
                >
                    Print Waybill
                </button>
                <button 
                    onClick={() => window.close()}
                    className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
                >
                    Close
                </button>
            </div>

            {/* Waybill Container */}
            <div className="w-full max-w-[400px] border-2 border-black p-4 bg-white text-black font-sans">
                {/* Header */}
                <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                    <div className="font-black text-2xl tracking-tighter italic">BUDOLSHAP</div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold uppercase">Tracking Number</div>
                        <div className="font-mono font-bold text-sm">
                            {returnRequest?.trackingNumber || order.shipping?.waybillNumber || 'PENDING'}
                        </div>
                    </div>
                </div>

                {/* Logistics Partner */}
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <div className="text-[10px] font-bold uppercase text-slate-500">Logistics Partner</div>
                        <div className="font-bold text-lg">Lalamove</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Service Type</div>
                        <div className="font-bold">Motorcycle</div>
                    </div>
                </div>

                {/* Recipient Block */}
                <div className="border-2 border-black p-3 mb-4 bg-slate-50">
                    <div className="text-[10px] font-bold uppercase bg-black text-white px-2 py-0.5 inline-block mb-2">RECIPIENT</div>
                    <div className="font-bold text-sm mb-1">{recipient.name}</div>
                    <div className="text-xs mb-1 font-medium">{recipient.phone}</div>
                    <div className="text-xs leading-tight uppercase font-semibold">
                        {recipient.address}
                    </div>
                </div>

                {/* Sender Block */}
                <div className="border border-black p-3 mb-4">
                    <div className="text-[10px] font-bold uppercase border border-black px-2 py-0.5 inline-block mb-2">SENDER</div>
                    <div className="font-bold text-xs mb-1">{sender.name}</div>
                    <div className="text-[10px] mb-1">{sender.phone}</div>
                    <div className="text-[10px] leading-tight uppercase">
                        {sender.address}
                    </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-4 border-t border-black pt-4 mb-4">
                    <div>
                        <div className="text-[10px] font-bold uppercase text-slate-500">Order ID</div>
                        <div className="font-mono text-[10px] font-bold">#{order.id.substring(0, 12)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Date</div>
                        <div className="text-[10px] font-bold">{formatManilaTime(new Date(), { dateStyle: 'short' })}</div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="border-t border-black pt-2">
                    <div className="text-[10px] font-bold uppercase mb-2">Package Contents</div>
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="text-left py-1">Item</th>
                                <th className="text-right py-1">Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.orderItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1 pr-2 truncate max-w-[150px]">{item.product.name}</td>
                                    <td className="py-1 text-right">{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Barcode Placeholder */}
                <div className="mt-8 pt-4 border-t-2 border-black flex flex-col items-center">
                    <div className="w-full h-16 bg-black mb-1 flex items-center justify-center text-white font-mono text-xs overflow-hidden">
                        {/* Fake Barcode visualization */}
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} className="bg-white h-full" style={{ width: `${Math.random() * 4}px`, marginLeft: `${Math.random() * 2}px` }}></div>
                        ))}
                    </div>
                    <div className="font-mono text-[10px] font-bold tracking-widest uppercase">
                        *{order.id.substring(0, 8)}*
                    </div>
                </div>

                {/* Return Label Hint */}
                {isReturn && (
                    <div className="mt-4 bg-amber-100 border border-amber-300 p-2 text-center">
                        <div className="text-[10px] font-bold text-amber-800 uppercase">RETURN PARCEL</div>
                    </div>
                )}
            </div>

            {/* Print Styling */}
            <style jsx global>{`
                @media print {
                    body { background: white; padding: 0; }
                    .print\\:hidden { display: none !important; }
                    .min-h-screen { min-height: auto; }
                }
            `}</style>
        </div>
    );
}
