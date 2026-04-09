'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Key, ShieldAlert, ShieldCheck, Loader2, CircleCheck, CircleAlert } from 'lucide-react';

/**
 * Normalizes Philippine phone numbers to E.164 format (+63...)
 */
const normalizePhone = (phone: string) => {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 11) {
        return '+63' + digits.substring(1);
    }
    if (digits.startsWith('63') && digits.length === 12) {
        return '+' + digits;
    }
    if (digits.length === 10) {
        return '+63' + digits;
    }
    return phone; // Return original if it doesn't match known patterns
};

const normalizePhoneStrict = (phone: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 11) return `+63${digits.substring(1)}`;
    if (digits.startsWith('63') && digits.length === 12) return `+${digits}`;
    if (digits.startsWith('9') && digits.length === 10) return `+63${digits}`;
    return '';
};

const isValidPhone = (phone: string) => /^\+639\d{9}$/.test(phone);

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: any;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: '',
        department: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [deliveryInfo, setDeliveryInfo] = useState<{ target: string, method: string } | null>(null);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);
    const [phoneCheckState, setPhoneCheckState] = useState<'idle' | 'checking' | 'ok' | 'exists' | 'invalid' | 'error'>('idle');
    const [phoneCheckMessage, setPhoneCheckMessage] = useState('');

    useEffect(() => {
        const fetchMe = async () => {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data.user);
            }
        };
        fetchMe();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                role: user.role || 'STAFF',
                department: user.department || '',
            });
            setTempPassword(null);
            setDeliveryInfo(null);
            setPhoneCheckState('idle');
            setPhoneCheckMessage('');
        }
    }, [user]);

    useEffect(() => {
        if (!isOpen || !user) return;

        const raw = formData.phoneNumber || '';
        if (!raw.trim()) {
            setPhoneCheckState('invalid');
            setPhoneCheckMessage('Phone number is required.');
            return;
        }

        const normalized = normalizePhoneStrict(raw);
        if (!normalized || !isValidPhone(normalized)) {
            setPhoneCheckState('invalid');
            setPhoneCheckMessage('Use Philippine mobile format: 09XXXXXXXXX or +639XXXXXXXXX.');
            return;
        }

        const originalNormalized = normalizePhoneStrict(user.phoneNumber || '');
        if (originalNormalized && normalized === originalNormalized) {
            setPhoneCheckState('ok');
            setPhoneCheckMessage('Current phone format is valid.');
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setPhoneCheckState('checking');
                setPhoneCheckMessage('Checking database in realtime...');
                const params = new URLSearchParams({
                    phone: normalized,
                    scope: 'LOCAL',
                    excludeUserId: user.id
                });
                const response = await fetch(`/api/auth/check-phone?${params.toString()}`, {
                    signal: controller.signal
                });
                if (!response.ok) {
                    setPhoneCheckState('error');
                    setPhoneCheckMessage('Realtime check failed. Try again.');
                    return;
                }
                const data = await response.json();
                if (data.exists) {
                    setPhoneCheckState('exists');
                    setPhoneCheckMessage('Phone number already exists in database.');
                    return;
                }
                setPhoneCheckState('ok');
                setPhoneCheckMessage('Phone number is valid and available.');
            } catch (error: any) {
                if (error?.name === 'AbortError') return;
                setPhoneCheckState('error');
                setPhoneCheckMessage('Realtime check failed. Try again.');
            }
        }, 450);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [formData.phoneNumber, isOpen, user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedPhone = normalizePhoneStrict(formData.phoneNumber);
        if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
            alert('Invalid phone format. Use 09XXXXXXXXX or +639XXXXXXXXX.');
            return;
        }
        if (phoneCheckState === 'checking') {
            alert('Please wait for realtime phone validation to complete.');
            return;
        }
        if (phoneCheckState === 'exists') {
            alert('Phone number already exists in database. Use a different number.');
            return;
        }
        setIsSubmitting(true);
        setPendingMessage(null);
        try {
            const adminRes = await fetch('/api/auth/me');
            const adminData = await adminRes.json();

            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_PROFILE',
                    userId: user.id,
                    adminId: adminData.user.id,
                    ...formData,
                    phoneNumber: normalizedPhone
                })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.isPending) {
                    setPendingMessage(data.message);
                    // Don't close immediately so user can see the status
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 3000);
                } else {
                    onSuccess();
                    onClose();
                }
            } else {
                alert(data.error || "Update failed");
            }
        } catch (error) {
            console.error("Update failed:", error);
            alert("A system error occurred. Please check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!confirm('Are you sure you want to reset this user\'s password? They will be forced to use a temporary password.')) return;

        setIsResetting(true);
        try {
            const adminRes = await fetch('/api/auth/me');
            const adminData = await adminRes.json();

            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'RESET_PASSWORD',
                    userId: user.id,
                    adminId: adminData.user.id,
                })
            });

            if (res.ok) {
                const data = await res.json();
                setTempPassword(data.tempPassword);
                setDeliveryInfo({ target: data.deliveredTo, method: data.method });
            }
        } catch (error) {
            console.error("Reset failed:", error);
        } finally {
            setIsResetting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('WARNING: Deactivating this user will revoke all access. This action is logged for compliance. Proceed?')) return;

        setIsDeleting(true);
        try {
            const adminRes = await fetch('/api/auth/me');
            const adminData = await adminRes.json();

            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_USER',
                    userId: user.id,
                    adminId: adminData.user.id,
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Deactivation failed:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800">Edit User Profile</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Compliance-Controlled Environment</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">First Name</label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Last Name</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                        <input
                            type="text"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/[^\d+]/g, '') })}
                            onBlur={(e) => setFormData({ ...formData, phoneNumber: normalizePhone(e.target.value) })}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none ${
                                phoneCheckState === 'invalid' || phoneCheckState === 'exists' || phoneCheckState === 'error'
                                    ? 'border-red-400'
                                    : phoneCheckState === 'ok'
                                        ? 'border-emerald-300'
                                        : 'border-slate-200'
                            }`}
                            placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                        />
                        <div className="h-5 flex items-center gap-1.5">
                            {phoneCheckState === 'checking' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
                            {phoneCheckState === 'ok' && <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />}
                            {(phoneCheckState === 'invalid' || phoneCheckState === 'exists' || phoneCheckState === 'error') && (
                                <CircleAlert className="w-3.5 h-3.5 text-red-500" />
                            )}
                            <p
                                className={`text-[10px] font-bold ${
                                    phoneCheckState === 'ok'
                                        ? 'text-emerald-600'
                                        : phoneCheckState === 'checking'
                                            ? 'text-blue-600'
                                            : (phoneCheckState === 'invalid' || phoneCheckState === 'exists' || phoneCheckState === 'error')
                                                ? 'text-red-600'
                                                : 'text-slate-400'
                                }`}
                            >
                                {phoneCheckMessage || 'Realtime phone validation is ready.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="STAFF">STAFF</option>
                                <option value="USER">USER</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                                placeholder="Operations, Finance, etc."
                            />
                        </div>
                    </div>

                    {pendingMessage && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-blue-800 uppercase tracking-tight">Maker-Checker Phase 1 Complete</p>
                                    <p className="text-[10px] text-blue-600">{pendingMessage}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <div className="h-1 flex-1 bg-blue-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-1/2 animate-[shimmer_2s_infinite]"></div>
                                </div>
                                <span className="text-[9px] font-bold text-blue-500 uppercase">Awaiting Checker...</span>
                            </div>
                        </div>
                    )}

                    {tempPassword && (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-3">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Banking-Grade Reset Successful</p>
                                    <p className="text-[10px] text-emerald-600">The system has securely generated and delivered a temporary credential to the user.</p>
                                </div>
                            </div>

                            <div className="bg-white/50 p-3 rounded-lg border border-emerald-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Delivery Target ({deliveryInfo?.method})</p>
                                    <p className="text-xs font-mono font-bold text-slate-700">{deliveryInfo?.target}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Status</p>
                                    <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 justify-end">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        SENT
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-emerald-100">
                                <p className="text-[9px] font-bold text-emerald-700 uppercase mb-1">Developer Debug (Sandbox Only):</p>
                                <p className="text-lg font-mono font-bold text-slate-900 select-all tracking-wider">{tempPassword}</p>
                                <p className="text-[8px] text-slate-400 italic">In production, this clear-text password is never exposed to the Administrative Interface.</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting || phoneCheckState === 'checking' || phoneCheckState === 'exists' || phoneCheckState === 'invalid' || phoneCheckState === 'error'}
                            className="w-full bg-budolshap-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Saving Changes...' : 'Update Profile'}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={isResetting || currentUser?.id === user.id}
                                className="bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title={currentUser?.id === user.id ? "Compliance: You cannot reset your own password via the Admin Dashboard." : ""}
                            >
                                <Key className="w-4 h-4" />
                                Reset Password
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting || currentUser?.id === user.id}
                                className="bg-red-50 text-red-600 border border-red-100 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title={currentUser?.id === user.id ? "Compliance: You cannot deactivate your own account." : ""}
                            >
                                <Trash2 className="w-4 h-4" />
                                Deactivate User
                            </button>
                        </div>
                        {currentUser?.id === user.id && (
                            <p className="text-[9px] text-amber-600 font-bold uppercase text-center">
                                Security Restriction: Self-management of credentials is prohibited via administrative dashboard.
                            </p>
                        )}
                    </div>
                </form>

                <div className="px-6 py-4 bg-slate-900 text-white flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[9px] text-slate-400 font-medium">
                        Compliance Notice: All profile modifications are recorded in the forensic audit trail. Direct password viewing is prohibited by PCI DSS and BSP regulations.
                    </p>
                </div>
            </div>
        </div>
    );
}
