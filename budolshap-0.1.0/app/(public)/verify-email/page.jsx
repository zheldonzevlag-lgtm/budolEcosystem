'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Loading from '@/components/Loading'

function VerifyEmailPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState('idle') // Changed from 'verifying'
    const [message, setMessage] = useState('')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const token = searchParams.get('token')

        if (token) {
            setStatus('verifying')
            verifyEmailToken(token)
        } else {
            setStatus('manual')
        }
    }, [searchParams])

    const verifyEmailToken = async (token) => {
        try {
            const url = new URL('/api/auth/verify-email', window.location.origin)
            url.searchParams.set('token', token)
            const response = await fetch(url.toString())
            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage('Email verified successfully! You can now login.')
                toast.success('Email verified successfully!')
                setTimeout(() => {
                    router.push('/')
                }, 2000)
            } else {
                setStatus('error')
                setMessage(data.error || 'Verification failed')
                toast.error(data.error || 'Verification failed')
            }
        } catch (error) {
            setStatus('error')
            setMessage('An error occurred during verification')
            toast.error('Verification failed')
        }
    }

    const handleOtpVerify = async (e) => {
        e.preventDefault()
        if (!email || !otp) {
            toast.error('Please enter both email and verification code')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            })

            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage('Account verified successfully! You can now login.')
                toast.success('Verification successful!')
                setTimeout(() => {
                    router.push('/')
                }, 2000)
            } else {
                toast.error(data.error || 'Verification failed')
            }
        } catch (error) {
            console.error('OTP verification error:', error)
            toast.error('An error occurred. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (status === 'verifying') {
        return <Loading />
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
            <div className="max-w-md w-full">
                {status === 'success' ? (
                    <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-10 text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">✓</div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verified!</h1>
                        <p className="text-slate-600 mb-6">{message}</p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full animate-[progress_2s_ease-in-out]"></div>
                        </div>
                    </div>
                ) : status === 'manual' ? (
                    <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-slate-900">Verify Your Account</h1>
                            <p className="text-slate-500 text-sm mt-2">Enter the code sent to your email and phone</p>
                        </div>
                        
                        <form onSubmit={handleOtpVerify} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Verification Code (OTP)</label>
                                <input 
                                    type="text" 
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="123456"
                                    maxLength={6}
                                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-center text-2xl tracking-[0.5em] font-bold"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : 'Verify Account'}
                            </button>
                        </form>
                        
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <button 
                                onClick={() => router.push('/')}
                                className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-10 text-center">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">✗</div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                        <p className="text-slate-600 mb-8">{message}</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setStatus('manual')}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
                            >
                                Try Manual Entry
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                            >
                                Go to Home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <VerifyEmailPageContent />
        </Suspense>
    )
}

