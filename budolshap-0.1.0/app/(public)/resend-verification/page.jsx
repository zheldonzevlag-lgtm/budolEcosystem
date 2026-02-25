'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

export default function ResendVerificationPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [verificationLink, setVerificationLink] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (response.ok) {
                setSent(true)
                if (data.verificationLink) {
                    // Development mode - show the link
                    setVerificationLink(data.verificationLink)
                    toast.success('Verification link generated! Check below or server console.')
                    console.log('Verification Link:', data.verificationLink)
                } else {
                    toast.success('Verification link sent to your email!')
                }
            } else {
                toast.error(data.error || data.message || 'Failed to send verification email')
            }
        } catch (error) {
            console.error('Resend verification error:', error)
            toast.error('Failed to send verification email')
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <div className="text-green-600 text-3xl">✓</div>
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-800 mb-2">Check Your Email</h1>
                    <p className="text-slate-600 mb-6">
                        If an account with that email exists and is unverified, a verification link has been sent.
                    </p>
                    {verificationLink && (
                        <div className="mb-6 p-4 bg-slate-50 rounded border border-slate-200 text-left">
                            <p className="text-sm text-slate-700 mb-2 font-semibold">Development Mode - Verification Link:</p>
                            <a
                                href={verificationLink}
                                className="text-xs text-indigo-600 break-all hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {verificationLink}
                            </a>
                        </div>
                    )}
                    <Link
                        href="/login"
                        className="bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-900 transition inline-block"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-12">
            <div className="w-full max-w-md">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8"
                >
                    <ArrowLeftIcon size={20} />
                    <span>Back to login</span>
                </Link>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold text-slate-800">Resend Verification</h2>
                        <p className="text-sm text-slate-500 mt-2">
                            Enter your email address and we'll send you a new verification link.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full p-3 px-4 outline-none border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-slate-800 text-white text-sm font-medium py-3 rounded-md hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Verification Link'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        <p>
                            Already verified?{' '}
                            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
