'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Loading from '@/components/Loading'

function ResetPasswordPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [token, setToken] = useState(null)

    useEffect(() => {
        const tokenParam = searchParams.get('token')
        if (!tokenParam) {
            toast.error('Invalid reset link')
            router.push('/forgot-password')
        } else {
            // Decode the token (it was URL encoded in the email)
            try {
                const decodedToken = decodeURIComponent(tokenParam)
                setToken(decodedToken)
            } catch (error) {
                // If decoding fails, try using the token as-is
                setToken(tokenParam)
            }
        }
    }, [searchParams, router])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Password reset successfully!')
                setTimeout(() => {
                    router.push('/')
                }, 2000)
            } else {
                toast.error(data.error || 'Failed to reset password')
            }
        } catch (error) {
            console.error('Reset password error:', error)
            toast.error('Failed to reset password')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return <Loading />
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md w-full">
                <h1 className="text-3xl font-semibold text-slate-800 mb-2">Reset Password</h1>
                <p className="text-slate-600 mb-6">
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New Password"
                        required
                        minLength={6}
                        className="p-2 px-4 outline-none border border-slate-200 rounded w-full"
                    />

                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        required
                        minLength={6}
                        className="p-2 px-4 outline-none border border-slate-200 rounded w-full"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-500 text-white py-2.5 rounded hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ResetPasswordPageContent />
        </Suspense>
    )
}

