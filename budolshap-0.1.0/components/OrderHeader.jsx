import BudolPayText from './payment/BudolPayText';
import { formatManilaTime } from "@/lib/dateUtils";

export default function OrderHeader({ order }) {
    // Calculate estimated delivery date
    const getEstimatedDelivery = () => {
        if (!order) return 'Pending';
        const isLalamove = order.shipping?.provider === 'lalamove';

        if (isLalamove) {
            // Same day delivery
            return 'Today';
        } else {
            // Standard delivery: 3-5 days from order date
            const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
            const estimatedDate = new Date(orderDate);
            estimatedDate.setDate(estimatedDate.getDate() + 5);

            return formatManilaTime(estimatedDate, { dateStyle: 'medium' });
        }
    };

    // Format shipping status for display
    const getShippingStatusDisplay = () => {
        if (!order) return 'Pending';
        // If the order is in a terminal return state, show that instead of shipping status
        const hasActiveReturn = order.returns && order.returns.length > 0;

        if (order.status === 'REFUNDED') return 'REFUNDED';
        if (order.status === 'CANCELLED') return 'CANCELLED';
        if (order.status === 'RETURN_REQUESTED') return 'RETURN REQUESTED';
        if (order.status === 'RETURN_APPROVED') {
            const activeReturn = order.returns?.[0];
            if (!activeReturn) return 'RETURN APPROVED';

            if (activeReturn.status === 'BOOKING_REQUESTED') return 'RETURN: PENDING BOOKING';
            if (activeReturn.status === 'BOOKED') return 'RETURN: COURIER BOOKED';
            if (['PICKED_UP', 'SHIPPED', 'IN_TRANSIT'].includes(activeReturn.status)) return 'ITEM RETURNING';
            if (activeReturn.status === 'DELIVERED') return 'RETURN: ARRIVED AT STORE';

            return 'RETURN APPROVED';
        }
        if (order.status === 'RETURN_DISPUTED') return 'RETURN DISPUTED';

        const status = order.shipping?.status;
        if (!status) return 'Pending Booking';

        const statusMap = {
            'ASSIGNING_DRIVER': 'Finding Driver',
            'ON_GOING': 'TO SHIP',
            'PICKED_UP': 'TO RECEIVE',
            'COMPLETED': 'COMPLETED',
            'DELIVERED': 'COMPLETED',
            'CANCELED': 'CANCELLED',
            'EXPIRED': 'EXPIRED',
            'REJECTED': 'REJECTED'
        };

        return statusMap[status] || status.replace(/_/g, ' ');
    };

    const getHeaderColor = () => {
        if (!order) return 'from-slate-500 to-slate-500';
        const hasActiveReturn = order.returns && order.returns.length > 0;
        if (order.status === 'REFUNDED') return 'from-orange-500 to-orange-500';
        if (order.status === 'CANCELLED') return 'from-slate-500 to-slate-500';
        if (['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED'].includes(order.status) || (order.status === 'IN_TRANSIT' && hasActiveReturn)) return 'from-amber-500 to-amber-500';
        return 'from-green-500 to-green-500';
    };

    const getTextColor = () => {
        if (!order) return 'text-slate-600';
        const hasActiveReturn = order.returns && order.returns.length > 0;
        if (order.status === 'REFUNDED') return 'text-orange-600';
        if (order.status === 'CANCELLED') return 'text-slate-600';
        if (['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED'].includes(order.status) || (order.status === 'IN_TRANSIT' && hasActiveReturn)) return 'text-amber-600';
        return 'text-green-600';
    };

    return (
        <div className={`bg-gradient-to-r ${getHeaderColor()} text-white p-2 md:p-6 rounded-xl mb-6 shadow-lg`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-lg md:text-xl font-bold mb-1">
                        Order #<BudolPayText text={order?.id ? order.id : '---'} />
                    </h1>
                    {order?.shipping?.bookingId && order.shipping.bookingId !== 'PENDING' ? (
                        <div className="space-y-1">
                            <p className="font-medium text-sm">
                                Tracking ID: <BudolPayText text={order.shipping.bookingId} />
                            </p>
                            <p className="text-xs opacity-90 bg-white/20 w-fit px-2 py-0.5 rounded">
                                Status: {getShippingStatusDisplay()}
                            </p>
                        </div>
                    ) : (
                        order.shipping?.provider === 'lalamove' && (
                            <p className="font-medium text-sm mb-1">
                                Lalamove Status: {getShippingStatusDisplay()}
                            </p>
                        )
                    )}
                    <p className="opacity-90 text-xs md:text-sm">
                        Placed on {order?.createdAt ? formatManilaTime(order.createdAt) : '---'}
                    </p>
                </div>

                <div className={`bg-white ${getTextColor()} px-4 py-2 rounded-lg shadow-md`}>
                    <div className="text-[10px] md:text-xs opacity-80 mb-0.5">Estimated Delivery</div>
                    <div className="text-lg md:text-xl font-bold">
                        {getEstimatedDelivery()}
                    </div>
                </div>
            </div>
        </div >
    );
}
