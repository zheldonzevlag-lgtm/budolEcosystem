'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LogOut, 
  User, 
  ChevronUp, 
  ChevronDown, 
  Settings, 
  Globe, 
  MapPin,
  Server,
  Zap,
  MessageSquare,
  LayoutDashboard,
  Wallet,
  Users,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowLeftRight,
  AlertCircle
} from 'lucide-react';

interface UserData {
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.startsWith('/settings'));
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (pathname !== '/login') {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [pathname]);
  
  // Do not show sidebar on login page
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDisplayName = () => {
    if (!user) return 'Admin User';
    
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;
    
    // Fallback: derive from email if names are missing
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix
      .split(/[\._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const displayName = getDisplayName();
  const initial = displayName.charAt(0).toUpperCase();
  const email = user?.email || 'admin@budolpay.com';

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col fixed h-full z-50 border-r border-slate-800">
      {/* Logo Section */}
      <div className="p-6 mb-2">
        <h1 className="text-2xl font-black tracking-tighter flex items-center mb-0.5">
          <span className="text-slate-400">budol</span>
          <span className="text-[#f43f5e]">₱ay</span>
        </h1>
        <div className="flex items-center gap-1.5 opacity-80">
          <span className="w-1 h-1 rounded-full bg-[#f43f5e]"></span>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.1em]">Powered by</p>
          <p className="text-[11px] font-bold tracking-tight">
            <span className="text-slate-400 font-bold">budol</span>
            <span className="text-purple-600 text-[10px]">Ecosystem</span>
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-4 overflow-y-auto pt-2">
        <div>
          <p className="px-4 mb-2 text-[12px] font-bold text-slate-600 uppercase tracking-widest">Main Console</p>
          <div className="space-y-0.5">
            <NavItem href="/" label="Dashboard" active={pathname === '/'} icon={<LayoutDashboard className="w-3.5 h-3.5" />} />
            
            {/* Collapsible System Settings */}
            <div>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-full flex items-center justify-between px-4 py-1.5 text-[13px] font-medium transition-all rounded-md group ${
                  pathname.startsWith('/settings') 
                    ? 'text-white bg-white/5' 
                    : 'text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-1 h-1 rounded-full transition-all ${
                    pathname.startsWith('/settings') ? 'bg-[#f43f5e]' : 'bg-slate-700 group-hover:bg-slate-500'
                  }`}></span>
                  <div className="flex items-center gap-3">
                    <Settings className={`w-3.5 h-3.5 ${pathname.startsWith('/settings') ? 'text-[#f43f5e]' : 'text-slate-500 group-hover:text-slate-400'}`} />
                    <span>System Settings</span>
                  </div>
                </div>
                {isSettingsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 -rotate-90" />}
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSettingsOpen ? 'max-h-60 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
                <div className="pl-2 space-y-0.5 border-l border-slate-800 ml-3">
                  <NavItem 
                    href="/settings/environment" 
                    label="System Environment" 
                    active={pathname === '/settings/environment'} 
                    isSubItem
                    icon={<Server className="w-3 h-3" />}
                  />
                  <NavItem 
                    href="/settings/location" 
                    label="Map & Location" 
                    active={pathname === '/settings/location'} 
                    isSubItem
                    icon={<MapPin className="w-3 h-3" />}
                  />
                  <NavItem 
                    href="/settings/realtime" 
                    label="Realtime Updates" 
                    active={pathname === '/settings/realtime'} 
                    isSubItem
                    icon={<Zap className="w-3 h-3" />}
                  />
                  <NavItem 
                    href="/settings/notifications" 
                    label="Notification" 
                    active={pathname === '/settings/notifications'} 
                    isSubItem
                    icon={<MessageSquare className="w-3 h-3" />}
                  />
                  <NavItem 
                    href="/settings/security" 
                    label="Security Hardening" 
                    active={pathname === '/settings/security'} 
                    isSubItem
                    icon={<ShieldAlert className="w-3 h-3" />}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="px-4 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Backoffice Ops</p>
          <div className="space-y-0.5">
            <NavItem href="/accounting" label="Accounting & Ledger" active={pathname === '/accounting'} icon={<Wallet className="w-3.5 h-3.5" />} />
            <NavItem href="/employees" label="Employee Management" active={pathname === '/employees'} icon={<Users className="w-3.5 h-3.5" />} />
          </div>
        </div>

        <div>
          <p className="px-4 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Compliance & Trust</p>
          <div className="space-y-0.5">
            <NavItem href="/users" label="User Verification" active={pathname === '/users'} icon={<ShieldCheck className="w-3.5 h-3.5" />} />
            <NavItem href="/security" label="Security & Audit" active={pathname === '/security'} icon={<Lock className="w-3.5 h-3.5" />} />
            <NavItem href="/transactions" label="Global Transactions" active={pathname === '/transactions'} icon={<ArrowLeftRight className="w-3.5 h-3.5" />} />
            <NavItem href="/disputes" label="Disputes & Refunds" active={pathname === '/disputes'} icon={<AlertCircle className="w-3.5 h-3.5" />} />
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-800 bg-[#0f172a]/50 relative">
        {showLogout && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
        
        <div 
          onClick={() => !isLoading && setShowLogout(!showLogout)}
          className={`flex items-center gap-4 px-2 py-3 rounded-2xl transition-all group ${
            isLoading ? 'cursor-default' : 'cursor-pointer hover:bg-white/10'
          } ${showLogout ? 'bg-white/10' : 'bg-white/5'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#f43f5e] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#f43f5e]/20 group-hover:scale-105 transition-transform">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : initial}
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-2 w-24 bg-white/5 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-[12px] font-black text-white truncate">{displayName}</p>
                <p className="text-[10px] text-slate-500 font-bold truncate tracking-tight">{email}</p>
              </>
            )}
          </div>
          {!isLoading && <ChevronUp className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showLogout ? 'rotate-180' : ''}`} />}
        </div>
      </div>
    </aside>
  );
}

function NavItem({ 
  href, 
  label, 
  active, 
  icon, 
  isSubItem 
}: { 
  href: string; 
  label: string; 
  active: boolean; 
  icon?: React.ReactNode;
  isSubItem?: boolean;
}) {
  return (
    <a 
      href={href} 
      className={`flex items-center gap-3 px-4 py-1.5 text-[13px] font-medium transition-all rounded-md group ${
        active 
          ? 'text-white bg-white/5' 
          : 'text-white hover:bg-white/5'
      } ${isSubItem ? 'pl-6' : ''}`}
    >
      {!isSubItem && (
        <span className={`w-1 h-1 rounded-full transition-all ${
          active ? 'bg-[#f43f5e]' : 'bg-slate-700 group-hover:bg-slate-500'
        }`}></span>
      )}
      {icon && <span className={active ? 'text-[#f43f5e]' : 'text-slate-500 group-hover:text-slate-400'}>{icon}</span>}
      <span className={isSubItem ? 'text-[12px]' : ''}>{label}</span>
    </a>
  );
}
