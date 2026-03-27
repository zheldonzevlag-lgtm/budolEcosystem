'use client'
import { XIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthUI } from "@/context/AuthUIContext"
import AuthForm from "./auth/AuthForm"
import MathCaptcha from "./auth/MathCaptcha"

const LoginModal = () => {
    const router = useRouter()
    const { isLoginModalOpen, hideLogin, redirectPath, modalMode, loginMessage, loginType } = useAuthUI() // Added loginType
    const [isMounted, setIsMounted] = useState(false)

    const [isLogin, setIsLogin] = useState(true)
    const [isSuccess, setIsSuccess] = useState(false) // Added success state
    const [isCaptchaSolved, setIsCaptchaSolved] = useState(false) // CAPTCHA gatekeeper state

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (isLoginModalOpen) {
            setIsLogin(modalMode === 'login')
        }
    }, [isLoginModalOpen, modalMode])

    if (!isMounted || !isLoginModalOpen) return null

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-sm h-screen flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
                <div className="w-16 h-16 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    const handleClose = () => {
        // Reset to login mode for next time (optional, but good practice)
        setIsLogin(true)
        setIsSuccess(false) // Reset success state
        setIsCaptchaSolved(false) // Reset CAPTCHA state
        hideLogin()
    }

    const handleToggleMode = () => {
        setIsLogin(!isLogin)
        setIsCaptchaSolved(false) // Reset CAPTCHA when switching modes
    }

    const handleLoginSuccess = (data) => {
        // If data.type is close (e.g. from forgot password link), just close
        if (data && data.type === 'close') {
            handleClose()
            return
        }

        // If user is not fully verified AND is a new registered user (within 24h),
        // send them straight to profile with a KYC prompt modal.
        const user = data?.user
        const kycStatus = user?.kycStatus || user?.kyc_status || 'UNVERIFIED'
        const createdAt = user?.createdAt;
        const isNewUser = createdAt ? (new Date() - new Date(createdAt)) / (1000 * 60 * 60) < 24 : false;

        if (user && kycStatus !== 'VERIFIED' && isNewUser) {
            setIsSuccess(true)
            window.location.href = '/profile?showKycPrompt=true'
            return
        }

        // Standard login success (session restore, fully verified users, etc.)
        // hideLogin() // REMOVED: Don't hide immediately to prevent unauthorized flash

        setIsSuccess(true) // Show success loading state

        // Force full page reload to ensure all components re-fetch user data
        // This is critical for session timeout re-login to work properly
        setTimeout(() => {
            if (redirectPath) {
                window.location.href = redirectPath
            } else {
                window.location.reload()
            }
        }, 1000) // Increased delay slightly to let user see "Redirecting..."
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-white/60 backdrop-blur h-screen flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex flex-col gap-5 text-slate-700 w-full max-w-sm sm:max-w-md bg-white rounded-lg shadow-2xl p-6 sm:p-8 relative border border-slate-100 animate-[scaleIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto custom-scrollbar">
                <XIcon
                    size={24}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors z-10"
                    onClick={handleClose}
                />

                {loginMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-[-10px] animate-pulse">
                        <p className="font-medium flex items-center gap-2">
                            <span className="text-lg">⚠️</span> {loginMessage}
                        </p>
                    </div>
                )}

                <div>
                    <h2 className={`text-3xl font-bold ${loginType === 'session_expired' ? 'text-red-600' : 'text-slate-800'}`}>
                        {isLogin ? (loginType === 'session_expired' ? 'Session Expired' : 'Welcome Back') : 'Create Account'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                        {isLogin ? (loginType === 'session_expired' ? 'Please sign in again to continue working.' : 'Enter your details to access your account') : 'Join us to start shopping today'}
                    </p>
                </div>

                <div className="mt-2 text-slate-700">
                    {!isLogin && !isCaptchaSolved ? (
                        <MathCaptcha onSolve={() => setIsCaptchaSolved(true)} primaryColor="blue" />
                    ) : (
                        <AuthForm
                            mode={isLogin ? 'login' : 'register'}
                            onSuccess={handleLoginSuccess}
                            onToggleMode={() => setIsLogin(true)} // Switch to login after successful register
                            isModal={true}
                            submitLabel={loginType === 'session_expired' && "Restore Session"}
                        />
                    )}
                </div>

                <div className="text-center text-sm text-slate-500 border-t border-slate-100 pt-5">
                    {isLogin ? (
                        <p>
                            New here?{' '}
                            <button
                                onClick={handleToggleMode}
                                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                            >
                                Create an account
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button
                                onClick={handleToggleMode}
                                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                            >
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LoginModal
