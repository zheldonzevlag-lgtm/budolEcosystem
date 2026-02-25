import { SHIPPING_PROVIDERS, TRACKING_REMARKS, PROVIDER_TIMELINE_EVENTS } from '@/lib/shipping/config';
import { UNIVERSAL_STATUS } from '@/lib/shipping/statusMapper';
import BudolPayText from './payment/BudolPayText';
import { formatManilaTime } from "@/lib/dateUtils";

export default function TrackingTimeline({ order }) {
    // Generate timeline events based on order data
    const generateTimeline = () => {
        // Fix: Use bracket notation for universal status keys to avoid undefined errors
        const events = [];
        const shippingStatus = order.shipping?.status || order.shipping?.lastEvent;
        const deferredPaymentMethods = ['COD'];
        const isDeferredPayment = deferredPaymentMethods.includes(order.paymentMethod);
        const deferredPaymentCleared = isDeferredPayment &&
            (order.status === UNIVERSAL_STATUS.DELIVERED || order.status === 'COMPLETED');
        
        // Fix: Use more robust payment check. If status is PAID or higher, it's paid.
        const isPaidStatus = ['PAID', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.status);
        const paymentReceived = !!(order.isPaid || isPaidStatus || (isDeferredPayment && deferredPaymentCleared));
        
        const paymentTime = paymentReceived
            ? (order.paidAt || order.deliveredAt || order.shipping?.deliveredAt || order.updatedAt)
            : null;
        const unpaidLabel = order.paymentMethod === 'BUDOL_PAY'
            ? (
                <>
                    Unpaid (<BudolPayText text="budolPay" />)
                </>
            )
            : 'Unpaid (COD)';

        // Order Placed
        events.push({
            title: 'Order Placed',
            description: <>Order #<BudolPayText text={order.id} /> has been successfully placed</>,
            time: order.createdAt,
            status: 'completed'
        });

        // Paid
        if (isDeferredPayment || paymentReceived) {
            events.push({
                title: 'Paid',
                description: order.paymentMethod === 'COD'
                    ? 'Cash on Delivery - Payment will be collected upon delivery'
                    : order.paymentMethod === 'BUDOL_PAY'
                        ? (paymentReceived ? <><BudolPayText text="budolPay" /> - Payment has been received and verified</> : <><BudolPayText text="budolPay" /> - Payment will be collected upon delivery</>)
                        : 'Payment has been received and verified',
                time: paymentTime,
                status: paymentReceived ? 'completed' : 'pending',
                unpaidLabel
            });
        }

        // To Ship (Courier Booked, Waiting for Pickup)
        if ([UNIVERSAL_STATUS.TO_SHIP, UNIVERSAL_STATUS.SHIPPING, UNIVERSAL_STATUS.DELIVERED, 'COMPLETED'].includes(order.status)) {
            const provider = order.shipping?.provider || SHIPPING_PROVIDERS.STANDARD;
            const timelineConfig = PROVIDER_TIMELINE_EVENTS[provider] || PROVIDER_TIMELINE_EVENTS[SHIPPING_PROVIDERS.STANDARD];
            const hasBooking = !!order.shipping?.bookingId;

            let title = 'To Ship';
            let description = timelineConfig[UNIVERSAL_STATUS.TO_SHIP]?.description || 'Courier booked, waiting for pickup';
            let status = 'completed';

            if (order.status === UNIVERSAL_STATUS.TO_SHIP) {
                status = 'current';
                title = 'To Ship';
                description = 'Courier has been booked. Waiting for driver to pick up your package.';
            }

            events.push({
                title,
                description,
                time: order.shipping?.bookedAt || order.updatedAt,
                status
            });
        }

        // Shipping (Package Picked Up, In Transit)
        if ([UNIVERSAL_STATUS.SHIPPING, UNIVERSAL_STATUS.DELIVERED, 'COMPLETED'].includes(order.status)) {
            const provider = order.shipping?.provider || SHIPPING_PROVIDERS.STANDARD;
            const timelineConfig = PROVIDER_TIMELINE_EVENTS[provider] || PROVIDER_TIMELINE_EVENTS[SHIPPING_PROVIDERS.STANDARD];

            let description = timelineConfig[UNIVERSAL_STATUS.SHIPPING]?.description || 'Your package is on the way to your location';

            // Check for specific remarks
            if (TRACKING_REMARKS[provider]?.[UNIVERSAL_STATUS.SHIPPING]) {
                description = TRACKING_REMARKS[provider][UNIVERSAL_STATUS.SHIPPING];
            }

            events.push({
                title: 'Shipping',
                description: description,
                time: order.shippedAt || order.updatedAt,
                status: order.status === UNIVERSAL_STATUS.SHIPPING ? 'current' : 'completed'
            });
        }



        // Delivery Failed / Cancelled Event
        if (order.shipping?.failureReason) {
            events.push({
                title: 'Delivery Cancelled / Failed',
                description: `Reason: ${order.shipping.failureReason}. The seller has been notified to rebook your delivery.`,
                time: order.shipping.failedAt || order.updatedAt,
                status: 'current' // Always highlight failure
            });
        }

        // Delivered
        if (['DELIVERED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED', 'REFUNDED'].includes(order.status)) {
            events.push({
                title: 'Delivered',
                description: 'Your order has been successfully delivered',
                time: order.deliveredAt || order.updatedAt,
                status: 'completed'
            });
        }

        // Return Requested
        if (['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED', 'REFUNDED'].includes(order.status)) {
            const returnData = order.returns?.[0];
            events.push({
                title: 'Return Requested',
                description: 'A return/refund request has been submitted',
                time: returnData?.createdAt || order.updatedAt,
                status: order.status === 'RETURN_REQUESTED' ? 'current' : 'completed'
            });
        }

        // Return Approved
        if (['RETURN_APPROVED', 'RETURN_DISPUTED', 'REFUNDED', 'IN_TRANSIT'].includes(order.status) && (order.returns?.length > 0)) {
            const returnData = order.returns[0];
            events.push({
                title: 'Return Approved',
                description: 'The return request has been approved by the seller',
                time: returnData.updatedAt || order.updatedAt,
                status: (order.status === 'RETURN_APPROVED' && !returnData.trackingNumber) ? 'current' : 'completed'
            });

            // Return Shipping Events
            if (returnData.trackingNumber) {
                const returnShipping = returnData.returnShipping || {};
                const shippingStatus = returnShipping.status || returnShipping.lastEvent;

                // Return Courier Booked
                events.push({
                    title: 'Return Courier Booked',
                    description: <>Return shipment has been booked. Tracking Number: <BudolPayText text={returnData.trackingNumber} /></>,
                    time: returnData.updatedAt,
                    status: shippingStatus === 'PENDING' ? 'current' : 'completed'
                });

                // Return Package Picked Up
                if (['PICKED_UP', 'ON_GOING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(shippingStatus)) {
                    events.push({
                        title: 'Return Package Picked Up',
                        description: 'The driver has picked up your return package',
                        time: returnShipping.updatedAt || order.updatedAt,
                        status: (shippingStatus === 'PICKED_UP' && order.status !== 'REFUNDED') ? 'current' : 'completed'
                    });
                }

                // Return In Transit
                if (['ON_GOING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(shippingStatus)) {
                    events.push({
                        title: 'Return In Transit',
                        description: 'Your return package is on the way to the seller',
                        time: returnShipping.updatedAt || order.updatedAt,
                        status: (shippingStatus === 'ON_GOING' || shippingStatus === 'IN_TRANSIT') ? 'current' : 'completed'
                    });
                }

                // Return Delivered to Seller
                if (['DELIVERED', 'COMPLETED'].includes(shippingStatus)) {
                    events.push({
                        title: 'Return Delivered',
                        description: 'The return package has been delivered to the seller. Waiting for seller to confirm receipt and process refund.',
                        time: returnShipping.updatedAt || order.updatedAt,
                        status: shippingStatus === 'DELIVERED' ? 'current' : 'completed'
                    });
                }
            }
        }

        // Return Disputed
        if (order.status === 'RETURN_DISPUTED') {
            const returnData = order.returns?.[0];
            events.push({
                title: 'Return Disputed',
                description: 'A dispute has been raised regarding the return/refund request',
                time: returnData?.updatedAt || order.updatedAt,
                status: 'current'
            });
        }

        // Refunded
        if (order.status === 'REFUNDED') {
            events.push({
                title: 'Refunded',
                description: 'The refund has been processed and credited back to your account',
                time: order.updatedAt,
                status: 'completed'
            });
        }

        // Current status if not delivered, not failed, and not return-related
        if (order.status !== 'DELIVERED' &&
            !['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'SHIPPED'].includes(order.status) &&
            !['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED', 'REFUNDED'].includes(order.status) &&
            !order.shipping?.failureReason) {
            events.push({
                title: 'Awaiting Next Update',
                description: 'We will notify you when there is a status change',
                time: null,
                status: 'pending'
            });
        }

        return events;
    };

    const timeline = generateTimeline();

    const formatTime = (time) => {
        if (!time) return 'Pending';
        return formatManilaTime(time);
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm mb-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">Tracking History</h3>

            <div className="relative">
                {/* Vertical line - hidden in mobile, shown in md */}
                <div className="hidden md:block absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200" />

                {/* Timeline events */}
                <div className="space-y-8">
                    {timeline.map((event, index) => {
                        const isPaymentPending = event.title === 'Paid' && event.status === 'pending';

                        return (
                            <div key={index} className="flex gap-4 relative">
                                {/* Dot/Icon */}
                                <div className="flex flex-col items-center">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10
                                        ${event.status === 'completed' ? 'bg-green-500 text-white shadow-md shadow-green-100' : ''}
                                        ${event.status === 'current' ? 'bg-orange-500 text-white shadow-md shadow-orange-100 animate-pulse' : ''}
                                        ${event.status === 'pending' ? 'bg-slate-100 text-slate-400 border border-slate-200' : ''}
                                    `}>
                                        {event.status === 'completed' ? '✓' : index + 1}
                                    </div>
                                    {/* Mobile connector */}
                                    {index !== timeline.length - 1 && (
                                        <div className={`md:hidden w-0.5 flex-1 ${event.status === 'completed' ? 'bg-green-500' : 'bg-slate-200'}`} />
                                    )}
                                </div>

                                <div className="flex-1 pb-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                        <h4 className={`font-bold text-lg ${event.status === 'completed' ? 'text-slate-800' :
                                            event.status === 'current' ? 'text-orange-600' : 'text-slate-400'
                                            }`}>
                                            {event.title}
                                            {isPaymentPending && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    {event.unpaidLabel}
                                                </span>
                                            )}
                                        </h4>
                                        {event.time && (
                                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                                                {formatTime(event.time)}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm leading-relaxed ${event.status === 'pending' ? 'text-slate-400' : 'text-slate-600'
                                        }`}>
                                        {event.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend/Info */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Completed
                    <span className="ml-4 w-2 h-2 rounded-full bg-orange-500"></span> In Progress
                    <span className="ml-4 w-2 h-2 rounded-full bg-slate-200"></span> Upcoming
                </div>
            </div>
        </div>
    );
}
