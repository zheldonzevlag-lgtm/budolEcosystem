'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    ShieldCheck, Filter, Search, Download, 
    AlertTriangle, CheckCircle, XCircle, Info, RefreshCw,
    User, HardDrive, MapPin, Globe, Clock, History
} from 'lucide-react';
import { formatManilaTime } from "@/lib/dateUtils";
import { toast, Toaster } from 'react-hot-toast';

/**
 * Forensic Audit Trails Page for BudolPay Admin
 * Ported from BudolShap with enhancements for Fintech security compliance (BSP/PCI DSS).
 */
export default function ForensicAuditTrailsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    
    // Filters
    const [filters, setFilters] = useState({
        action: 'ALL',
        entity: 'ALL',
        status: 'ALL',
        search: '',
        startDate: '',
        endDate: ''
    });

    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const fetchLogs = useCallback(async (page = 1, isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...filters,
                search: debouncedSearch
            });
            
            if (filters.action === 'ALL') query.delete('action');
            if (filters.entity === 'ALL') query.delete('entity');
            if (filters.status === 'ALL') query.delete('status');
            if (!filters.startDate) query.delete('startDate');
            if (!filters.endDate) query.delete('endDate');
            if (!debouncedSearch) query.delete('search');

            const res = await fetch(`/api/admin/audit-logs?${query.toString()}`);
            const data = await res.json();
            
            if (res.ok) {
                setLogs(data.logs || []);
                setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
            } else {
                toast.error(data.error || 'Failed to fetch logs');
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
            toast.error('Connection error. Please check your network.');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [filters, debouncedSearch]);

    useEffect(() => {
        fetchLogs(1);
    }, [fetchLogs]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const analyzeRisk = (log: any) => {
        const highRiskActions = ['DELETE_USER', 'RESET_BALANCE', 'BYPASS_KYC', 'FAILED_LOGIN_ATTEMPT'];
        if (highRiskActions.includes(log.action) || log.status === 'FAILURE') {
            return { level: 'HIGH', color: 'text-red-700 bg-red-100 border-red-200' };
        }
        if (log.action.includes('UPDATE')) {
            return { level: 'MEDIUM', color: 'text-yellow-700 bg-yellow-100 border-yellow-200' };
        }
        return { level: 'LOW', color: 'text-green-700 bg-green-100 border-green-200' };
    };

    const handleExport = () => {
        const headers = ['Timestamp', 'Action', 'User', 'IP Address', 'Location', 'Entity', 'Details'];
        const csvContent = [
            headers.join(','),
            ...logs.map(log => [
                `"${log.createdAt}"`,
                `"${log.action}"`,
                `"${log.user?.email || 'System'}"`,
                `"${log.ipAddress || 'Internal'}"`,
                `"${log.city || ''}, ${log.country || ''}"`,
                `"${log.entity || ''}"`,
                `"${JSON.stringify(log.metadata || {}).replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budolpay-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Audit trail exported successfully');
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC]">
            <Toaster position="top-right" />
            
            {/* Header Section with Glassmorphism Effect */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Forensic Audit Trails
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium">
                        BSP-compliant immutable ledger of all administrative and system-wide changes.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => fetchLogs(1)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Sync Data
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md shadow-blue-100 transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Export Ledger
                    </button>
                </div>
            </div>

            {/* Premium Filter Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="lg:col-span-2 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search by action, email, IP address or entity ID..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-400 transition-all shadow-sm"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
                
                <div className="flex gap-4 lg:col-span-2">
                    <div className="flex-1 flex gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <input 
                            type="date" 
                            className="flex-1 px-3 py-2 text-sm text-slate-600 bg-transparent border-none focus:ring-0"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                        <div className="w-[1px] bg-slate-100 my-2"></div>
                        <input 
                            type="date" 
                            className="flex-1 px-3 py-2 text-sm text-slate-600 bg-transparent border-none focus:ring-0"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Table Area */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] uppercase text-slate-400 font-bold tracking-widest">
                                <th className="px-8 py-6">Timeline</th>
                                <th className="px-8 py-6">Risk Index</th>
                                <th className="px-8 py-6">Operation</th>
                                <th className="px-8 py-6">Principal Actor</th>
                                <th className="px-8 py-6">Metadata / Environment</th>
                                <th className="px-8 py-6">Entity Context</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                            <p className="text-slate-400 font-medium">Loading secure audit trail...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <History className="w-10 h-10 text-slate-200" />
                                            <p className="text-slate-400 font-medium">No forensic logs detected for this period.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const risk = analyzeRisk(log);
                                    return (
                                        <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-mono text-xs font-semibold text-slate-600">
                                                        {formatManilaTime(log.createdAt)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter border ${risk.color}`}>
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {risk.level} RISK
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold border border-white shadow-sm ring-1 ring-slate-100 group-hover:scale-110 transition-transform">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-sm font-bold text-slate-800 truncate max-w-[140px]">
                                                            {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}` : 'System'}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                                                            {log.user?.email || 'AUTOMATED_PROCESS'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                                        <Globe className="w-3 h-3" />
                                                        {log.ipAddress || '0.0.0.0'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 italic font-medium">
                                                        <MapPin className="w-3 h-3" />
                                                        {log.city && log.country ? `${log.city}, ${log.country}` : 'Unknown Location'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                                    <HardDrive className="w-4 h-4 text-slate-300" />
                                                    <div className="flex flex-col max-w-[160px]">
                                                        <span className="text-xs font-bold text-slate-700 truncate">{log.entity || '-'}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono truncate">{log.entityId || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination with Soft Glass Style */}
                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
                        Ledger Index {((pagination.page - 1) * 20) + 1} - {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} 
                    </p>
                    <div className="flex gap-3">
                        <button 
                            disabled={pagination.page <= 1}
                            onClick={() => fetchLogs(pagination.page - 1)}
                            className="px-6 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            Back
                        </button>
                        <button 
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchLogs(pagination.page + 1)}
                            className="px-6 py-2 bg-slate-900 border border-slate-900 rounded-xl text-xs font-bold text-white disabled:opacity-30 hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 active:scale-95"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
