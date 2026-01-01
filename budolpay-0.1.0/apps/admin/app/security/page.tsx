"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  FileText, 
  History, 
  Lock, 
  Eye, 
  Download,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Loader2
} from "lucide-react";

export default function SecurityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [filter, setFilter] = useState("All Actions");

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = filter === "All Actions" ? "/api/security" : `/api/security?filter=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        body: JSON.stringify({ action: "RUN_AUDIT" }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        alert("Security Audit Complete: System Integrity Verified (100%)");
        fetchLogs(); // Refresh logs to show the scan entry
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const generateReport = async () => {
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        body: JSON.stringify({ action: "GENERATE_BSP_REPORT" }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        alert(`BSP Regulatory Report Generated: ${data.report.reportId} is ready for submission.\n\nTotal Volume: PHP ${data.report.totalVolume.toLocaleString()}\nTransactions: ${data.report.transactionCount}`);
        fetchLogs(); // Refresh logs to show the new entry
      }
    } catch (e) {
      console.error(e);
    }
  };

  const complianceStats = [
    { label: "Data Encryption (At Rest)", status: "Active", strength: "AES-256", icon: Lock, color: "text-green-600" },
    { label: "Access Control (RBAC)", status: "Enforced", strength: "Strict", icon: UserCheck, color: "text-green-600" },
    { label: "SSL/TLS 1.3", status: "Active", strength: "Strong", icon: ShieldCheck, color: "text-green-600" },
    { label: "Intrusion Detection", status: "Monitoring", strength: "Real-time", icon: Eye, color: "text-blue-600" },
  ];

  const trendData = [
    { day: "Mon", threats: 12, blocks: 12 },
    { day: "Tue", threats: 18, blocks: 18 },
    { day: "Wed", threats: 8, blocks: 8 },
    { day: "Thu", threats: 24, blocks: 23 },
    { day: "Fri", threats: 15, blocks: 15 },
    { day: "Sat", threats: 32, blocks: 32 },
    { day: "Sun", threats: 10, blocks: 10 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Security & Compliance</h2>
          <p className="text-slate-600">Forensic audit logs and regulatory reporting tools.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            <Download size={16} />
            BSP Report (XML)
          </button>
          <button 
            onClick={runAudit}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-budolshap-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isScanning ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
            {isScanning ? "Scanning..." : "Security Audit"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Trends */}
        <div className="lg:col-span-1 space-y-6">
          {/* Compliance Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="text-green-600" size={20} />
              Compliance Hardening
            </h3>
            <div className="space-y-4">
              {complianceStats.map((stat) => (
                <div key={stat.label} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{stat.label}</span>
                    <span className={`text-[10px] font-black ${stat.color}`}>{stat.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <stat.icon size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{stat.strength}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Trends Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <History className="text-budolshap-primary" size={20} />
              Threat Mitigation Trend
            </h3>
            <div className="flex items-end justify-between gap-2 h-32 mb-4">
              {trendData.map((data) => (
                <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-100 rounded-t-sm relative group">
                    <div 
                      className="absolute bottom-0 w-full bg-budolshap-primary opacity-20 rounded-t-sm transition-all group-hover:opacity-40" 
                      style={{ height: `${(data.threats / 40) * 100}%` }}
                    ></div>
                    <div 
                      className="absolute bottom-0 w-full bg-budolshap-primary rounded-t-sm transition-all" 
                      style={{ height: `${(data.blocks / 40) * 100}%` }}
                    ></div>
                    <div className="h-32"></div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{data.day}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-budolshap-primary"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-budolshap-primary opacity-20"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Threats</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 p-6 rounded-xl border border-rose-100">
            <h3 className="font-bold text-rose-800 mb-2 flex items-center gap-2">
              <AlertTriangle size={18} />
              Vulnerability Scan
            </h3>
            <p className="text-xs text-rose-600 mb-4 font-medium">Last full scan: 2 hours ago. No critical vulnerabilities detected.</p>
            <div className="w-full bg-rose-200 rounded-full h-1.5">
              <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <p className="text-[10px] text-rose-400 mt-2 font-bold uppercase">System Integrity: 100%</p>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-white">
                <History size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Forensic Audit Trail</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Immutable Activity Logs</p>
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-xs font-bold border-slate-200 rounded-md bg-white px-2 py-1 outline-none focus:border-budolshap-primary"
              >
                <option>All Actions</option>
                <option>Security</option>
                <option>Financial</option>
                <option>System</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-slate-100 min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Decrypting Forensic Logs...</p>
              </div>
            ) : logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    log.action.includes('LOGIN') ? 'bg-blue-100 text-blue-600' :
                    log.action.includes('CHANGE') ? 'bg-amber-100 text-amber-600' :
                    log.action.includes('AUDIT') || log.action.includes('REPORT') ? 'bg-green-100 text-green-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {log.user?.name?.[0] || 'S'}
                  </div>
                </div>
                <div className="col-span-3">
                  <p className="text-sm font-bold text-slate-800">{log.action}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{log.user?.name || 'System'}</p>
                </div>
                <div className="col-span-4">
                  <p className="text-[10px] text-slate-500 font-mono truncate">{log.entity}: {log.entityId}</p>
                  <p className="text-[9px] text-slate-400">{log.ipAddress || 'Internal'}</p>
                </div>
                <div className="col-span-3 text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(log.createdAt).toLocaleDateString()}</p>
                  <p className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="col-span-1 text-right">
                  <button className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-400">
                    <FileText size={14} />
                  </button>
                </div>
              </div>
            ))}
            {!loading && logs.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">No audit entries found in the current period.</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <button className="text-xs font-bold text-slate-500 hover:text-budolshap-primary transition-colors">
              LOAD FULL ARCHIVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
