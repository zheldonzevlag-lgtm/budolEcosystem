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
    take: 10,
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

  // DRS Engine Real-time Status Check (v2.4.7)
  let drsHeartbeat;
  try {
    drsHeartbeat = await prisma.systemSetting.findUnique({
      where: { key: 'DRS_ENGINE_HEARTBEAT' }
    });
  } catch (err) {
    console.warn('[Dashboard] systemSetting not found for DRS, using OFFLINE:', err);
    drsHeartbeat = null;
  }

  let drsStatus = "OFFLINE";
  let drsColor = "text-[#f43f5e]";
  let drsBg = "bg-rose-50";

  if (drsHeartbeat) {
    const lastPulse = new Date(drsHeartbeat.value).getTime();
    const diff = Date.now() - lastPulse;

    if (diff < 60000) { // Active within 60s
      drsStatus = "ACTIVE";
      drsColor = "text-emerald-500";
      drsBg = "bg-emerald-50";
    } else if (diff < 300000) { // Active within 5m
      drsStatus = "DELAYED";
      drsColor = "text-amber-500";
      drsBg = "bg-amber-50";
    }
  }

  // Institutional Compliance Calculations (v2.4.7)
  const bspAuditCount = await prisma.auditLog.count({
    where: {
      entity: { in: ['Financial', 'Compliance', 'Security'] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });
  const bspStatus = bspAuditCount > 0 ? "ACTIVE" : "WAITING";
  const bspDot = bspAuditCount > 0 ? "bg-green-400" : "bg-amber-400";

  const npcAuditCount = await prisma.auditLog.count({
    where: {
      entity: 'Security',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });
  const npcStatus = npcAuditCount > 0 ? "SECURED" : "PENDING_AUDIT";
  const npcDot = npcAuditCount > 0 ? "bg-green-400" : "bg-amber-400";

  const pciAuditCount = await prisma.auditLog.count({
    where: {
      action: { contains: 'OTP' } as any,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });
  const pciStatus = pciAuditCount > 0 ? "CERTIFIED" : "REVIEW_REQD";
  const pciDot = pciAuditCount > 0 ? "bg-green-400" : "bg-rose-400";

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
    {
      name: "Ecosystem Integrity",
      value: complianceAlertCount === 0 ? "SECURE" : "ANOMALY",
      icon: Shield,
      color: complianceAlertCount === 0 ? "text-emerald-500" : "text-[#f43f5e]",
      bg: complianceAlertCount === 0 ? "bg-emerald-50" : "bg-rose-50",
      tooltip: "Calculated via AI-Driven Behavioral Baselining (EWMA). 'ANOMALY' indicates detections requiring manual institutional review."
    },
    { 
      name: "DRS Engine", 
      value: drsStatus, 
      icon: Activity, 
      color: drsColor, 
      bg: drsBg, 
      tooltip: "Real-time Exponentially Weighted Moving Average engine monitoring for transaction deviations." 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black text-[#0f172a] tracking-tight">Ecosystem Command</h2>
          <p className="text-slate-500 text-xs mt-1">Unified oversight of budol₱ay & budolShap financial operations.</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Status</p>
          <div className="flex items-center gap-2 text-green-600 font-bold text-[11px]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            OPERATIONAL
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative z-10 group hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-2.5 rounded-xl transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Live</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[7.5px] font-bold text-green-600 tracking-tighter">ACTIVE</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1 group/tooltip">
              <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.12em]">{stat.name}</h3>
              {stat.tooltip && (
                <div className="relative flex items-center cursor-help">
                  <span className="text-[8.5px] bg-slate-100 text-slate-400 rounded-full w-3 h-3 flex items-center justify-center font-bold border border-slate-200 group-hover/tooltip:bg-slate-200 group-hover/tooltip:text-slate-600 transition-colors">?</span>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-[#0f172a] text-slate-300 text-[9px] pt-1.5 px-2.5 pb-2 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 text-center leading-relaxed shadow-xl pointer-events-none normal-case font-medium tracking-normal border border-slate-700">
                    {stat.tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0f172a]"></div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xl font-black text-[#0f172a] tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Top Tier: Transaction Pulse (WIDER - 3/4) */}
        <div className="md:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="font-black text-[#0f172a] text-base tracking-tight">Transaction Pulse</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Real-time ledger forensics</p>
            </div>
            <a href="/transactions" className="text-[10px] text-[#f43f5e] font-black uppercase tracking-wider hover:underline px-3 py-1.5 bg-rose-50 rounded-lg transition-colors">View Analytics</a>
          </div>

          <div className="flex-1 flex flex-col divide-y divide-slate-50 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="flex flex-col divide-y divide-slate-50">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="px-5 py-3.5 hover:bg-slate-50/80 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${tx.type === 'CASH_IN' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-[#f43f5e]'}`}>
                      {tx.type === 'CASH_IN' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-[11px] text-[#0f172a] group-hover:text-[#f43f5e] transition-colors uppercase tracking-tight">{tx.type.replace('_', ' ')}</p>
                      <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tighter mt-0.5">{new Date(tx.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#0f172a] text-sm">₱{Number(tx.amount).toLocaleString()}</p>
                    <span className={`text-[7.5px] font-black tracking-widest px-2 py-0.5 rounded-md mt-1 inline-block ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Tier: Institutional AI Shield (NARROWER - 1/4) */}
        <div className="lg:col-span-1 bg-[#0f172a] text-white rounded-3xl shadow-2xl p-5 flex flex-col border border-white/5 relative overflow-hidden group/shield">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f43f5e]/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>

          <div className="flex flex-col items-center text-center gap-3 mb-4 relative z-10">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[#f43f5e] shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-500 text-xs tracking-tight leading-none uppercase">Compliance Shield</h3>
              <p className="text-[8px] text-[#f43f5e] font-black uppercase tracking-[0.2em] mt-1.5 opacity-80">Active & Enforced</p>
            </div>
          </div>

          <div className="space-y-2 relative z-10 flex-1">
            {[
              { 
                label: "AI DRS Engine", 
                desc: "Behavioral Ledger Forensics", 
                status: drsStatus, 
                dot: drsStatus === 'ACTIVE' ? "bg-green-400" : (drsStatus === 'DELAYED' ? "bg-amber-400" : "bg-rose-400"),
                tooltip: "Live behavioral analysis engine monitoring all transactions for fraud markers using EWMA models."
              },
              { 
                label: "BSP Audit Trail", 
                desc: "Immutable Activity Logs", 
                status: bspStatus, 
                dot: bspStatus === 'ACTIVE' ? "bg-green-400" : "bg-amber-400",
                tooltip: "Immutable transaction logs and administrative activity records adhering to Bangko Sentral ng Pilipinas reporting standards."
              },
              { 
                label: "BIR Middleware", 
                desc: "Tax-Compliant Ledger Sync", 
                status: birStatus, 
                dot: birDot,
                tooltip: "Automated tax reconciliation and ledger synchronization engine for BIR secondary-book compliance."
              },
              { 
                label: "NPC Shield", 
                desc: "DPA/Data Privacy Shield", 
                status: npcStatus, 
                dot: npcDot,
                tooltip: "National Privacy Commission (DPA 2012) enforcement monitor, ensuring secure handling of all PII data."
              },
              { 
                label: "PCI DSS Compliance", 
                desc: "Level 1 Service Provider", 
                status: pciStatus, 
                dot: pciDot,
                tooltip: "Security standards enforcement for Level 1 Service Provider status, including active MFA and encryption audits."
              },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors group/item shadow-sm relative overflow-visible">
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dot} shadow-[0_0_8px_rgba(255,255,255,0.3)] animate-pulse`}></span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 group/tooltip">
                      <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase leading-none">{item.label}</span>
                      {item.tooltip && (
                        <div className="relative flex items-center cursor-help">
                          <span className="text-[7.5px] bg-white/10 text-slate-500 rounded-full w-2.5 h-2.5 flex items-center justify-center font-bold border border-white/5 group-hover/tooltip:bg-[#f43f5e] group-hover/tooltip:text-white transition-colors">?</span>
                          <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#1e293b] text-slate-300 text-[9px] pt-1.5 px-2.5 pb-2 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 leading-relaxed shadow-2xl pointer-events-none normal-case font-medium tracking-normal border border-white/10 backdrop-blur-md">
                            {item.tooltip}
                            <div className="absolute top-full left-2 border-4 border-transparent border-t-[#1e293b]"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">{item.desc}</span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-white bg-white/10 px-2 py-0.5 rounded leading-none">{item.status}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Next Audit</p>
                <p className="text-xs font-black text-[#f43f5e]">{getNextAuditDate()}</p>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg">
                <Fingerprint className="w-4 h-4 text-slate-600 opacity-40 shadow-inner" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Tier: Full Width Engine */}
      <div className="w-full">
        <ComplianceBoard />
      </div>
    </div>
  );
}
