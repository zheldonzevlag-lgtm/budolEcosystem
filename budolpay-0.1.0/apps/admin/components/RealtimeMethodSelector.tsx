"use client";

import { useState } from "react";
import { Zap, Activity, Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeMethodSelectorProps {
  initialMethod: string;
}

export default function RealtimeMethodSelector({ initialMethod }: RealtimeMethodSelectorProps) {
  const [method, setMethod] = useState(initialMethod);

  const methods = [
    {
      id: "PUSHER",
      name: "Pusher (Hosted, Paid)",
      description: "Third-party hosted service. Easy setup, but has usage limits and costs.",
      icon: Zap,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    {
      id: "SOCKETIO",
      name: "Socket.io (Self-hosted)",
      description: "Run your own websocket server. Unlimited usage, requires server maintenance.",
      icon: Activity,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
    },
    {
      id: "SWR",
      name: "SWR Polling (Client-side)",
      description: "Simple client-side data fetching. Works anywhere, but higher server load.",
      icon: Globe,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
  ];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Update Method</h3>
        <p className="text-xs text-slate-500 font-medium">Choose how live data is synchronized with the dashboard</p>
      </div>

      <input type="hidden" name="realtimeMethod" value={method} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {methods.map((m) => {
          const Icon = m.icon;
          const isActive = method === m.id;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                "relative flex flex-col items-start text-left p-5 rounded-xl border-2 transition-all group",
                isActive
                  ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500 shadow-lg shadow-blue-100/50"
                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className={cn("p-2 rounded-lg mb-4", m.bgColor)}>
                <Icon className={cn("w-5 h-5", m.color)} />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-slate-900">{m.name}</span>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{m.description}</p>
              </div>

              {isActive && (
                <div className="absolute top-4 right-4 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white stroke-[4px]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
