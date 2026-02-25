'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCcw, ExternalLink, ShieldCheck, Globe, AlertTriangle } from 'lucide-react';

export default function EnvironmentSettings() {
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const gatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || `http://${window.location.hostname}:8080`;
            const response = await fetch(`${gatewayUrl}/config/budolshap`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch configuration');
            const data = await response.json();
            setConfig(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch config:', err.message);
            setError("Could not connect to BudolPay API Gateway. Please ensure all services are running.");
        } finally {
            setLoading(false);
        }
    };

    const isProd = typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || config.VERCEL === '1');

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Environment</h1>
                    <p className="text-slate-500 mt-1">Active configuration and service parameters for BudolShap.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                    <div className={`flex items-center gap-2 px-3 py-1.5 bg-${isProd ? 'indigo' : 'emerald'}-50 text-${isProd ? 'indigo' : 'emerald'}-700 rounded-lg text-xs font-bold uppercase tracking-wider`}>
                        <div className={`w-2 h-2 rounded-full bg-${isProd ? 'indigo' : 'emerald'}-500 animate-pulse`}></div>
                        {isProd ? 'Production / Vercel' : 'Local Development'}
                    </div>
                    <button 
                        onClick={fetchConfig}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                        <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-xl mb-10 shadow-sm">
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Centralized Management</h3>
                        <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                            These settings are managed centrally in the <strong className="text-amber-900">BudolPay Master Controller</strong>. 
                            To change these values, switch environments, or add new variables, use the master controller.
                        </p>
                        <div className="mt-4">
                            <a 
                                href={`http://${window.location.hostname}:3000/settings`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-amber-200/50 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-amber-300/30"
                            >
                                Open Master Controller
                                <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-slate-500 font-medium">Fetching active configuration...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl mb-10 shadow-sm flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <div className="bg-red-100 p-4 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-red-800 text-lg uppercase tracking-tight">Connection Error</h3>
                        <p className="text-red-700 mt-1">{error}</p>
                    </div>
                    <button onClick={fetchConfig} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-200">Try Again</button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Configuration Key</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active Value</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(config).map(([key, value]) => (
                                    <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <ShieldCheck size={14} />
                                                </div>
                                                <span className="text-sm font-mono font-bold text-indigo-600">{key}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <code className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 break-all">{value}</code>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                <Globe size={10} />
                                                Active
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {Object.keys(config).length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Globe size={40} className="text-slate-200" />
                                                <p className="text-slate-400 italic font-medium">No environment settings found for BudolShap.</p>
                                                <p className="text-slate-400 text-xs mt-1">Add them in the BudolPay Admin Panel to see them here.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <div className="mt-10 p-6 bg-slate-900 rounded-xl text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">Vercel Migration Tooling</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-2xl">
                        The ecosystem is now Vercel-ready. You can sync these settings directly to your Vercel project 
                        environment variables using the integrated sync tool in the Master Controller.
                    </p>
                    <div className="flex gap-4">
                        <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition">
                            View Migration Guide
                        </button>
                        <button className="bg-slate-800 text-white border border-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition">
                            Ecosystem Health Check
                        </button>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-green-600/20 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
}