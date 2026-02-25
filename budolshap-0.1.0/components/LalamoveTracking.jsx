import { PhoneIcon, StarIcon, MapPinIcon } from 'lucide-react';
import { UNIVERSAL_STATUS, getStatusLabel } from '@/lib/shipping/statusMapper';

export default function LalamoveTracking({ order }) {
    // Only render for Lalamove orders
    if (order.shipping?.provider !== 'lalamove') return null;

    const { driverInfo: rawDriverInfo, shareLink } = order.shipping || {};

    // Legacy fallback: Some older orders might have info in .driver instead of .driverInfo
    const driverInfo = rawDriverInfo || order.shipping?.driver || null;

    // Check if driver is assigned
    const hasDriver = driverInfo && driverInfo.name;

    // Determine if this is a return based on order status
    const isReturn = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED', 'REFUNDED'].includes(order.status) ||
        (order.returns && order.returns.length > 0 && order.returns.some(r => r.status !== 'CANCELLED'));

    return (
        <div className="space-y-6 mb-6">
            {/* Live Map Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Live GPS Tracking
                    </h3>

                    {/* Status Badge - Universal Status Display */}
                    <div className={`text-xs sm:text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2 
                        ${['CANCELED', 'CANCELLED', 'EXPIRED', 'REJECTED'].includes(order.shipping?.status) ? 'bg-red-50 text-red-700' :
                            [UNIVERSAL_STATUS.DELIVERED, 'COMPLETED'].includes(order.status) ? 'bg-green-50 text-green-700' :
                                order.status === 'REFUNDED' ? 'bg-purple-50 text-purple-700' :
                                    isReturn ? 'bg-amber-50 text-amber-700' :
                                        'bg-blue-50 text-blue-700'}`}>

                        {/* Display Universal Status Labels using mapper for consistency */}
                        {['CANCELED', 'CANCELLED'].includes(order.shipping?.status) ? "❌ Delivery Canceled" :
                            order.shipping?.status === 'EXPIRED' ? "⚠️ Driver request expired" :
                                order.shipping?.status === 'REJECTED' ? "⚠️ Driver request rejected" :
                                    getStatusLabel(order.status, isReturn)}
                    </div>
                </div>

                <div className="relative h-[600px] bg-slate-100 w-full group">
                    {shareLink && (!(['DELIVERED', 'COMPLETED', 'REFUNDED', 'RECEIVED'].includes(order.status) || ['COMPLETED', 'DELIVERED'].includes(order.shipping?.status)) || isReturn) ? (
                        <>
                            {/* External Link Button */}
                            <div className="absolute top-3 right-3 z-[5]">
                                <a
                                    href={shareLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-lg shadow-md text-xs font-bold hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-2 border border-slate-200"
                                >
                                    <span>View Full Screen</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                </a>
                            </div>

                            <iframe
                                src={shareLink}
                                className="w-full h-full border-0"
                                allowFullScreen
                                title="Lalamove Tracking"
                            />
                        </>
                    ) : (['DELIVERED', 'COMPLETED', 'REFUNDED', 'RECEIVED'].includes(order.status) || ['COMPLETED', 'DELIVERED'].includes(order.shipping?.status)) && !isReturn ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center z-10">
                            <div className={`${order.status === 'REFUNDED' ? 'bg-orange-100' : 'bg-green-100'} p-6 rounded-full mb-4 shadow-lg`}>
                                <span className="text-6xl">{order.status === 'REFUNDED' ? '💰' : '🎁'}</span>
                            </div>
                            <h3 className={`text-3xl font-bold ${order.status === 'REFUNDED' ? 'text-orange-800' : 'text-green-800'} mb-2`}>
                                {order.status === 'REFUNDED' ? 'Order Refunded' : 'Order Delivered!'}
                            </h3>
                            <p className={`${order.status === 'REFUNDED' ? 'text-orange-700' : 'text-green-700'} font-medium text-center max-w-md px-4`}>
                                {order.status === 'REFUNDED'
                                    ? 'Your refund has been processed successfully.'
                                    : 'Your order has been successfully delivered.'}
                            </p>
                            {shareLink && (
                                <a
                                    href={shareLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-6 px-6 py-2 bg-white text-slate-700 rounded-lg shadow-md text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 border border-slate-200"
                                >
                                    <MapPinIcon size={16} />
                                    <span>View Delivery Route</span>
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                            <MapPinIcon size={48} className="mb-2 opacity-50" />
                            <p>Waiting for driver location...</p>
                            <p className="text-sm mt-2">Map will update once driver is assigned</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Driver Information Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Driver Information</h3>

                {hasDriver ? (
                    <div className="space-y-4">
                        {/* Driver Header */}
                        <div className="flex items-center gap-4">
                            {/* Driver Photo */}
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 border-2 border-slate-50 relative group-hover:border-indigo-100 transition-colors">
                                {driverInfo.photo && driverInfo.photo.trim() !== "" ? (
                                    <img
                                        src={driverInfo.photo}
                                        alt={driverInfo.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="absolute inset-0 flex items-center justify-center bg-slate-200 text-slate-500"
                                    style={{ display: (driverInfo.photo && driverInfo.photo.trim() !== "") ? 'none' : 'flex' }}
                                >
                                    <span className="text-3xl">👤</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-lg">{driverInfo.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    {driverInfo.rating && (
                                        <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full text-xs font-bold border border-yellow-100">
                                            <StarIcon size={12} fill="currentColor" />
                                            <span>{driverInfo.rating}</span>
                                            <span className="text-yellow-700/60 ml-0.5">rating</span>
                                        </div>
                                    )}
                                    {order.shipping?.location && (
                                        <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs font-bold border border-indigo-100 animate-pulse">
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                            <span>Live Location Active</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {driverInfo.phone && (
                                <a
                                    href={`tel:${driverInfo.phone}`}
                                    className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors flex-shrink-0"
                                    title="Call Driver"
                                >
                                    <PhoneIcon size={20} />
                                </a>
                            )}
                        </div>

                        {/* Driver Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                            {/* Phone Number */}
                            {driverInfo.phone && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <PhoneIcon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                                        <p className="text-sm font-semibold text-slate-800 truncate">{driverInfo.phone}</p>
                                    </div>
                                </div>
                            )}

                            {/* Vehicle Type */}
                            {driverInfo.vehicleType && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${driverInfo.vehicleType.toUpperCase().includes('MOTORCYCLE') ? 'bg-blue-100 text-blue-600' :
                                        driverInfo.vehicleType.toUpperCase().includes('TRUCK') ? 'bg-amber-100 text-amber-600' :
                                            'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        <span className="text-lg">
                                            {(() => {
                                                const type = driverInfo.vehicleType.toUpperCase();
                                                if (type.includes('MOTORCYCLE')) return '🏍️';
                                                if (type.includes('SEDAN') || type.includes('CAR')) return '🚗';
                                                if (type.includes('VAN')) return '🚐';
                                                if (type.includes('TRUCK')) return '🚛';
                                                if (type.includes('MPV') || type.includes('SUV')) return '🚙';
                                                return '📦';
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 font-medium">Vehicle Type</p>
                                        <p className="text-sm font-semibold text-slate-800 truncate">{driverInfo.vehicleType}</p>
                                    </div>
                                </div>
                            )}

                            {/* Plate Number */}
                            {driverInfo.plateNumber && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${driverInfo.vehicleType?.toUpperCase().includes('MOTORCYCLE') ? 'bg-blue-100 text-blue-600' :
                                        driverInfo.vehicleType?.toUpperCase().includes('TRUCK') ? 'bg-amber-100 text-amber-600' :
                                            'bg-purple-100 text-purple-600'
                                        }`}>
                                        <span className="text-lg">
                                            {(() => {
                                                const type = driverInfo.vehicleType?.toUpperCase() || '';
                                                if (type.includes('MOTORCYCLE')) return '🏍️';
                                                if (type.includes('SEDAN') || type.includes('CAR')) return '🚗';
                                                if (type.includes('VAN')) return '🚐';
                                                if (type.includes('TRUCK')) return '🚛';
                                                if (type.includes('MPV') || type.includes('SUV')) return '🚙';
                                                return '🚗';
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 font-medium">Plate Number</p>
                                        <p className="text-sm font-mono font-bold text-slate-800 truncate">{driverInfo.plateNumber}</p>
                                    </div>
                                </div>
                            )}

                            {/* Current Location */}
                            {order.shipping?.location && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group/loc hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100">
                                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <MapPinIcon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Current Location</p>
                                            {order.shipping.location.updatedAt && (
                                                <p className="text-[10px] text-slate-400">
                                                    {new Date(order.shipping.location.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {Number(order.shipping.location.lat).toFixed(4)}, {Number(order.shipping.location.lng).toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-2xl animate-pulse">
                            <span>👤</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-slate-700">Waiting for Driver Assignment</h4>
                            <p className="text-sm text-slate-500 mt-1">
                                A driver will be assigned shortly. You'll see their details here once confirmed.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
