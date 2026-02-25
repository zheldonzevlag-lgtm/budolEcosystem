'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { SHIPMENT_MODELS, SHIPPING_STATUS } from '@/lib/shipping/shippingContract'
import { formatManilaTime } from '@/lib/dateUtils'

export default function BudolShapShippingModal({ 
    order, 
    isOpen, 
    onClose, 
    onArrangeShipment, 
    onGenerateDocuments,
    slaDays = 3,
    isLoading = false 
}) {
    const [shipmentModel, setShipmentModel] = useState(SHIPMENT_MODELS.PICKUP)
    const [isGeneratingDocs, setIsGeneratingDocs] = useState(false)
    const [shipByDate, setShipByDate] = useState('')

    useEffect(() => {
        if (isOpen && order) {
            // Calculate ship-by date based on SLA
            const shipBy = new Date()
            shipBy.setDate(shipBy.getDate() + slaDays)
            setShipByDate(shipBy.toISOString().split('T')[0])
            
            // Pre-select shipment model if already set
            if (order.shipping?.shipmentModel) {
                setShipmentModel(order.shipping.shipmentModel)
            }
        }
    }, [isOpen, order, slaDays])

    const handleArrangeShipment = async () => {
        if (!shipmentModel) {
            toast.error('Please select a shipment model')
            return
        }

        try {
            await onArrangeShipment(order.id, shipmentModel)
            toast.success('BudolShap shipment arranged successfully!')
        } catch (error) {
            toast.error(`Failed to arrange BudolShap shipment: ${error.message}`)
        }
    }

    const handleGenerateDocuments = async () => {
        setIsGeneratingDocs(true)
        try {
            const documents = await onGenerateDocuments(order.id)
            toast.success('BudolShap documents generated successfully!')
            
            // Open waybill in new tab if available
            if (documents.waybillUrl) {
                window.open(documents.waybillUrl, '_blank')
            }
            
            // Open packing list in new tab if available
            if (documents.packingListUrl) {
                window.open(documents.packingListUrl, '_blank')
            }
        } catch (error) {
            toast.error(`Failed to generate BudolShap documents: ${error.message}`)
        } finally {
            setIsGeneratingDocs(false)
        }
    }

    if (!isOpen || !order) return null

    const canArrangeShipment = ['PAID', 'ORDER_PLACED', 'PROCESSING'].includes(order.status)
    const hasActiveShipment = order.shipping?.status === SHIPPING_STATUS.ARRANGED
    const needsDocuments = order.shipping?.documentsNeeded !== false

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 text-slate-700 text-sm backdrop-blur-xs z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Arrange BudolShap Shipment</h2>
                        <p className="text-sm text-slate-500">Order #{order.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Shipping Deadline Alert */}
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-200 rounded-full p-2">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-orange-800">Shipping Deadline</p>
                            <p className="text-sm text-orange-700">
                                Ship by <span className="font-semibold">{formatManilaTime(shipByDate, { dateStyle: 'medium' })}</span> 
                                ({slaDays} days from order date)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 1: Select Shipment Model */}
                <div className="mb-6">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">1</span>
                        Select Shipment Model
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                shipmentModel === SHIPMENT_MODELS.PICKUP 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={() => setShipmentModel(SHIPMENT_MODELS.PICKUP)}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-blue-100 rounded-full p-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">Pickup</p>
                                    <p className="text-xs text-slate-500">Courier picks up from your location</p>
                                </div>
                            </div>
                        </div>

                        <div 
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                shipmentModel === SHIPMENT_MODELS.DROPOFF 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={() => setShipmentModel(SHIPMENT_MODELS.DROPOFF)}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-green-100 rounded-full p-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">Drop-off</p>
                                    <p className="text-xs text-slate-500">Drop off at courier branch</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2: Generate Documents (if enabled) */}
                {needsDocuments && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">2</span>
                            Generate BudolShap Shipping Documents
                        </h3>
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-800">Waybill & Packing List</p>
                                    <p className="text-xs text-slate-500">Required for BudolShap package handover</p>
                                </div>
                                <button
                                    onClick={handleGenerateDocuments}
                                    disabled={isGeneratingDocs || !hasActiveShipment}
                                    className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isGeneratingDocs ? 'Generating...' : 'Generate Documents'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirm & Arrange */}
                <div className="mb-6">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{needsDocuments ? '3' : '2'}</span>
                        Confirm BudolShap Shipment
                    </h3>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-blue-800">Ready to arrange BudolShap shipment?</p>
                                <p className="text-xs text-blue-600">
                                    {shipmentModel === SHIPMENT_MODELS.PICKUP ? 'Courier will pick up from your location' : 'You will drop off at courier branch'}
                                </p>
                            </div>
                            <button
                                onClick={handleArrangeShipment}
                                disabled={isLoading || !canArrangeShipment || hasActiveShipment}
                                className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'Processing...' : hasActiveShipment ? 'BudolShap Shipment Arranged' : 'Arrange BudolShap Shipment'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Customer & Order Summary */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-3">Order Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-600">Customer:</p>
                            <p className="font-medium">{order.user?.name}</p>
                        </div>
                        <div>
                            <p className="text-slate-600">Total Amount:</p>
                            <p className="font-medium">₱{order.total?.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-slate-600">Payment Method:</p>
                            <p className="font-medium">{order.paymentMethod}</p>
                        </div>
                        <div>
                            <p className="text-slate-600">Items:</p>
                            <p className="font-medium">{order.orderItems?.length} product(s)</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}