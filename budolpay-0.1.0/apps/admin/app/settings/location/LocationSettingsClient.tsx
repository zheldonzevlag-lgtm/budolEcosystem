"use client";

import { Map, Search, Key, Check } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { cn } from "@/lib/utils";
import { useState } from "react";

const MAP_PROVIDERS = [
  { id: 'OSM', name: 'OpenStreetMap', desc: 'Free & Community Driven' },
  { id: 'GEOAPIFY', name: 'Geoapify', desc: 'Powerful Autocomplete' },
  { id: 'GOOGLE', name: 'Google Maps', desc: 'Premium & Global' },
  { id: 'RADAR', name: 'Radar', desc: 'Privacy Focused' }
];

interface LocationSettingsClientProps {
  initialSettings: Record<string, string>;
  saveAction: (formData: FormData) => Promise<void>;
}

export default function LocationSettingsClient({ 
  initialSettings, 
  saveAction 
}: LocationSettingsClientProps) {
  const [currentProvider, setCurrentProvider] = useState(initialSettings['MAPS_ACTIVE_PROVIDER'] || 'OSM');

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-200">
          <Map className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Map & Location Settings</h1>
          <p className="text-slate-500 mt-1">Configure geospatial providers for address pinning and verification.</p>
        </div>
      </div>

      <form action={saveAction} className="space-y-10">
        {/* Provider Selection */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
              <Search className="w-5 h-5 text-orange-500" />
              Active Map Provider
            </h2>
            <p className="text-xs text-slate-400 font-bold">
              Choose which service will power the address autocomplete and interactive map across the platform.
            </p>
          </div>

          <input type="hidden" name="mapProvider" value={currentProvider} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MAP_PROVIDERS.map((p) => {
              const isActive = currentProvider === p.id;
              return (
                <div 
                  key={p.id}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 transition-all flex flex-col gap-4",
                    isActive 
                      ? "border-orange-500 bg-orange-50/30 ring-1 ring-orange-500 shadow-lg shadow-orange-100/50" 
                      : "border-slate-50 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-100"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-slate-900">{p.name}</span>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{p.desc}</p>
                  </div>

                  {isActive ? (
                    <button 
                      type="button"
                      disabled
                      className="w-full py-2 bg-slate-100 text-slate-400 text-[10px] font-black uppercase rounded-lg cursor-not-allowed"
                    >
                      Disable Provider
                    </button>
                  ) : (
                    <button 
                      type="submit"
                      onClick={() => setCurrentProvider(p.id)}
                      className="w-full py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Enable Provider
                    </button>
                  )}

                  {isActive && (
                    <div className="absolute top-4 right-4 w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white stroke-[4px]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
              <Key className="w-5 h-5 text-slate-600" />
              API Credentials
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geoapify API Key</label>
              <input 
                name="geoapifyApiKey"
                placeholder="Enter Geoapify Key"
                defaultValue={initialSettings['MAPS_GEOAPIFY_KEY']}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase">Required for Geoapify Autocomplete and Tiles.</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Maps API Key</label>
              <input 
                name="googleMapsApiKey"
                placeholder="Enter Google Maps Key"
                defaultValue={initialSettings['MAPS_GOOGLE_MAPS_KEY']}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase">Requires Places API and Maps JavaScript API enabled.</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radar API Key</label>
              <input 
                name="radarApiKey"
                placeholder="Enter Radar Key"
                defaultValue={initialSettings['MAPS_RADAR_KEY']}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase">Required for Radar Geocoding services.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <SubmitButton className="px-10 py-4 rounded-xl bg-orange-600 text-sm font-black uppercase tracking-[0.1em] shadow-lg shadow-orange-100">
            Save Configuration
          </SubmitButton>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-orange-500">*</span>
            <p className="text-[10px] font-bold uppercase">OpenStreetMap (OSM) does not require an API key for basic usage.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
