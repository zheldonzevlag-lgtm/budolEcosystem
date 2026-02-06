'use client';

import React, { useState } from 'react';
import { Lock, LogOut, ShieldCheck, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SessionLockedProps {
  onUnlock: () => void;
  email?: string;
}

export default function SessionLocked({ onUnlock, email }: SessionLockedProps) {
  const router = useRouter();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/login');
    }
  };

  const handleUnlock = () => {
    setIsUnlocking(true);
    // Simulate a brief delay for "verification"
    setTimeout(() => {
      onUnlock();
      setIsUnlocking(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-300">
        <div className="bg-budolshap-primary p-8 flex flex-col items-center text-white relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-white/20 rounded-full">
            <ShieldCheck size={12} className="text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest">PCI DSS SECURE</span>
          </div>
          
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 text-budolshap-primary">
            <Lock size={40} fill="currentColor" />
          </div>
          
          <h2 className="text-2xl font-black tracking-tight">Session Locked</h2>
          <p className="text-white/70 text-sm font-medium mt-1">Due to inactivity</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
              {email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Active User</p>
              <p className="text-sm font-bold text-slate-700 truncate">{email || 'admin@budolpay.com'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="w-full py-4 bg-budolshap-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {isUnlocking ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Resume Session
                </>
              )}
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Switch Account
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Clock size={14} />
            <p className="text-[10px] font-bold uppercase tracking-wider">Locked at {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
