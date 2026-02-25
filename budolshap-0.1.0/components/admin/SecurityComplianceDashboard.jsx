'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { 
    ShieldCheck, Lock, Users, Server, Activity, 
    AlertTriangle, Eye, Zap, CheckCircle, BarChart2,
    CloudLightning, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

export default function SecurityComplianceDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(true);

    // Initial Fetch
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/security-dashboard');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Failed to fetch security dashboard:', error);
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Realtime Updates
    const handleRealtimeLog = useCallback((newLog) => {
        if (!data) return;

        setData(prev => {
            if (!prev) return prev;
            
            // Clone data to avoid mutation
            const newData = { ...prev };
            const todayIndex = newData.trends.findIndex(t => t.day === format(new Date(), 'EEE').toUpperCase());

            if (todayIndex !== -1) {
                if (['FAILURE', 'WARNING'].includes(newLog.status)) {
                    newData.trends[todayIndex].threats += 1;
                }
                if (['SPAM_ATTEMPT', 'DDOS_MITIGATED', 'BLOCKED_ACCESS'].includes(newLog.action)) {
                    newData.trends[todayIndex].blocked += 1;
                }
            }

            // Update AI Findings for critical issues
            if (newLog.status === 'FAILURE' || newLog.action === 'SPAM_ATTEMPT') {
                newData.aiFindings.text = `Detected recent ${newLog.action} from ${newLog.ipAddress || 'unknown source'}. Monitoring for pattern escalation.`;
            }

            return newData;
        });
    }, [data]);

    useRealtime({
        channel: 'admin',
        event: 'AUDIT_LOG_CREATED',
        onData: handleRealtimeLog
    });

    if (loading) return (
        <div className="animate-pulse h-36 bg-gray-100 rounded-lg mb-6 border border-gray-200 p-5">
             <div className="h-5 bg-gray-200 rounded w-1/4 mb-5"></div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                 <div className="h-28 bg-gray-200 rounded-xl"></div>
                 <div className="h-28 bg-gray-200 rounded-xl"></div>
                 <div className="h-28 bg-gray-200 rounded-xl"></div>
             </div>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium text-base">Security Dashboard Unavailable: {error}</span>
            </div>
            <button 
                onClick={fetchData} 
                className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
            >
                Retry
            </button>
        </div>
    );

    if (!data) return null;

    return (
        <div className="mb-8 space-y-5">
            <div 
                className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 -ml-2 rounded-lg transition-colors group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Security & Compliance
                        <span className="px-2.5 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full border border-green-200">
                            LIVE TELEMETRY
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Forensic audit logs and regulatory reporting tools.</p>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </div>

            {isOpen && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Card 1: Compliance Hardening */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        Compliance Hardening
                    </h3>
                    <div className="space-y-1.5">
                        <ComplianceItem 
                            label="AI Spam Guard" 
                            status={data.compliance.aiSpamGuard.status} 
                            sub={data.compliance.aiSpamGuard.type} 
                            icon={<Zap className="w-4 h-4 text-purple-500" />}
                        />
                        <ComplianceItem 
                            label="Data Encryption" 
                            status={data.compliance.encryption.status} 
                            sub={data.compliance.encryption.type} 
                            icon={<Lock className="w-4 h-4 text-blue-500" />}
                        />
                        <ComplianceItem 
                            label="Access Control" 
                            status={data.compliance.rbac.status} 
                            sub={data.compliance.rbac.type} 
                            icon={<Users className="w-4 h-4 text-indigo-500" />}
                        />
                        <ComplianceItem 
                            label="SSL/TLS 1.3" 
                            status={data.compliance.ssl.status} 
                            sub={data.compliance.ssl.type} 
                            icon={<Server className="w-4 h-4 text-teal-500" />}
                        />
                        <ComplianceItem 
                            label="Intrusion Detection" 
                            status={data.compliance.ids.status} 
                            sub={data.compliance.ids.type} 
                            icon={<Activity className="w-4 h-4 text-red-500" />}
                        />
                        <ComplianceItem 
                            label="DoS/DDoS Protection" 
                            status={data.compliance.ddos?.status || 'Mitigating'} 
                            sub={data.compliance.ddos?.type || 'L7-SHIELD'} 
                            icon={<CloudLightning className="w-4 h-4 text-orange-500" />}
                        />
                    </div>
                </div>

                {/* Card 2: Threat Mitigation Trend */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2 mb-1">
                        <History className="w-5 h-5 text-red-500" />
                        Threat Mitigation Trend
                    </h3>
                    <div className="flex-1 flex items-end justify-between gap-1 h-80 mt-0 px-1">
                        {data.trends.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 w-full">
                                <div className="w-full flex flex-col-reverse h-72 gap-px relative group">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded z-10 whitespace-nowrap shadow-lg">
                                        Blocked: {day.blocked} | Threats: {day.threats}
                                    </div>
                                    
                                    {/* Bar Segments */}
                                    {(day.threats > 0 || day.blocked > 0) ? (
                                        <>
                                            <div 
                                                className="w-full bg-red-500 rounded-t-[1px] transition-all duration-500"
                                                style={{ height: `${Math.min((day.threats / 20) * 100, 80)}%` }} // Scale factor
                                            ></div>
                                            <div 
                                                className="w-full bg-red-200 rounded-b-[1px] transition-all duration-500"
                                                style={{ height: `${Math.min((day.blocked / 20) * 100, 80)}%` }} // Scale factor
                                            ></div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 rounded-[1px]"></div>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{day.day}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 justify-center">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> THREATS
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-200"></span> BLOCKED
                        </div>
                    </div>
                </div>

                {/* Card 3 & 4 Stacked */}
                <div className="flex flex-col gap-4">
                    {/* Card 3: Vulnerability Scan */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 shadow-sm flex-1">
                        <h3 className="text-base font-semibold text-red-800 flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            Vulnerability Scan
                        </h3>
                        <p className="text-sm text-red-600 mb-3 leading-tight">
                            Last scan: {format(new Date(data.vulnerability.lastScan), 'MM/dd HH:mm')}. 
                            {data.vulnerability.critical === 0 ? ' No critical issues.' : ` ${data.vulnerability.critical} critical found.`}
                        </p>
                        
                        <div className="relative pt-2">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                                        System Integrity
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-red-600">
                                        {data.vulnerability.integrity}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-red-200">
                                <div style={{ width: `${data.vulnerability.integrity}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500 transition-all duration-1000"></div>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: AI Analyst Findings */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm flex flex-col justify-between flex-1">
                        <div>
                            <h3 className="text-base font-semibold text-blue-800 flex items-center gap-2 mb-2">
                                <Eye className="w-5 h-5" />
                                AI Analyst Findings
                            </h3>
                            <p className="text-sm text-blue-700 italic leading-snug line-clamp-3">
                                "{data.aiFindings.text}"
                            </p>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-bold rounded uppercase tracking-wider">
                                Insights
                            </span>
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded uppercase tracking-wider">
                                {data.aiFindings.model}
                            </span>
                        </div>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
}

function ComplianceItem({ label, status, sub, icon }) {
    const isGood = ['Enabled', 'Active', 'Enforced', 'Monitoring', 'Mitigating'].includes(status);
    const isAlert = ['Alert', 'Critical', 'High Risk'].includes(status);
    
    let colorClass = 'text-gray-500';
    if (isGood) colorClass = 'text-green-600';
    else if (isAlert) colorClass = 'text-red-600';

    return (
        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded shadow-sm border border-gray-100">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-800 leading-none mb-1.5">{label}</p>
                    <p className="text-xs text-gray-500 font-mono uppercase tracking-wide leading-none">{sub}</p>
                </div>
            </div>
            <span className={`text-xs font-bold ${colorClass}`}>
                {status}
            </span>
        </div>
    );
}

function History({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
    )
}
