'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Key, ShieldAlert, ShieldCheck } from 'lucide-react';

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
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [deliveryInfo, setDeliveryInfo] = useState<{ target: string, method: string } | null>(null);

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
        }
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
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
                    ...formData
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Update failed:", error);
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
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Last Name</label>
                            <input 
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                        <input 
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                        <input 
                            type="text"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                            <select 
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
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
                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-budolshap-primary outline-none"
                                placeholder="Operations, Finance, etc."
                            />
                        </div>
                    </div>

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
                            disabled={isSubmitting}
                            className="w-full bg-budolshap-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Saving Changes...' : 'Update Profile'}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={handleResetPassword}
                                disabled={isResetting}
                                className="bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition"
                            >
                                <Key className="w-4 h-4" />
                                Reset Password
                            </button>
                            <button 
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-red-50 text-red-600 border border-red-100 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition"
                            >
                                <Trash2 className="w-4 h-4" />
                                Deactivate User
                            </button>
                        </div>
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
