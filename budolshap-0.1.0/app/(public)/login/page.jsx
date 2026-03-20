'use client'
import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import Loading from "@/components/Loading"
import AuthForm from "@/components/auth/AuthForm"

const LoginPageContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect')

    // Prevent usage of 0.0.0.0 which is a bind address, not a visitable address
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hostname === '0.0.0.0') {
            const newUrl = window.location.href.replace('0.0.0.0', 'localhost');
            window.location.replace(newUrl);
        }
    }, []);

    const handleLoginSuccess = (data) => {
        const user = data?.user
        const kycStatus = user?.kycStatus || user?.kyc_status || 'UNVERIFIED'
        const createdAt = user?.createdAt;
        const isNewUser = createdAt ? (new Date() - new Date(createdAt)) / (1000 * 60 * 60) < 24 : false;

        // If user is not fully verified AND is a new registered user (within 24h),
        // send them straight to profile with a KYC prompt modal.
        if (user && kycStatus !== 'VERIFIED' && isNewUser) {
            router.push('/profile?showKycPrompt=true')
            router.refresh()
            return
        }

        // Otherwise, redirect to original page or home
        if (redirect) {
            router.push(redirect)
        } else {
            router.push('/')
        }
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-12">
            <div className="w-full max-w-md">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8"
                >
                    <ArrowLeftIcon size={20} />
                    <span>Back to home</span>
                </Link>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold text-slate-800">Login</h2>
                        <p className="text-sm text-slate-500 mt-2">
                            Welcome back! Sign in to your account.
                        </p>
                    </div>

                    <AuthForm
                        mode="login"
                        onSuccess={handleLoginSuccess}
                        isModal={false}
                    />

                    <div className="mt-6 text-center text-sm text-slate-500">
                        <p className="mb-2">
                            Don't have an account?{' '}
                            <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                Sign Up
                            </Link>
                        </p>
                        <p>
                            Need to verify email?{' '}
                            <Link href="/resend-verification" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                Resend Link
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200">
                        <p className="text-xs text-center text-slate-500 mb-3">Access specific areas:</p>
                        <div className="flex flex-col gap-2">
                            <Link
                                href="/store/login"
                                className="text-sm text-center text-slate-600 hover:text-slate-800 font-medium"
                            >
                                Login as Store Owner →
                            </Link>
                            <Link
                                href="/admin/login"
                                className="text-sm text-center text-slate-600 hover:text-slate-800 font-medium"
                            >
                                Login as Admin →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const LoginPage = () => {
    return (
        <Suspense fallback={<Loading />}>
            <LoginPageContent />
        </Suspense>
    )
}

export default LoginPage

