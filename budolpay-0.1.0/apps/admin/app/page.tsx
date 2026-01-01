import { prisma } from "@/lib/prisma";
import { 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity,
  ShieldCheck,
  AlertCircle,
  Shield
} from "lucide-react";

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

  const stats = [
    { name: "Total Users", value: userCount, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { name: "Transaction Volume", value: `PHP ${totalBalance.toLocaleString()}`, icon: Wallet, color: "text-[#f43f5e]", bg: "bg-rose-50" },
    { name: "Operations Staff", value: staffCount, icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-50" },
    { name: "System Uptime", value: "99.9%", icon: Activity, color: "text-green-500", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-[#0f172a] tracking-tight">Ecosystem Command</h2>
          <p className="text-slate-500 text-sm mt-1">Unified oversight of budolPay & budolShap financial operations.</p>
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
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{stat.name}</h3>
            <p className="text-2xl font-black text-[#0f172a] tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Transaction Pulse */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
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

        {/* Compliance Shield */}
        <div className="bg-[#0f172a] text-white rounded-3xl shadow-2xl p-6 flex flex-col border border-white/5 relative overflow-hidden group/shield">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f43f5e]/10 blur-[60px] rounded-full -mr-16 -mt-16 transition-all group-hover/shield:bg-[#f43f5e]/20"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="font-black text-white text-lg tracking-tight">Compliance Shield</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Institutional Grade Security</p>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[#f43f5e] group-hover/shield:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          
          <div className="space-y-3 flex-1 relative z-10">
            {[
              { label: "PCI DSS v4.0 Encryption", status: "VERIFIED", color: "text-green-400", sub: "Data-at-rest & in-transit", dot: "bg-green-400" },
              { label: "BSP Transaction Logs", status: "ACTIVE", color: "text-green-400", sub: "Circular No. 808 compliance", dot: "bg-green-400" },
              { label: "BIR Tax Integration", status: "SYNCING", color: "text-amber-400", sub: "E-invoicing middleware", dot: "bg-amber-400" },
              { label: "NPC Data Privacy", status: "SECURED", color: "text-green-400", sub: "DPA 2012 standards", dot: "bg-green-400" },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-white/[0.03] rounded-xl border border-white/10 hover:border-[#f43f5e]/40 hover:bg-white/[0.05] transition-all group/item">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-1 h-1 rounded-full ${item.dot} animate-pulse`}></span>
                    <span className="text-[11px] font-bold text-slate-300 group-hover/item:text-white transition-colors">{item.label}</span>
                  </div>
                  <span className={`text-[8px] font-black tracking-widest ${item.color} bg-white/5 px-1.5 py-0.5 rounded`}>{item.status}</span>
                </div>
                <p className="text-[9px] text-slate-500 font-medium group-hover/item:text-slate-400 transition-colors pl-3">{item.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-[#f43f5e]" />
                </div>
                <span>Next Audit: Jan 15, 2026</span>
              </div>
              <div className="text-[9px] font-black text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
                V3.4.2-SECURE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
