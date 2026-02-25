'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle } from 'lucide-react'
import Loading from '@/components/Loading'
import BudolPayText from '@/components/payment/BudolPayText'

function PaymentFailedContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const orderId = searchParams.get('orderId')
    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState(null)

    useEffect(() => {
        if (orderId) {
            // Fetch order details
            fetch(`/api/orders/${orderId}`)
                .then(res => res.json())
                .then(data => {
                    setOrder(data)
                    setLoading(false)
                })
                .catch(error => {
                    console.error('Error fetching order:', error)
                    setLoading(false)
                })
        } else {
            setLoading(false)
        }
    }, [orderId])

    const retryPayment = async () => {
        if (!order) return

        setLoading(true)
        try {
            const response = await fetch('/api/payment/gcash/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    userId: order.userId
                })
            })

            const data = await response.json()
            if (data.checkoutUrl) {
                window.location.replace(data.checkoutUrl)
            }
        } catch (error) {
            console.error('Error retrying payment:', error)
            setLoading(false)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="mb-6">
                    <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-3">
                    Payment Failed
                </h1>

                <p className="text-slate-600 mb-6">
                    Your GCash payment could not be processed. Please try again.
                </p>

                {order && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-600">Order ID:</span>
                            <span className="font-medium text-slate-800"><BudolPayText text={order.id} /></span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-600">Amount:</span>
                            <span className="font-medium text-slate-800">
                                ₱{order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Status:</span>
                            <span className="font-medium text-red-600">Payment Failed</span>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={retryPayment}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                        Retry Payment
                    </button>

                    <button
                        onClick={() => router.push('/orders')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                        View My Orders
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                        Back to Home
                    </button>
                </div>

                <p className="text-xs text-slate-500 mt-6">
                    If you continue to experience issues, please contact support.
                </p>
            </div>
        </div>
    )
}

export default function PaymentFailed() {
    return (
        <Suspense fallback={<Loading />}>
            <PaymentFailedContent />
        </Suspense>
    )
}
