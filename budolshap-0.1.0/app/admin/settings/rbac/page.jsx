'use client'

import React from 'react'
import PermissionsMatrix from '@/components/admin/PermissionsMatrix'
import { Shield, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

const RBACSettingsPage = () => {
    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
                <Link href="/admin" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <Home size={14} />
                    <span>Dashboard</span>
                </Link>
                <ChevronRight size={14} />
                <span className="text-slate-400">Settings</span>
                <ChevronRight size={14} />
                <span className="text-slate-900 font-medium">RBAC & Permissions</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Access Control</h1>
                    <p className="text-slate-500 mt-1">Configure global role permissions and security policies.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-100 flex items-center gap-2">
                        <Shield size={16} />
                        Compliance Mode: Active
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-8">
                <PermissionsMatrix />
                
                {/* Additional Security Context */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-900 rounded-2xl text-white">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            PCI DSS Compliance
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            System-wide enforcement of "Least Privilege" principle. All administrative actions are recorded in audit logs with compliance metadata.
                        </p>
                    </div>
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                        <h4 className="font-bold text-slate-900 mb-2">Audit Status</h4>
                        <div className="flex items-center justify-between text-sm mb-4">
                            <span className="text-slate-500">Log Integrity</span>
                            <span className="text-green-600 font-semibold">Verified</span>
                        </div>
                        <Link 
                            href="/admin/settings/audit-logs" 
                            className="text-indigo-600 text-sm font-bold hover:underline"
                        >
                            View Recent Changes →
                        </Link>
                    </div>
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                        <h4 className="font-bold text-slate-900 mb-2">Sync Status</h4>
                        <div className="flex items-center justify-between text-sm mb-4">
                            <span className="text-slate-500">budolID SSO Sync</span>
                            <span className="text-blue-600 font-semibold">Real-time</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Permissions are synced across the ecosystem via the unified identity provider.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RBACSettingsPage
