'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ShieldAlert, Mail, Phone, Loader2, ArrowRight } from 'lucide-react';

interface OTPVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
    user: any;
}

export default function OTPVerificationModal({ isOpen, onClose, onVerified, user }: OTPVerificationModalProps) {
    const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const [actor, setActor] = useState<any>(null);

    useEffect(() => {
        const fetchActor = async () => {
            const res = await fetch('/api/auth/me');
            if (!res.ok) return;
            const data = await res.json();
            setActor(data.user || null);
        };
        if (isOpen) {
            fetchActor();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && user && cooldown === 0) {
            handleSendOTP();
        }
    }, [isOpen, user]);

    useEffect(() => {
        let timer: any;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleSendOTP = async () => {
        setIsSending(true);
        setError(null);
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SEND_EDIT_OTP',
                    userId: user.id,
                    adminId: actor?.id
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data._sandbox_debug_otp) {
                    console.log(`%c[SSO-MFA] Sandbox OTP: ${data._sandbox_debug_otp}`, 'color: #0052cc; font-weight: bold; font-size: 14px;');
                }
                setCooldown(60);
                // Clear inputs
                setOtpValue(['', '', '', '', '', '']);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to send OTP.");
            }
        } catch (err) {
            setError("Connectivity error. Try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleInput = (index: number, value: string) => {
        if (value.length > 1) value = value[value.length - 1]; // Only last digit
        if (!/^\d*$/.test(value)) return; // Only digits

        const newOtp = [...otpValue];
        newOtp[index] = value;
        setOtpValue(newOtp);

        // Auto focus next
        if (value && index < 5) {
            const next = document.getElementById(`otp-${index + 1}`);
            next?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
            const prev = document.getElementById(`otp-${index - 1}`);
            prev?.focus();
        }
    };

    const handleVerify = async () => {
        const fullOtp = otpValue.join('');
        if (fullOtp.length !== 6) return;

        setIsVerifying(true);
        setError(null);
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'VERIFY_EDIT_OTP',
                    userId: user.id,
                    otp: fullOtp,
                    adminId: actor?.id
                })
            });
            if (res.ok) {
                onVerified(); // Trigger the EditUserModal
            } else {
                const data = await res.json();
                setError(data.error || "Verification failed. Check code.");
            }
        } catch (err) {
            setError("Server unreachable.");
        } finally {
            setIsVerifying(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="bg-budolshap-primary/10 p-1.5 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-budolshap-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Security Authorization</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multi-Factor Enforcement (v2.4)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-slate-500">To authorize this administrative action, an OTP has been sent to:</p>
                        <div className="flex justify-center gap-4 py-2">
                            <div className="bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-2 border border-indigo-100">
                                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-[11px] font-mono font-bold text-indigo-700">{user.email.replace(/^(.)(.*)(.@.*)$/, "$1***$3")}</span>
                            </div>
                            <div className="bg-budolshap-primary/5 px-3 py-1.5 rounded-full flex items-center gap-2 border border-budolshap-primary/10">
                                <Phone className="w-3.5 h-3.5 text-budolshap-primary" />
                                <span className="text-[11px] font-mono font-bold text-budolshap-primary">{user.phoneNumber.replace(/^(\+\d{2})(\d+)(\d{4})$/, "$1***$3")}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-2">
                        {otpValue.map((digit, i) => (
                            <input
                                key={i}
                                id={`otp-${i}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleInput(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                disabled={isVerifying}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:border-budolshap-primary focus:ring-1 focus:ring-budolshap-primary outline-none transition disabled:bg-slate-50"
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-start gap-2 border border-red-100 animate-in slide-in-from-top-2">
                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            onClick={handleVerify}
                            disabled={isVerifying || otpValue.some(d => !d)}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isVerifying ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Verify & Continue
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={handleSendOTP}
                            disabled={isSending || cooldown > 0}
                            className="text-[11px] text-slate-400 font-bold uppercase tracking-wider hover:text-budolshap-primary transition disabled:opacity-50"
                        >
                            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive code? Resend"}
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-900 text-white flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-[9px] text-slate-400 font-medium">
                        Identity Verification Required: This action triggers a forensic audit entry. All modification attempts are scrutinized under BSP Circular 808.
                    </p>
                </div>
            </div>
        </div>
    );
}
