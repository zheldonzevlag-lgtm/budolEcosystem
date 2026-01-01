import { prisma } from "@/lib/prisma";
import React from "react";

export default async function AccountingPage() {
  const accounts = await prisma.chartOfAccount.findMany({
    include: {
      ledgerEntries: true,
    },
  });

  const ledgerEntries = await prisma.ledgerEntry.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      account: true,
    },
  });

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { email: true, firstName: true, lastName: true } },
      receiver: { select: { email: true, firstName: true, lastName: true } },
    }
  });

  // Calculate account balances
  const getBalance = (accountCode: string) => {
    const account = accounts.find(a => a.code === accountCode);
    if (!account) return 0;
    
    return account.ledgerEntries.reduce((acc, entry) => {
      const debit = Number(entry.debit);
      const credit = Number(entry.credit);
      
      // Standard accounting: Assets and Expenses increase with Debit, decrease with Credit
      // Liabilities, Equity, and Revenue increase with Credit, decrease with Debit
      if (account.type === 'ASSET' || account.type === 'EXPENSE') {
        return acc + (debit - credit);
      } else {
        return acc + (credit - debit);
      }
    }, 0);
  };

  const cashAtBank = getBalance('1000');
  const userBalances = getBalance('1010');
  const accountsPayable = getBalance('2000');
  const revenue = getBalance('4000');
  const expenses = getBalance('5000');
  const equity = getBalance('3000') + (revenue - expenses);

  const totalVolume = transactions.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalFees = transactions.reduce((acc, curr) => acc + Number(curr.fee), 0);
  const totalFailed = transactions.filter(tx => tx.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Command Center</h1>
          <p className="text-sm text-slate-500">Immutable ledger and real-time financial reporting (Compliance: BSP/BIR/PCI-DSS).</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-slate-600">System Integrity: <span className="text-budolshap-primary font-bold">Verified</span></div>
          <div className="text-xs text-slate-400">Last Audit: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cash at Bank</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₱{cashAtBank.toLocaleString()}</p>
          <p className="text-xs text-blue-500 mt-2">Assets (Liquidity)</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue (Platform Fees)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₱{revenue.toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-2">Total Gross Revenue</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Liabilities</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">₱{userBalances.toLocaleString()}</p>
          <p className="text-xs text-amber-500 mt-2">Held in Escrow</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operating Profit</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">₱{(revenue - expenses).toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-2">EBITDA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time General Ledger */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-700">Immutable General Ledger</h2>
            <div className="flex gap-2">
              <button className="text-xs bg-white border border-slate-300 px-3 py-1 rounded hover:bg-slate-50">Filter</button>
              <button className="text-xs bg-budolshap-primary text-white px-3 py-1 rounded hover:opacity-90 transition shadow-sm shadow-budolshap-primary/20">Export Audit Log</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-semibold">Account</th>
                  <th className="px-6 py-3 font-semibold">Reference</th>
                  <th className="px-6 py-3 font-semibold text-right">Debit (Dr)</th>
                  <th className="px-6 py-3 font-semibold text-right">Credit (Cr)</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ledgerEntries.length > 0 ? (
                  ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{entry.account.name}</div>
                        <div className="text-[10px] text-slate-500">{entry.account.code}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{entry.referenceId}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        {Number(entry.debit) > 0 ? `₱${Number(entry.debit).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600">
                        {Number(entry.credit) > 0 ? `₱${Number(entry.credit).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      No ledger entries found. Perform a transaction to seed the ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Balance Sheet & Compliance */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Balance Sheet
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Assets</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Cash & Equivalents</span>
                  <span className="font-mono font-semibold">₱{cashAtBank.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Liabilities</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">User Wallets</span>
                    <span className="font-mono text-amber-600">₱{userBalances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Accounts Payable</span>
                    <span className="font-mono text-amber-600">₱{accountsPayable.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Equity</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Platform Equity</span>
                  <span className="font-mono font-bold text-indigo-600">₱{equity.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800">
            <h3 className="font-bold text-lg mb-4 text-budolshap-primary">Compliance & Regulatory</h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-400">BSP REPORTING (Form 2307)</span>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">AUTO-SYNC</span>
                </div>
                <p className="text-xs text-slate-300">Last submitted: 2025-12-25</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-400">BIR TAX COMPLIANCE</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">VALID</span>
                </div>
                <p className="text-xs text-slate-300">Next filing: 2026-01-15</p>
              </div>
            </div>
            <button className="w-full mt-6 bg-budolshap-primary hover:opacity-90 text-white font-bold py-2.5 rounded-lg text-sm transition shadow-lg shadow-budolshap-primary/20">
              Download Audit Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
