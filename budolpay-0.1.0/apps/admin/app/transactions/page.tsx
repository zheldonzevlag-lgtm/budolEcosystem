"use client";

import { useState, useEffect } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  Search, 
  Filter, 
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar
} from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, typeFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      
      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      setTransactions(data);
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tx.sender?.email && tx.sender.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (tx.receiver?.email && tx.receiver.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle2 size={14} className="text-green-500" />;
      case "PENDING": return <Clock size={14} className="text-amber-500" />;
      case "FAILED": return <XCircle size={14} className="text-rose-500" />;
      case "CANCELLED": return <AlertCircle size={14} className="text-slate-400" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CASH_IN": return <ArrowDownLeft size={16} className="text-green-600" />;
      case "CASH_OUT": return <ArrowUpRight size={16} className="text-rose-600" />;
      case "P2P_TRANSFER": return <ArrowLeftRight size={16} className="text-blue-600" />;
      case "MERCHANT_PAYMENT": return <ArrowUpRight size={16} className="text-indigo-600" />;
      default: return <ArrowLeftRight size={16} className="text-slate-600" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Global Transactions</h2>
          <p className="text-slate-600">Real-time monitoring of all ecosystem financial flows.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Reference ID or Email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-budolshap-primary/20 w-full"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-budolshap-primary/20"
          >
            <option value="ALL">All Types</option>
            <option value="CASH_IN">Cash In</option>
            <option value="CASH_OUT">Cash Out</option>
            <option value="P2P_TRANSFER">P2P Transfer</option>
            <option value="MERCHANT_PAYMENT">Merchant Payment</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-budolshap-primary/20"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium border-l pl-4 border-slate-200">
          <Calendar size={16} />
          <span>Last 30 Days</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Reference ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Sender / Receiver</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-budolshap-primary" size={24} />
                      <p className="text-slate-500 font-medium">Fetching transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-slate-900">{tx.referenceId}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-lg">
                          {getTypeIcon(tx.type)}
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-slate-400 w-8 font-bold uppercase text-[9px]">From:</span>
                          <span className="text-slate-700 font-medium">{tx.sender?.email || "SYSTEM"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-slate-400 w-8 font-bold uppercase text-[9px]">To:</span>
                          <span className="text-slate-700 font-medium">{tx.receiver?.email || "EXTERNAL"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-900">₱{Number(tx.amount).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-bold">Fee: ₱{Number(tx.fee).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(tx.status)}
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          {tx.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowLeftRight className="text-slate-200" size={48} />
                      <p className="text-slate-500 font-medium">No transactions found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
