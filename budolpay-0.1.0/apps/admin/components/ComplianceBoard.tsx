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
  entity: string;
  entityId: string;
  flags: ComplianceFlag[];
  transactionId: string;
  referenceId: string;
  riskScore?: number;
  riskMetadata?: any;
  metadata: {
    severity: 'HIGH' | 'MEDIUM' | 'CRITICAL';
    rulesTriggered: string[];
    aiWeightedScore?: number;
  };
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    kycTier: string;
  };
}

export default function ComplianceBoard() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<'MANAGER' | 'GENERAL_MANAGER' | 'USER'>('MANAGER');

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
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <ShieldCheck className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-xs font-bold tracking-widest uppercase">Ecosystem Integrity: 100%</p>
            <p className="text-[10px] opacity-70 mt-1">No active compliance flags detected.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-5 hover:bg-slate-50/80 transition-all group ${alert.metadata.severity === 'HIGH' ? 'bg-rose-50/30' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl relative ${alert.newValue.riskScore && alert.newValue.riskScore >= 90 ? 'bg-[#f43f5e] text-white animate-pulse' : (alert.newValue.riskScore && alert.newValue.riskScore >= 75 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600')}`}>
                    {alert.newValue.riskScore ? (
                      <span className="text-xs font-black">{alert.newValue.riskScore}</span>
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                    {alert.newValue.riskScore && <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border border-slate-200" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md ${alert.newValue.riskScore && alert.newValue.riskScore >= 90 ? 'bg-[#0f172a] text-[#f43f5e]' : (alert.metadata.severity === 'HIGH' ? 'bg-[#f43f5e] text-white' : 'bg-amber-500 text-white')}`}>
                        {alert.newValue.riskScore && alert.newValue.riskScore >= 90 ? 'CRITICAL ANOMALY' : `${alert.metadata.severity} RISK`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{alert.newValue.referenceId}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-[10px] mt-1 group-hover:text-[#f43f5e] transition-colors uppercase leading-tight">{alert.action.replace(/_/g, ' ')}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end text-slate-400 mb-1">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex gap-2">
                    {(alert.newValue.riskScore || 0) >= 75 && (
                      <>
                        {activeRole === 'MANAGER' && !alert.newValue.riskMetadata?.proposedAction && (
                          <>
                            <button
                              onClick={() => handleResolve(alert.newValue.transactionId, 'APPROVE')}
                              className="px-2.5 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 transition-colors uppercase"
                            >
                              Propose Approval
                            </button>
                            <button
                              onClick={() => handleResolve(alert.newValue.transactionId, 'REJECT')}
                              className="px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded-lg hover:bg-slate-900 transition-colors uppercase"
                            >
                              Propose Reject
                            </button>
                          </>
                        )}
                        {(activeRole === 'GENERAL_MANAGER' || activeRole === 'ADMIN') && (
                          <button
                            onClick={() => handleResolve(alert.newValue.transactionId, alert.newValue.riskMetadata?.proposedAction || 'APPROVE')}
                            className={`px-2.5 py-1.5 text-white text-[10px] font-black rounded-lg transition-colors uppercase ${alert.newValue.riskMetadata?.proposedAction ? 'bg-orange-600 hover:bg-orange-700 animate-pulse' : 'bg-[#f43f5e] hover:bg-rose-600'}`}
                          >
                            {alert.newValue.riskMetadata?.proposedAction ? `Authorize ${alert.newValue.riskMetadata.proposedAction}` : 'Institutional Clearance'}
                          </button>
                        )}
                      </>
                    )}
                    <button className="flex items-center gap-1.5 text-[10px] font-black text-[#f43f5e] hover:underline uppercase bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                      Forensic Audit <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Rules Triggered */}
              <div className="space-y-2 mb-4">
                {alert.newValue.flags.map((flag, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 mt-0.5">
                      <Flag size={8} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-wide">Rule: {flag.rule}</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed font-medium mt-0.5">{flag.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Context */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                    <User size={10} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-800">
                      {alert.user ? `${alert.user.firstName} ${alert.user.lastName}` : "System Entity"}
                    </p>
                    <p className="text-[9px] text-slate-500 font-medium">{alert.user?.email || "internal@budolecosystem.com"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black px-2 py-1 rounded bg-[#0f172a] text-white tracking-widest uppercase`}>
                    KYC: {alert.user?.kycTier || "NONE"}
                  </span>
                </div>
              </div>
            </div>
          ))
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
          <div className="flex flex-col">
            <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest">DRS Status</span>
            <span className="text-[10px] font-black text-blue-400 leading-tight tracking-tighter">ACTIVE (EWMA)</span>
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
