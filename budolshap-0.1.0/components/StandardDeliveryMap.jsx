import { MapPinIcon } from 'lucide-react';

export default function StandardDeliveryMap({ order }) {
    // Only render for non-Lalamove orders (Standard/COD)
    if (order.shipping?.provider === 'lalamove') return null;

    const address = order.address;
    const fullAddress = `${address.street}, ${address.city}, ${address.state}, ${address.country}`;
    const encodedAddress = encodeURIComponent(fullAddress);

    return (
        <div className="space-y-6 mb-6">
            {/* Destination Map Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <MapPinIcon size={20} className="text-blue-600" />
                        Delivery Destination
                    </h3>
                    <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        Standard Shipping
                    </span>
                </div>

                <div className="relative h-[500px] bg-slate-100 w-full">
                    <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src={`https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        title="Delivery Destination Map"
                        className="w-full h-full border-0"
                    ></iframe>

                    {/* Overlay to prevent interaction if desired, or just styling */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                        <p className="font-semibold text-slate-800">Delivering to:</p>
                        <p className="text-slate-600 truncate">{fullAddress}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
