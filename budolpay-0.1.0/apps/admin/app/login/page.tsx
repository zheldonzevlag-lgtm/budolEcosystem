'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import MathCaptcha from '@/components/MathCaptcha';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isResendingOtp, setIsResendingOtp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isCaptchaSolved, setIsCaptchaSolved] = useState(false);
    const [otpRequired, setOtpRequired] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [challenge, setChallenge] = useState<{ email?: string; phone?: string | null; expiresAt?: string | null } | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // Prevent usage of 0.0.0.0 which is a bind address, not a visitable address
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hostname === '0.0.0.0') {
            const newUrl = window.location.href.replace('0.0.0.0', window.location.hostname === '0.0.0.0' ? 'localhost' : window.location.hostname);
            window.location.replace(newUrl);
        }
    }, []);

    useEffect(() => {
        let timer: any;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    useEffect(() => {
        const initPendingChallenge = async () => {
            if (searchParams.get('otp') !== 'required') return;
            const res = await fetch('/api/auth/login/challenge', { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            if (data.otpRequired) {
                setOtpRequired(true);
                setChallenge(data.challenge || null);
                setIsCaptchaSolved(true);
                setCooldown(60);
            }
        };
        initPendingChallenge();
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.otpRequired) {
                setOtpRequired(true);
                setChallenge(data.challenge || null);
                setCooldown(60);
                return;
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifyingOtp(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp: otpCode })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'OTP verification failed');
            }
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleResendOtp = async () => {
        setIsResendingOtp(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login/resend-otp', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Resend failed');
            }
            setChallenge(data.challenge || null);
            setCooldown(60);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsResendingOtp(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-rose-500/10 p-4 rounded-full">
                            <Shield className="w-12 h-12 text-rose-500" />
                        </div>
                    </div>
                    
                    <h1 className="text-2xl font-black text-center text-slate-900 mb-2">
                        budol<span className="text-rose-500">Pay</span> Admin
                    </h1>
                    <p className="text-slate-500 text-center text-sm mb-8">
                        Enter your credentials to access the ecosystem.
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {!isCaptchaSolved ? (
                        <MathCaptcha onSolve={() => setIsCaptchaSolved(true)} />
                    ) : (
                        <>
                            {!otpRequired ? (
                                <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            required
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-900"
                                            placeholder="juan@budolpay.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                                        <div className="relative group">
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                required
                                                className="w-full p-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-900"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-semibold">
                                        OTP sent to {challenge?.email || 'your email'}{challenge?.phone ? ` and ${challenge.phone}` : ''}.
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">One-Time Password</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-900 tracking-[0.3em] text-center font-bold"
                                            placeholder="123456"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isVerifyingOtp || otpCode.length !== 6}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isVerifyingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP & Sign In'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={isResendingOtp || cooldown > 0}
                                        className="w-full border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-60"
                                    >
                                        {isResendingOtp ? 'Resending...' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                                    </button>
                                </form>
                            )}

                            {!otpRequired && (
                            <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-200"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-slate-500 font-bold">Secure Access Only</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={() => {
                                            const localIP = typeof window !== 'undefined' ? (window.location.hostname !== '0.0.0.0' ? window.location.hostname : 'localhost') : 'localhost';
                                            const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || `http://${localIP}:8000`;
                                            const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
                                            const redirectUri = `${appUrl}/api/auth/callback`;
                                            window.location.href = `${ssoUrl}/login?apiKey=bp_key_2025&redirect_uri=${encodeURIComponent(redirectUri)}`;
                                        }}
                                        className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-[10px] text-white font-bold">B</div>
                                        <span>Login with budolID</span>
                                    </button>
                                    <p className="text-[10px] text-slate-400 text-center mt-2 font-semibold">After SSO, OTP verification is still required before access is granted.</p>
                                </div>
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => {
                                            const localIP = typeof window !== 'undefined' ? (window.location.hostname !== '0.0.0.0' ? window.location.hostname : 'localhost') : 'localhost';
                                            const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || `http://${localIP}:8000`;
                                            window.location.href = `${ssoUrl}/register?apiKey=bp_key_2025`;
                                        }}
                                        className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        Don't have an account? Create Account
                                    </button>
                                </div>
                            </div>
                            )}
                        </>
                    )}
                </div>
                
                <div className="bg-slate-50 p-4 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            System Status: Operational
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
