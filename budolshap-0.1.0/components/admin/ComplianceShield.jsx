'use client'
import React, { useState, useEffect } from 'react'
import { Shield, Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { formatManilaTime, getNextAuditDate } from "@/lib/dateUtils"

const ComplianceShield = () => {
  const [telemetry, setTelemetry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTelemetry = async () => {
    try {
      const response = await fetch('/api/admin/compliance/telemetry')
      if (response.ok) {
        const data = await response.json()
        setTelemetry(data)
        setError(null)
      } else {
        setError('Telemetry Link Severed')
      }
    } catch (err) {
      setError('Connection Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTelemetry()
    // Increased polling frequency to 10s for real-time compliance monitoring
    const interval = setInterval(fetchTelemetry, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'SECURED':
      case 'VERIFIED':
      case 'ACTIVE':
      case 'SYNCED':
        return 'text-emerald-400'
      case 'WARNING':
      case 'DELAYED':
      case 'SYNCING':
        return 'text-amber-400'
      case 'RISK':
      case 'ERROR':
        return 'text-rose-500'
      default:
        return 'text-slate-400'
    }
  }

  const getStatusBg = (status) => {
    switch (status) {
      case 'SECURED':
      case 'VERIFIED':
      case 'ACTIVE':
      case 'SYNCED':
        return 'bg-emerald-500/10'
      case 'WARNING':
      case 'DELAYED':
      case 'SYNCING':
        return 'bg-amber-500/10'
      case 'RISK':
      case 'ERROR':
        return 'bg-rose-500/10'
      default:
        return 'bg-slate-500/10'
    }
  }

  const items = telemetry?.checks || [
    { label: "PCI DSS v4.0 Encryption", status: "LOADING", sub: "Data-at-rest & in-transit" },
    { label: "BSP Transaction Logs", status: "LOADING", sub: "Circular No. 808 compliance" },
    { label: "BIR Tax Integration", status: "LOADING", sub: "E-invoicing middleware" },
    { label: "NPC Data Privacy", status: "LOADING", sub: "DPA 2012 standards" },
  ]

  return (
    <div className="bg-[#0f172a] text-white rounded-3xl shadow-2xl p-6 flex flex-col border border-white/5 relative overflow-hidden group/shield">
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full -mr-16 -mt-16 transition-all group-hover/shield:bg-indigo-500/20"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="font-black text-white text-lg tracking-tight">Compliance Shield</h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Real-time Telemetry</p>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
        <div className={`p-2.5 rounded-xl border border-white/10 transition-all relative ${error ? 'text-rose-500 bg-rose-500/10' : 'text-indigo-400 bg-white/5 group-hover/shield:scale-110'}`}>
          {error ? (
            <Shield size={20} className="animate-pulse" />
          ) : (
            <>
              <Shield className="w-5 h-5 relative z-10 animate-pulse" />
              <div className="absolute inset-0 bg-indigo-500/20 rounded-xl animate-ping opacity-20"></div>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-3 flex-1 relative z-10">
        {items.map((item) => (
          <div key={item.label} className={`p-3 bg-white/[0.03] rounded-xl border border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all group/item relative ${item.warning ? 'border-rose-500/30' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-1 h-1 rounded-full ${getStatusColor(item.status).replace('text', 'bg')} animate-pulse`}></span>
                <span className="text-[11px] font-bold text-slate-300 group-hover/item:text-white transition-colors">{item.label}</span>
              </div>
              <span className={`text-[8px] font-black tracking-widest ${getStatusColor(item.status)} ${getStatusBg(item.status)} px-1.5 py-0.5 rounded flex items-center gap-1`}>
                {item.warning && <AlertTriangle size={8} className="animate-bounce" />}
                {item.status}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium group-hover/item:text-slate-400 transition-colors pl-3">{item.sub}</p>
            
            {/* Warning Tooltip */}
            {item.warning && (
              <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <Info size={10} className="text-rose-400 mt-0.5 shrink-0" />
                <p className="text-[8px] text-rose-300 leading-tight font-medium">{item.warning}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover/shield:bg-white/10 transition-colors">
              <Activity className={`w-3.5 h-3.5 ${error ? 'text-rose-500' : 'text-indigo-400'} animate-pulse`} />
            </div>
            <div className="flex flex-col">
              <span>{error || `Next Audit: ${getNextAuditDate()}`}</span>
              <span className="text-[8px] text-slate-600 mt-0.5 tracking-normal">Telemetry: {telemetry ? formatManilaTime(telemetry.timestamp, { timeStyle: 'short' }) : '...'}</span>
            </div>
          </div>
          <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            V3.4.2-SECURE
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComplianceShield
