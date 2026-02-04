"use client";

import { useState, useEffect } from "react";
import { Zap, Server, RefreshCw } from "lucide-react";
import { realtime } from "@/lib/realtime";

interface Props {
  initialMethod: string;
  settings: Record<string, string>;
}

export default function RealtimeMethodSelector({ initialMethod, settings }: Props) {
  const [method, setMethod] = useState(initialMethod);

  // Re-initialize realtime service when settings change (after server action revalidates)
  useEffect(() => {
    const reinit = async () => {
      console.log("[Realtime] Detected settings change, re-initializing...");
      await realtime.reinit();
    };
    reinit();
  }, [initialMethod, settings]);

  const methods = [
    {
      id: "PUSHER",
      name: "Pusher (Hosted, Paid)",
      description: "Best for production. Reliable, scalable, managed websocket service.",
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "peer-checked:border-purple-600"
    },
    {
      id: "SOCKETIO",
      name: "Socket.io (Self-hosted)",
      description: "Good for high volume, zero cost. Requires managing your own socket server.",
      icon: Server,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "peer-checked:border-blue-600"
    },
    {
      id: "SWR",
      name: "SWR Polling (Client-side)",
      description: "Simplest fallback. Fetches data every X seconds. No websocket server needed.",
      icon: RefreshCw,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "peer-checked:border-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {methods.map((m) => {
          const Icon = m.icon;
          return (
            <label key={m.id} className="relative cursor-pointer group">
              <input
                type="radio"
                name="realtimeMethod"
                value={m.id}
                className="peer sr-only"
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
              />
              <div className={`p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all ${m.border} ${method === m.id ? m.bg : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-6 h-6 ${m.color}`} />
                  {method === m.id && (
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm animate-pulse" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{m.name}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {m.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        {method === "PUSHER" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              Pusher Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">App ID</label>
                <input
                  type="text"
                  name="pusherAppId"
                  defaultValue={settings['REALTIME_PUSHER_APP_ID']}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="e.g. 1234567"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Cluster</label>
                <input
                  type="text"
                  name="pusherCluster"
                  defaultValue={settings['REALTIME_PUSHER_CLUSTER']}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="e.g. ap1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Key</label>
                <input
                  type="text"
                  name="pusherKey"
                  defaultValue={settings['REALTIME_PUSHER_KEY']}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="e.g. a1b2c3d4e5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Secret</label>
                <input
                  type="password"
                  name="pusherSecret"
                  defaultValue={settings['REALTIME_PUSHER_SECRET']}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>
        )}

        {method === "SOCKETIO" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              Socket.io Configuration
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Socket Server URL</label>
              <input
                type="url"
                name="socketioUrl"
                defaultValue={settings['REALTIME_SOCKETIO_URL']}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="http://localhost:3001"
              />
              <p className="text-xs text-gray-400">
                Must be accessible from the client's browser.
              </p>
            </div>
          </div>
        )}

        {method === "SWR" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-orange-600" />
              SWR Polling Configuration
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Refresh Interval (ms)</label>
              <input
                type="number"
                name="swrInterval"
                defaultValue={settings['REALTIME_SWR_REFRESH_INTERVAL'] || "10000"}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="10000"
              />
              <p className="text-xs text-gray-400">
                Lower values increase server load. Recommended: 5000-10000ms.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
