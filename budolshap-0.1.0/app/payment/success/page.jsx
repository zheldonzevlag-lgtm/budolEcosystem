'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Loading from '@/components/Loading'
import BudolPayText from '@/components/payment/BudolPayText'

function PaymentSuccessContent() {
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

    if (loading) return <Loading />

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="mb-6">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto animate-bounce" />
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-3">
                    Payment Successful!
                </h1>

                <p className="text-slate-600 mb-6">
                    Your GCash payment has been processed successfully.
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
                        {order.paymentId && (
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-600">Payment Ref:</span>
                                <span className="font-medium text-slate-800 text-xs break-all">
                                    {order.paymentId}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-slate-600">Status:</span>
                            <span className="font-medium text-green-600">
                                {order.isPaid ? 'Paid' : 'Processing'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/orders')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                        View My Orders
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>

                <p className="text-xs text-slate-500 mt-6">
                    You will receive an email confirmation shortly.
                </p>
            </div>
        </div>
    )
}

export default function PaymentSuccess() {
    return (
        <Suspense fallback={<Loading />}>
            <PaymentSuccessContent />
        </Suspense>
    )
}
