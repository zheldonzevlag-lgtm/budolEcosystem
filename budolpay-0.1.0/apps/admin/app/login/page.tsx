'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Loader2, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
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

            // Redirect to dashboard on success
            router.push('/');
            router.refresh(); 

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
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

                    <form onSubmit={handleLogin} className="space-y-4">
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

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500">Or continue with</span>
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