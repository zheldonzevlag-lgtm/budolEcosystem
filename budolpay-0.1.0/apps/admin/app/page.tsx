import Link from 'next/link';
import { ShieldCheck, ArrowRight, Activity, Users, Wallet } from 'lucide-react';

export default function AdminHomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <div className="p-4 bg-blue-50 rounded-3xl mb-6 shadow-xl shadow-blue-100 ring-1 ring-blue-100">
        <ShieldCheck className="w-16 h-16 text-blue-600" />
      </div>
      
      <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
        BudolPay Admin Console
      </h1>
      
      <p className="text-slate-500 text-lg max-w-lg mb-12 font-medium">
        Welcome to the central command for BudolPay. Manage users, monitor transactions, and ensure system-wide security compliance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link 
          href="/admin/settings/forensic-audit-trails"
          className="group p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:bg-white hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Forensic Audit Trails</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Interrogate system logs and analyze security risks with immutable evidence tracking.
          </p>
        </Link>

        {/* Placeholder for other admin features */}
        <div className="p-6 bg-slate-50/50 border border-slate-100 border-dashed rounded-[2rem] text-left">
          <div className="mb-4 p-3 bg-white/50 rounded-2xl border border-slate-50 w-fit">
            <Users className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">User Management</h3>
          <p className="text-sm text-slate-300 italic">Coming soon: Advanced user controls and KYC processing.</p>
        </div>
      </div>
    </div>
  );
}
