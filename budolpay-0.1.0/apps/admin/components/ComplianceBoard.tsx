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
  newValue: {
    flags: ComplianceFlag[];
    transactionId: string;
    referenceId: string;
  };
  metadata: {
    severity: 'HIGH' | 'MEDIUM';
    rulesTriggered: string[];
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

  useEffect(() => {
    // 1. Initial Load
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

    // 2. Real-time Subscription
    const unsubscribe = realtime.on("COMPLIANCE_ALERT", (newAlert: ComplianceAlert) => {
      console.log("[ComplianceBoard] Real-time alert received:", newAlert);
      setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep last 50
    });

    return () => unsubscribe();
  }, []);

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
            <ShieldAlert className="w-5 h-5 text-[#f43f5e]" />
            <h3 className="font-black text-[#0f172a] text-lg tracking-tight">Compliance Monitoring Board</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Automated AML / BSP Circular 808 Enforcement</p>
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
                  <div className={`p-2.5 rounded-2xl ${alert.metadata.severity === 'HIGH' ? 'bg-[#f43f5e]/10 text-[#f43f5e]' : 'bg-amber-100 text-amber-600'}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md ${alert.metadata.severity === 'HIGH' ? 'bg-[#f43f5e] text-white' : 'bg-amber-500 text-white'}`}>
                        {alert.metadata.severity} RISK
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{alert.newValue.referenceId}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 mt-1 group-hover:text-[#f43f5e] transition-colors">{alert.action.replace(/_/g, ' ')}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end text-slate-400 mb-1">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <button className="flex items-center gap-1.5 text-[10px] font-black text-[#f43f5e] hover:underline uppercase bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm mt-1">
                    Review Transaction <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              {/* Rules Triggered */}
              <div className="space-y-2 mb-4">
                {alert.newValue.flags.map((flag, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 mt-0.5">
                      <Flag size={12} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Rule: {flag.rule}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-0.5">{flag.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Context */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                    <User size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900">
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
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Flags</span>
            <span className="text-lg font-black leading-tight">{alerts.length}</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform Integrity</span>
            <span className="text-lg font-black text-green-400 leading-tight">ACTIVE</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Legal Standard</p>
          <p className="text-[10px] font-bold text-[#f43f5e]">BSP CIRCULAR NO. 808</p>
        </div>
      </div>
    </div>
  );
}
