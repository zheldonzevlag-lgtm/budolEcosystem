'use client';

import { useState, useEffect } from 'react';

export default function DisputesPage() {
    const [disputes, setDisputes] = useState([]);
    const [recon, setRecon] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [disputesRes, reconRes] = await Promise.all([
                fetch('/api/disputes'),
                fetch('/api/reconciliation')
            ]);
            const disputesData = await disputesRes.json();
            const reconData = await reconRes.json();
            setDisputes(disputesData);
            setRecon(reconData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resolveDispute = async (id, status) => {
        try {
            await fetch(`/api/disputes/${id}/resolve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status, 
                    resolutionNotes: `Resolved via Admin Dashboard on ${new Date().toISOString()}` 
                })
            });
            fetchData();
        } catch (error) {
            alert('Failed to resolve dispute');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Disputes & Reconciliation</h1>
                    <p className="text-slate-500">Manage transaction conflicts and financial integrity reports</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm"
                >
                    REFRESH DATA
                </button>
            </header>

            {recon && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue (Fees)</p>
                        <p className="text-2xl font-black text-slate-900">₱{recon.metrics?.totalRevenue}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paid Settlements</p>
                        <p className="text-2xl font-black text-emerald-600">{recon.metrics?.paidSettlements}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Disputes</p>
                        <p className="text-2xl font-black text-amber-600">{recon.metrics?.activeDisputes}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Integrity Status</p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-2xl font-black text-slate-900">{recon.integrityCheck}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dispute ID</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transaction</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading disputes...</td></tr>
                        ) : disputes.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No active disputes found</td></tr>
                        ) : disputes.map((dispute) => (
                            <tr key={dispute.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{dispute.id.slice(0, 8)}...</td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-900">₱{dispute.transaction?.amount}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">{dispute.transactionId.slice(0, 8)}...</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{dispute.reason}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                                        dispute.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 
                                        dispute.status === 'RESOLVED_REFUNDED' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {dispute.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">
                                    {new Date(dispute.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    {dispute.status === 'OPEN' && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => resolveDispute(dispute.id, 'RESOLVED_REFUNDED')}
                                                className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700 transition-colors"
                                            >
                                                REFUND
                                            </button>
                                            <button 
                                                onClick={() => resolveDispute(dispute.id, 'RESOLVED_DECLINED')}
                                                className="px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded hover:bg-slate-900 transition-colors"
                                            >
                                                DECLINE
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
