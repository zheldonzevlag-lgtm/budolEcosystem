'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import Loading from '@/components/Loading';
import { format } from 'date-fns';
import { 
    History, ShieldCheck, Filter, Search, Download, 
    AlertTriangle, CheckCircle, XCircle, Info, RefreshCw 
} from 'lucide-react';
import { formatManilaTime } from "@/lib/dateUtils";
import SecurityComplianceDashboard from '@/components/admin/SecurityComplianceDashboard';
import { toast } from 'react-hot-toast';

export default function ForensicAuditTrailsPage() {
    const [logs, setLogs] = useState([]);
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

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const pageRef = useRef(1);

    // Fetch Logs
    const fetchLogs = useCallback(async (page = 1, isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...filters,
                search: debouncedSearch
            });
            
            // Remove empty filters
            if (filters.action === 'ALL') query.delete('action');
            if (filters.entity === 'ALL') query.delete('entity');
            if (filters.status === 'ALL') query.delete('status');
            if (!filters.startDate) query.delete('startDate');
            if (!filters.endDate) query.delete('endDate');
            if (!debouncedSearch) query.delete('search');

            console.log('Fetching audit logs with query:', query.toString());
            const res = await fetch(`/api/admin/audit-logs?${query.toString()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const data = await res.json();
            console.log('Audit Logs Response:', data);
            
            if (res.ok) {
                setLogs(Array.isArray(data.logs) ? data.logs : []);
                setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
                pageRef.current = page;
                if (!isSilent && data.logs?.length === 0 && page === 1 && !debouncedSearch) {
                    toast.error('No logs found. System might be fresh.');
                }
            } else {
                console.error('Audit Log Fetch Error:', data.error);
                if (data.error === 'Unauthorized' || res.status === 401) {
                     toast.error('Session expired. Please login again.');
                } else {
                     toast.error('Failed to fetch logs: ' + (data.error || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
            toast.error('Connection error. Please check your network.');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [filters, debouncedSearch]);

    // Initial Fetch & Refetch on Filter Change
    useEffect(() => {
        fetchLogs(1);
    }, [fetchLogs]);

    // Realtime Updates
    const handleRealtimeData = useCallback((newLog) => {
        // Only update if on first page and no active search/filter that would exclude it
        // Ideally we check if newLog matches filters, but for simplicity:
        if (pageRef.current === 1 && !debouncedSearch && filters.status === 'ALL') {
            setLogs(prevLogs => {
                if (prevLogs.find(l => l.id === newLog.id)) return prevLogs;
                
                const normalizedLog = {
                    ...newLog,
                    createdAt: newLog.createdAt || new Date().toISOString(),
                    user: newLog.user || { name: 'System', email: 'system@budolecosystem.com' }
                };

                return [normalizedLog, ...prevLogs].slice(0, 20);
            });
        }
    }, [debouncedSearch, filters]);

    useRealtime({
        channel: 'admin',
        event: 'AUDIT_LOG_CREATED',
        onData: handleRealtimeData
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'FAILURE': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const analyzeRisk = (log) => {
        if (['FAILURE', 'BLOCKED'].includes(log.status) || ['SPAM_ATTEMPT', 'DDOS_MITIGATED'].includes(log.action)) {
            return { level: 'HIGH', color: 'text-red-600 bg-red-50', score: 90 };
        }
        if (log.status === 'WARNING') {
            return { level: 'MEDIUM', color: 'text-yellow-600 bg-yellow-50', score: 50 };
        }
        return { level: 'LOW', color: 'text-green-600', score: 10 };
    };

    const handleExport = () => {
        const headers = ['Timestamp', 'Risk Level', 'Action', 'User', 'IP Address', 'Device', 'Details'];
        const csvContent = [
            headers.join(','),
            ...logs.map(log => {
                const risk = analyzeRisk(log).level;
                return [
                    `"${log.createdAt}"`,
                    `"${risk}"`,
                    `"${log.action}"`,
                    `"${log.user?.email || 'System'}"`,
                    `"${log.ipAddress || 'N/A'}"`,
                    `"${log.device || log.userAgent || 'Unknown'}"`,
                    `"${(log.details || '').replace(/"/g, '""')}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `forensic-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="flex flex-col min-h-screen gap-4 pb-8">
            <SecurityComplianceDashboard />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                        Forensic Audit Trails
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Immutable system activity logs with fraud detection analysis.
                    </p>
                </div>
                <button 
                    onClick={() => fetchLogs(1)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export Evidence
                </button>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search logs..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
                
                <select 
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                    <option value="ALL">All Status</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILURE">Failure</option>
                    <option value="WARNING">Warning</option>
                </select>

                <div className="flex gap-2">
                    <input 
                        type="date" 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                    <span className="self-center text-gray-400">-</span>
                    <input 
                        type="date" 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                <th className="px-5 py-4">Timestamp</th>
                                <th className="px-5 py-4">Risk Level</th>
                                <th className="px-5 py-4">Action</th>
                                <th className="px-5 py-4">Actor / IP</th>
                                <th className="px-5 py-4">Device Fingerprint</th>
                                <th className="px-5 py-4">Entity</th>
                                <th className="px-5 py-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                                        <Loading />
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500 text-sm">
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const risk = analyzeRisk(log);
                                    return (
                                        <tr key={log.id} className={`hover:bg-slate-50 transition-colors text-sm ${risk.level === 'HIGH' ? 'bg-red-50/50' : ''}`}>
                                            <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                                                {formatManilaTime(log.createdAt)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(log.status)}
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                        risk.level === 'HIGH' ? 'bg-red-100 text-red-700' : 
                                                        risk.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                        {risk.level} ({risk.score})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 font-medium text-slate-900 break-all max-w-[200px]">
                                                {log.action}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    {log.user?.image ? (
                                                        <img 
                                                            src={log.user.image} 
                                                            alt={log.user.name} 
                                                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold"
                                                        style={{ display: log.user?.image ? 'none' : 'flex' }}
                                                    >
                                                        {log.user?.name ? log.user.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-slate-800 text-sm truncate max-w-[150px]" title={log.user?.name || log.metadata?.actorName}>
                                                            {log.user?.name || log.metadata?.actorName || 'Unknown / System'}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-mono">
                                                            {log.user?.email || log.metadata?.actorEmail || log.ipAddress || 'IP Hidden'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs text-slate-600 max-w-[140px] truncate" title={log.userAgent}>
                                                {log.device || log.userAgent || 'Unknown Device'}
                                            </td>
                                            <td className="px-5 py-3 max-w-[180px]">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 truncate" title={log.entity}>{log.entity || '-'}</span>
                                                    <span className="text-xs text-slate-500 truncate" title={log.entityId}>{log.entityId}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 max-w-sm truncate" title={log.details || JSON.stringify(log.metadata)}>
                                                {log.details || (log.metadata ? JSON.stringify(log.metadata) : '-')}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                    <span className="text-base text-slate-500">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} logs)
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={pagination.page <= 1}
                            onClick={() => fetchLogs(pagination.page - 1)}
                            className="px-4 py-2 border border-slate-300 rounded bg-white disabled:opacity-50 text-base"
                        >
                            Previous
                        </button>
                        <button 
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchLogs(pagination.page + 1)}
                            className="px-4 py-2 border border-slate-300 rounded bg-white disabled:opacity-50 text-base"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
