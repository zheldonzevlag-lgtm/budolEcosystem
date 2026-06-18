"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  MoreHorizontal,
  User,
  Clock,
  ExternalLink,
  ShieldCheck,
  Flag
} from "lucide-react";
import { realtime } from "@/lib/realtime";

interface ComplianceFlag {
  rule: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

interface ComplianceAlert {
  id: string;
  action: string;
  createdAt: string;
  newValue: {
    flags: ComplianceFlag[];
    transactionId: string;
    referenceId: string;
    riskScore?: number;
    riskMetadata?: any;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      kycTier: string;
    };
  };
}

export default function ComplianceBoard() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<'MANAGER' | 'GENERAL_MANAGER' | 'USER' | 'ADMIN'>('MANAGER');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch("/api/security?filter=Compliance");
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        }
      } catch (err) {
        console.error("Failed to fetch compliance alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    const unsubscribe = realtime.on("COMPLIANCE_ALERT", (newAlert: ComplianceAlert) => {
      console.log("[ComplianceBoard] Real-time alert received:", newAlert);
      setAlerts(prev => [newAlert, ...prev].slice(0, 50));
    });

    return () => unsubscribe();
  }, []);

  const handleResolve = async (transactionId: string, action: 'APPROVE' | 'REJECT') => {
    const reason = prompt(`Institutional Review: Provide reason for ${activeRole} resolution:`);
    if (!reason) return;

    try {
      const res = await fetch("/api/transactions/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          action,
          reason,
          adminId: "ADMIN-001", // Simulated User context
          adminRole: activeRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'PROPOSED') {
          alert(`Resolution proposed by ${activeRole}. Awaiting General Manager authorization.`);
          // Refresh list to update riskMetadata locally
          setAlerts(prev => prev.map(a =>
            a.newValue.transactionId === transactionId
              ? { ...a, newValue: { ...a.newValue, riskMetadata: { ...a.newValue.riskMetadata, proposedAction: action } } }
              : a
          ));
        } else {
          alert(`Transaction successfully ${action === 'APPROVE' ? 'AUTHORIZED' : 'BLOCKED'} by General Manager.`);
          setAlerts(prev => prev.filter(a => a.newValue.transactionId !== transactionId));
        }
      } else {
        const data = await res.json();
        alert("Resolution failed: " + data.error);
      }
    } catch (err) {
      console.error("Resolution error:", err);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const searchLow = searchQuery.toLowerCase();
    const refId = (alert?.newValue?.referenceId || "").toLowerCase();
    const action = (alert?.action || "").toLowerCase();
    const email = (alert?.newValue?.user?.email || "").toLowerCase();
    
    return refId.includes(searchLow) || action.includes(searchLow) || email.includes(searchLow);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f43f5e] mr-3"></div>
        <span className="text-xs font-bold uppercase tracking-widest">Enforcing Compliance Shield...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-[#f43f5e]" />
            <h3 className="font-black text-[#0f172a] text-[16px] tracking-tight">Ecosystem Risk Intelligence</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">AI-Driven DRS Engine (v2.4.0) · BSP Circular 808</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f43f5e]/5 border border-[#f43f5e]/10 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#f43f5e]" />
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as any)}
              className="bg-transparent text-[9px] font-bold text-[#0f172a] uppercase outline-none"
            >
              <option value="MANAGER">Manager (Maker)</option>
              <option value="GENERAL_MANAGER">Gen. Manager (Checker)</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-[10px] border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-[#f43f5e]/20"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button className="p-2 hover:bg-slate-200/50 rounded-full transition-colors">
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-slate-50">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <ShieldCheck className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-xs font-bold tracking-widest uppercase">Ecosystem Integrity: 100%</p>
            <p className="text-[10px] opacity-70 mt-1">{searchQuery ? "No results match your search." : "No active compliance flags detected."}</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isHighRisk = (alert.newValue.riskScore || 0) >= 75;
            const isCritical = (alert.newValue.riskScore || 0) >= 90;
            const scoreColor = isCritical ? 'bg-[#f43f5e] text-white ring-4 ring-rose-100' : isHighRisk ? 'bg-amber-500 text-white ring-4 ring-amber-50' : 'bg-slate-100 text-slate-500 ring-4 ring-slate-50';
            const severityLabel = isCritical ? 'CRITICAL' : alert.newValue.riskMetadata?.severity;
            
            return (
            <div key={alert.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center relative group hover:z-50`}>
               {/* Left: Score Badge */}
               <div className="flex-shrink-0 w-16 flex flex-col items-center justify-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${scoreColor} ${isCritical ? 'animate-pulse' : ''} shadow-sm relative group/score cursor-help`}>
                    {alert.newValue.riskScore ? (
                      <span className="text-sm tracking-tighter">{alert.newValue.riskScore}</span>
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                    
                    {/* Layman Terms Tooltip */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-52 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 group-hover/score:opacity-100 group-hover/score:translate-x-1 pointer-events-none transition-all duration-200 z-[100]">
                      <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-slate-900 border-b border-l border-slate-700 transform rotate-45"></div>
                      <div className="relative z-10 text-left">
                        <span className="block font-black text-white text-[9px] uppercase tracking-widest border-b border-slate-700 pb-1 mb-1.5">Layman's Terms</span>
                        <p className="text-[10px] font-medium text-slate-300 leading-relaxed">
                          {(alert.newValue.riskScore || 0) >= 90 ? "🔴 Critical anomaly! This looks exactly like fraud or a severe policy breach. The transaction is blocked immediately." :
                           (alert.newValue.riskScore || 0) >= 75 ? "🟠 Highly suspicious! Something is very unusual, like a massive sudden transfer. Needs manual approval from management." :
                           (alert.newValue.riskScore || 0) >= 40 ? "🟡 Slightly unusual. Could be a new device or an uncharacteristic transfer, but it's not bad enough to block. We are monitoring it." : 
                           "🟢 Normal transaction. The AI hasn't detected any strange behavior."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[7.5px] font-black tracking-[0.15em] uppercase mt-2.5 text-center ${isCritical ? 'text-[#f43f5e]' : isHighRisk ? 'text-amber-500' : 'text-slate-400'}`}>
                    {severityLabel}
                  </span>
               </div>
               
               {/* Middle: Event & Rules */}
               <div className="flex-grow flex flex-col gap-1.5 min-w-0 py-1">
                 <div className="flex items-center gap-2">
                   <h4 className="font-black text-[#0f172a] text-[13px] uppercase tracking-tight truncate group-hover:text-[#f43f5e] transition-colors">
                     {alert.action.replace(/_/g, ' ')}
                   </h4>
                   <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                     {alert.newValue.referenceId}
                   </span>
                 </div>
                 
                 <div className="flex items-center gap-2.5 text-slate-500">
                   <div className="flex items-center gap-1.5">
                     <User size={11} className="text-slate-400" />
                     <span className="text-[10px] font-bold text-slate-600 truncate">
                        {alert.newValue.user ? `${alert.newValue.user.firstName} ${alert.newValue.user.lastName}` : "System Entity"}
                     </span>
                      {alert.newValue.user?.kycTier && (
                        <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded bg-slate-200/50 text-slate-500 tracking-wider uppercase">
                          {alert.newValue.user.kycTier}
                        </span>
                      )}
                   </div>
                   <span className="text-slate-300">•</span>
                   <div className="flex items-center gap-1 text-slate-400">
                     <Clock size={10} />
                     <span className="text-[9px] font-bold uppercase tracking-tighter">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                   </div>
                 </div>
                 
                 {/* Flag Chips */}
                 {alert.newValue.flags.length > 0 && (
                   <div className="flex flex-wrap gap-1.5 mt-1.5">
                     {alert.newValue.flags.map((flag, idx) => (
                       <div key={idx} className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-100 shadow-sm">
                         <Flag size={8} className="text-rose-400" />
                         <span className="text-[8px] font-black tracking-widest uppercase">{flag.rule}:</span>
                         <span className="text-[8.5px] font-medium truncate max-w-[250px]">{flag.message}</span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
               
               {/* Right: Actions */}
               <div className="flex-shrink-0 flex flex-col md:items-end gap-2 mt-4 md:mt-0 ml-auto">
                  <div className="flex items-center gap-2">
                    {isHighRisk && (
                      <>
                        {activeRole === 'MANAGER' && !alert.newValue.riskMetadata?.proposedAction && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleResolve(alert.newValue.transactionId, 'APPROVE')}
                              className="px-3 py-1.5 bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-500 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleResolve(alert.newValue.transactionId, 'REJECT')}
                              className="px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-800 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest shadow-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {(activeRole === 'GENERAL_MANAGER') && (
                          <button
                            onClick={() => handleResolve(alert.newValue.transactionId, alert.newValue.riskMetadata?.proposedAction || 'APPROVE')}
                            className={`px-3 py-1.5 text-white text-[9px] font-black rounded-lg transition-all uppercase tracking-widest shadow-sm ${alert.newValue.riskMetadata?.proposedAction ? 'bg-orange-500 hover:bg-orange-600 ring-4 ring-orange-500/20 animate-pulse' : 'bg-[#f43f5e] hover:bg-rose-600'}`}
                          >
                            {alert.newValue.riskMetadata?.proposedAction ? `Auth ${alert.newValue.riskMetadata.proposedAction}` : 'Clearance'}
                          </button>
                        )}
                      </>
                    )}
                    <button className="flex items-center justify-center p-2 text-slate-400 hover:text-[#f43f5e] hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 hover:border-rose-200 bg-white" title="View Forensic Audit">
                      <ExternalLink size={14} />
                    </button>
                  </div>
               </div>
            </div>
            );
          })
        )}
      </div>

      {/* Footer / Summary */}
      <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Anomaly Flux</span>
            <span className="text-[10px] font-black leading-tight">{alerts.filter(a => (a.newValue.riskScore || 0) > 75).length} High</span>
          </div>
          <div className="h-4 w-px bg-gray-600 mx-2"></div>
          <div className="flex flex-col relative group/ewma cursor-help">
            <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest">DRS Status</span>
            <span className="text-[10px] font-black text-blue-400 leading-tight tracking-tighter hover:text-blue-300 transition-colors">ACTIVE (EWMA)</span>
            
            {/* EWMA Tooltip */}
            <div className="absolute bottom-full left-0 mb-3 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 group-hover/ewma:opacity-100 group-hover/ewma:-translate-y-1 pointer-events-none transition-all duration-200 z-[100]">
              <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 transform rotate-45"></div>
              <div className="relative z-10">
                <span className="block font-black text-slate-200 text-[10px] uppercase tracking-widest border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
                  EWMA Algorithm
                  <span className="text-[7px] text-blue-400 bg-blue-400/10 px-1 py-0.5 rounded">AUTO-TUNING</span>
                </span>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                  <span className="text-white font-bold">Exponentially Weighted Moving Average.</span> This mathematical model allows the DRS Engine to prioritize <span className="text-blue-300 font-bold">recent</span> behaviors while still remembering historical baselines. It enables the AI to rapidly detect sudden fraud spikes without triggering false positives for gradual, normal changes in user spending.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Institutional Compliance</p>
          <p className="text-[9px] font-bold text-[#f43f5e]">AI-DRIVEN ANOMALY SHIELD v2.4.0</p>
        </div>
      </div>
    </div>
  );
}
