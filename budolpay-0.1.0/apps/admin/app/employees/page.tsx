import { prisma } from "@/lib/prisma";
import React from "react";

export default async function EmployeesPage() {
  const employees = await prisma.user.findMany({
    where: {
      role: { in: ['STAFF', 'ADMIN'] }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { auditLogs: true }
      }
    }
  });

  const auditLogs = await prisma.auditLog.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { firstName: true, lastName: true, role: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Internal Workforce</h1>
          <p className="text-sm text-slate-500">Access control, role assignment, and comprehensive activity monitoring.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition font-bold text-sm">
            Permissions Matrix
          </button>
          <button className="bg-budolshap-primary text-white px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition font-bold text-sm">
            + Provision New Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workforce Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Workforce Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Administrators</span>
                <span className="text-sm font-bold text-slate-900">{employees.filter(e => e.role === 'ADMIN').length}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-budolshap-primary h-full" 
                  style={{ width: `${(employees.filter(e => e.role === 'ADMIN').length / employees.length) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Operations Staff</span>
                <span className="text-sm font-bold text-slate-900">{employees.filter(e => e.role === 'STAFF').length}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full" 
                  style={{ width: `${(employees.filter(e => e.role === 'STAFF').length / employees.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800">
            <h3 className="font-bold text-sm mb-4 text-budolshap-primary">Access Policy (v2.1)</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center shrink-0">
                  <span className="text-green-500 text-[10px]">✓</span>
                </div>
                <p className="text-[10px] text-slate-400">Hardware Security Keys (Yubikey) enforced for Admins.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center shrink-0">
                  <span className="text-green-500 text-[10px]">✓</span>
                </div>
                <p className="text-[10px] text-slate-400">Session timeout reduced to 30 mins for Staff.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center shrink-0">
                  <span className="text-amber-500 text-[10px]">!</span>
                </div>
                <p className="text-[10px] text-slate-400">Mandatory password rotation every 90 days.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee List */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-700">Staff Registry</h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search staff..." 
                className="text-xs border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-budolshap-primary"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-bold">Identity</th>
                  <th className="px-6 py-3 font-bold">Authorization</th>
                  <th className="px-6 py-3 font-bold">Activity</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          emp.role === 'ADMIN' ? 'bg-budolshap-primary/10 text-budolshap-primary' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.role === 'ADMIN' ? 'bg-budolshap-primary text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {emp.role}
                        </span>
                        <span className="text-[9px] text-slate-400">Joined {new Date(emp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-600 font-medium">{emp._count.auditLogs} logged actions</div>
                      <div className="w-24 bg-slate-100 h-1 rounded-full mt-1">
                        <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(emp._count.auditLogs, 100)}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-budolshap-primary transition" title="Edit Permissions">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-900 transition" title="View Audit Logs">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Security Audit Trail */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-slate-700">Forensic Audit Trail</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Real-time internal activity logs</p>
          </div>
          <button className="text-[10px] font-bold text-budolshap-primary hover:underline uppercase tracking-wider">Download Full Trail (JSON)</button>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase text-[9px]">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Staff Identity</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Resource Affected</th>
                  <th className="px-6 py-3">Outcome</th>
                  <th className="px-6 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${log.user?.role === 'ADMIN' ? 'bg-budolshap-primary' : 'bg-indigo-400'}`}></span>
                        <span className="font-bold text-slate-700">{log.user?.firstName} {log.user?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {log.entity} <span className="text-[9px] font-mono opacity-60">#{log.entityId?.split('-')[0]}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-green-600 font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        SUCCESS
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-[9px] text-slate-400 truncate max-w-[200px]" title={JSON.stringify(log.newValue)}>
                        IP: {log.ipAddress || 'Internal System'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
