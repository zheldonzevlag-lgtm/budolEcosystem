'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import Loading from '@/components/Loading';
import Image from 'next/image';
import { format } from 'date-fns';
import { History, LogIn, LogOut, Monitor, Smartphone, Globe, Search, Zap } from 'lucide-react';
import { formatManilaTime } from "@/lib/dateUtils";

export default function AuditLogsPage() {
    const [activeTab, setActiveTab] = useState('LOGIN');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [searchQuery, setSearchQuery] = useState('');

    const activeTabRef = useRef(activeTab);
    const pageRef = useRef(pagination.page);

    useEffect(() => {
        activeTabRef.current = activeTab;
        fetchLogs(activeTab, 1);
    }, [activeTab]);

    useEffect(() => {
        pageRef.current = pagination.page;
    }, [pagination.page]);

    // Provider-Agnostic Realtime Integration
    const handleRealtimeData = useCallback((newLog) => {
        if (newLog.action === activeTabRef.current && pageRef.current === 1) {
            setLogs(prevLogs => {
                if (prevLogs.find(l => l.id === newLog.id)) return prevLogs;
                
                const normalizedLog = {
                    ...newLog,
                    createdAt: newLog.createdAt || newLog.timestamp || new Date().toISOString(),
                    user: newLog.user || { name: 'System', email: 'system@budolecosystem.com' }
                };

                const updatedLogs = [normalizedLog, ...prevLogs];
                return updatedLogs.slice(0, 20);
            });
        }
    }, []);

    const { isPolling, provider, isConnected, pollingInterval } = useRealtime({
        channel: 'admin',
        event: 'AUDIT_LOG_CREATED',
        onData: handleRealtimeData
    });

    // SWR Polling Fallback (Uses configured interval from useRealtime hook)
    useEffect(() => {
        if (!isPolling) return;

        const interval = setInterval(() => {
            if (pageRef.current === 1 && !searchQuery) {
                fetchLogs(activeTabRef.current, 1, true);
            }
        }, pollingInterval || 10000);

        return () => clearInterval(interval);
    }, [isPolling, searchQuery, pollingInterval]);


    const fetchLogs = async (action, page, isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch(`/api/admin/audit-logs?action=${action}&page=${page}&limit=20`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            
            if (res.ok) {
                if (isSilent) {
                    // For silent updates (polling), only update if there are new logs
                    setLogs(prevLogs => {
                        const newLogs = data.logs.filter(newLog => !prevLogs.some(oldLog => oldLog.id === newLog.id));
                        if (newLogs.length === 0) return prevLogs;
                        
                        // Merge new logs and keep top 20
                        const merged = [...newLogs, ...prevLogs];
                        return merged.slice(0, 20);
                    });
                } else {
                    setLogs(data.logs);
                    setPagination(data.pagination);
                }
            } else {
                console.error(data.error);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchLogs(activeTab, newPage);
        }
    };

    // Filter logs based on search query
    const filteredLogs = logs.filter((log) => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        const timestamp = formatManilaTime(log.createdAt).toLowerCase();
        const userName = log.user?.name?.toLowerCase() || '';
        const userEmail = log.user?.email?.toLowerCase() || '';
        const device = (log.device || '').toLowerCase();
        const city = (log.city || '').toLowerCase();
        const country = (log.country || '').toLowerCase();
        const ipAddress = (log.ipAddress || '').toLowerCase();
        
        return (
            timestamp.includes(query) ||
            userName.includes(query) ||
            userEmail.includes(query) ||
            device.includes(query) ||
            city.includes(query) ||
            country.includes(query) ||
            ipAddress.includes(query)
        );
    });

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <History size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-800">Login & Logout Tracker</h1>
                            {isConnected && (
                                <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                    isPolling ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700 animate-pulse'
                                }`}>
                                    <Zap size={10} fill="currentColor" />
                                    {isPolling ? 'Polling' : provider}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm">Monitor user access and security events.</p>
                    </div>
                </div>
                {/* Search Input */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by user, email, device, location, IP, or timestamp..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700 placeholder-slate-400"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('LOGIN')}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'LOGIN' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <LogIn size={16} />
                    Login History
                    {activeTab === 'LOGIN' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('LOGOUT')}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'LOGOUT' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <LogOut size={16} />
                    Logout History
                    {activeTab === 'LOGOUT' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-t-full"></span>
                    )}
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loading />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <History size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No records found for {activeTab.toLowerCase()} events.</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Search size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No results found matching "{searchQuery}".</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-semibold border-b">Timestamp</th>
                                    <th className="p-4 font-semibold border-b">User</th>
                                    <th className="p-4 font-semibold border-b">Device Info</th>
                                    <th className="p-4 font-semibold border-b">City</th>
                                    <th className="p-4 font-semibold border-b">Location Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 whitespace-nowrap">
                                             <div className="text-sm font-medium text-slate-900">
                                                 {formatManilaTime(log.createdAt, { dateStyle: 'medium' })}
                                             </div>
                                             <div className="text-xs text-slate-500">
                                                 {formatManilaTime(log.createdAt, { timeStyle: 'medium' })}
                                             </div>
                                         </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {log.user.image ? (
                                                    <Image
                                                        src={log.user.image}
                                                        alt={log.user.name || `${log.user.firstName} ${log.user.lastName}`}
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full object-cover border border-slate-200"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                        {(log.user.name || log.user.firstName || 'U').charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {log.user.name || `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || 'System User'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{log.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                {log.device?.toLowerCase().includes('mobile') ? <Smartphone size={14} className="text-slate-400" /> : <Monitor size={14} className="text-slate-400" />}
                                                <span>{log.device || 'Unknown Device'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-700">
                                                {log.city || '-'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                    <Globe size={14} className="text-emerald-500" />
                                                    {log.country || 'Unknown Location'}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono">
                                                    IP: {log.ipAddress}
                                                </div>
                                                {log.latitude && log.longitude && (
                                                    <div className="mt-1">
                                                        <a
                                                            href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                                        >
                                                            View on Map ↗
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="text-xs text-slate-500">
                        Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="px-3 py-1 text-xs font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-3 py-1 text-xs font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
