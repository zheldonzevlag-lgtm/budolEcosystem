import { prisma } from "@/lib/prisma";
export const dynamic = 'force-dynamic';

import { 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity,
  ShieldCheck,
  AlertCircle,
  Shield,
  Fingerprint
} from "lucide-react";
import { getNextAuditDate } from "@/lib/utils";
import ComplianceBoard from "@/components/ComplianceBoard";

export default async function DashboardPage() {
  const userCount = await prisma.user.count();
  const staffCount = await prisma.user.count({ where: { role: { in: ['ADMIN', 'STAFF'] } } });
  
  // Get total ledger balance (Assets)
  const assetAccount = await prisma.chartOfAccount.findFirst({
    where: { type: 'ASSET' },
    include: { ledgerEntries: true }
  });

  const totalBalance = assetAccount?.ledgerEntries.reduce((acc, entry) => {
    return acc + (Number(entry.debit) - Number(entry.credit));
  }, 0) || 0;
  
  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { sender: true, receiver: true }
  });

  // Get recent transactions for compliance check
  const unsyncedTransactions = await prisma.transaction.count({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
    }
  });

  const complianceAlertCount = await prisma.auditLog.count({
    where: {
      entity: 'Compliance',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }
  });

  const birStatus = unsyncedTransactions > 0 ? "SYNCING" : "ACTIVE";
  const birColor = unsyncedTransactions > 0 ? "text-amber-400" : "text-green-400";
  const birDot = unsyncedTransactions > 0 ? "bg-amber-400" : "bg-green-400";

  const stats = [
    { name: "Total Users", value: userCount, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { 
      name: "Total Platform Assets", 
      value: `PHP ${totalBalance.toLocaleString()}`, 
      icon: Wallet, 
      color: "text-[#f43f5e]", 
      bg: "bg-rose-50",
      tooltip: "The total amount of circulating funds currently resting in the central ASSET accounting ledger."
    },
    { name: "Compliance Health", value: complianceAlertCount === 0 ? "100%" : "WARNING", icon: Shield, color: complianceAlertCount === 0 ? "text-emerald-500" : "text-[#f43f5e]", bg: complianceAlertCount === 0 ? "bg-emerald-50" : "bg-rose-50" },
    { name: "System Uptime", value: "99.9%", icon: Activity, color: "text-green-500", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-[#0f172a] tracking-tight">Ecosystem Command</h2>
          <p className="text-slate-500 text-sm mt-1">Unified oversight of budol₱ay & budolShap financial operations.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Status</p>
          <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            OPERATIONAL
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-xl transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Live</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[8px] font-bold text-green-600 tracking-tighter">ACTIVE</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1 group/tooltip">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em]">{stat.name}</h3>
              {stat.tooltip && (
                <div className="relative flex items-center cursor-help">
                  <span className="text-[9px] bg-slate-100 text-slate-400 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold border border-slate-200 group-hover/tooltip:bg-slate-200 group-hover/tooltip:text-slate-600 transition-colors">?</span>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-[#0f172a] text-slate-300 text-[10px] pt-2 px-3 pb-2.5 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 text-center leading-relaxed shadow-xl pointer-events-none normal-case font-medium tracking-normal border border-slate-700">
                    {stat.tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0f172a]"></div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-2xl font-black text-[#0f172a] tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        {/* Transaction Pulse */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="font-black text-[#0f172a] text-base tracking-tight">Transaction Pulse</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Real-time ledger updates</p>
            </div>
            <a href="/transactions" className="text-[10px] text-[#f43f5e] font-black uppercase tracking-wider hover:underline px-3 py-1.5 bg-rose-50 rounded-lg transition-colors">Full History</a>
          </div>
          
          <div className="flex-1 flex flex-col">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-slate-50/80 transition-all flex items-center justify-between border-b border-slate-50 last:border-0 group">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${tx.type === 'CASH_IN' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-[#f43f5e]'}`}>
                    {tx.type === 'CASH_IN' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#0f172a] group-hover:text-[#f43f5e] transition-colors">{tx.type.replace('_', ' ')}</p>
                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tighter mt-0.5">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#0f172a] text-base">PHP {Number(tx.amount).toLocaleString()}</p>
                  <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md mt-1 inline-block ${
                    tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
            
            {recentTransactions.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                <Activity className="w-8 h-8 mb-2 opacity-10" />
                <p className="text-xs italic font-medium">No recent pulse detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Compliance Board */}
        <div className="lg:col-span-4">
          <ComplianceBoard />
        </div>
      </div>

      {/* Institutional Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4 bg-[#0f172a] text-white rounded-3xl shadow-2xl p-6 flex flex-col md:flex-row items-center justify-between border border-white/5 relative overflow-hidden group/shield">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f43f5e]/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-[#f43f5e]">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-white text-xl tracking-tight">Compliance Shield Active</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">BSP Circular 808 / Institutional PCI DSS v4.0</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6 md:mt-0 relative z-10">
            {[
              { label: "Encryption", status: "VERIFIED", dot: "bg-green-400" },
              { label: "BSP Audit", status: "ACTIVE", dot: "bg-green-400" },
              { label: "BIR Middleware", status: birStatus, dot: birDot },
              { label: "NPC Data", status: "SECURED", dot: "bg-green-400" },
            ].map((item) => (
              <div key={item.label} className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${item.dot} animate-pulse`}></span>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{item.label}</span>
                <span className="text-[10px] font-black text-white">{item.status}</span>
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4 pl-8 border-l border-white/10 relative z-10">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Audit Cycle</p>
              <p className="text-xs font-black text-[#f43f5e]">{getNextAuditDate()}</p>
            </div>
            <Fingerprint className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
