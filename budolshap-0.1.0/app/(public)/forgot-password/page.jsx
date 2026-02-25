'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [resetLink, setResetLink] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (response.ok) {
                setSent(true)
                if (data.resetLink) {
                    // Development mode - show the link
                    setResetLink(data.resetLink)
                    toast.success('Password reset link generated! Check below or server console.')
                    console.log('Password Reset Link:', data.resetLink)
                } else {
                    toast.success('Password reset link sent to your email!')
                }
            } else {
                const errorMsg = data.error || 'Failed to send reset email'
                const details = data.details ? `: ${data.details}` : ''
                const help = data.help ? `\n${data.help}` : ''
                toast.error(`${errorMsg}${details}${help}`, {
                    duration: 6000
                })
                
                // If it's a migration error, show additional help
                if (data.migrationFile) {
                    console.error('Migration required:', data.migrationFile)
                    console.error('Help:', data.help)
                }
            }
        } catch (error) {
            console.error('Forgot password error:', error)
            toast.error('Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="max-w-md w-full bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <div className="text-green-600 text-5xl mb-4">✓</div>
                    <h1 className="text-2xl font-semibold text-green-800 mb-2">Check Your Email</h1>
                    <p className="text-green-600 mb-6">
                        If an account with that email exists, a password reset link has been sent.
                    </p>
                    {resetLink && (
                        <div className="mb-6 p-4 bg-white rounded border border-green-300">
                            <p className="text-sm text-green-700 mb-2 font-semibold">Development Mode - Reset Link:</p>
                            <a 
                                href={resetLink}
                                className="text-xs text-blue-600 break-all hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {resetLink}
                            </a>
                        </div>
                    )}
                    <Link
                        href="/"
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition inline-block"
                    >
                        Go to Home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md w-full">
                <h1 className="text-3xl font-semibold text-slate-800 mb-2">Forgot Password</h1>
                <p className="text-slate-600 mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className="p-2 px-4 outline-none border border-slate-200 rounded w-full"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-500 text-white py-2.5 rounded hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
