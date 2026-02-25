'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Check, X, Info, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import { formatManilaTime } from "@/lib/dateUtils"

const PermissionsMatrix = () => {
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedRole, setSelectedRole] = useState(null)
    const [syncing, setSyncing] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/users/roles')
            const data = await res.json()
            if (res.ok) {
                setConfig(data)
                if (data.roles.length > 0 && !selectedRole) {
                    setSelectedRole(data.roles[0])
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to load RBAC configuration' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error loading RBAC configuration' })
        } finally {
            setLoading(false)
        }
    }

    const handleSync = async () => {
        try {
            setSyncing(true)
            setMessage({ type: 'info', text: 'Synchronizing user roles and permissions...' })
            const res = await fetch('/api/admin/users/sync-rbac', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                setMessage({ type: 'success', text: `Successfully synced ${data.updatedCount} users.` })
            } else {
                setMessage({ type: 'error', text: data.error || 'Sync failed' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error during sync' })
        } finally {
            setSyncing(false)
        }
    }

    const hasPermission = (role, permission) => {
        if (!config || !config.rolePermissions) return false
        return config.rolePermissions[role]?.includes(permission)
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center">
                <Loader2 className="text-indigo-600 animate-spin mb-4" size={32} />
                <p className="text-slate-500 font-medium">Loading RBAC Configuration...</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Shield className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-800">RBAC Permissions Matrix</h2>
                    </div>
                    <p className="text-slate-500 text-sm">Review global role-based access control policies.</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                    {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Sync All Users
                </button>
            </div>

            {/* Notification Bar */}
            {message && (
                <div className={`px-6 py-3 border-b flex items-center justify-between ${
                    message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 
                    message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' :
                    'bg-blue-50 border-blue-100 text-blue-700'
                }`}>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        {message.type === 'error' ? <X size={16} /> : <Info size={16} />}
                        {message.text}
                    </div>
                    <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100">
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row">
                {/* Role Selector */}
                <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Select Role</p>
                    {config?.roles.map((role) => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between group ${
                                selectedRole === role
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-200'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span>{role}</span>
                            {selectedRole === role && <Check size={16} />}
                        </button>
                    ))}
                    
                    <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="flex gap-2 text-amber-800 mb-1">
                            <AlertTriangle size={16} className="shrink-0" />
                            <p className="text-xs font-bold uppercase">Compliance Note</p>
                        </div>
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                            These roles are read-only in the UI for security. Changes must be made in <code>lib/rbac.js</code> and deployed.
                        </p>
                    </div>
                </div>

                {/* Permissions Grid */}
                <div className="flex-1 p-6 overflow-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {selectedRole} Permissions
                                <span className="text-xs font-normal bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                    {config?.rolePermissions[selectedRole]?.length || 0} Enabled
                                </span>
                            </h3>
                            <p className="text-sm text-slate-500">Effective permissions for the selected role</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {config?.permissions.map((perm) => {
                            const enabled = hasPermission(selectedRole, perm)
                            return (
                                <div 
                                    key={perm}
                                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                        enabled 
                                            ? 'bg-white border-slate-200 shadow-sm' 
                                            : 'bg-slate-50/50 border-transparent opacity-50 grayscale'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        enabled ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'
                                    }`}>
                                        {enabled ? <Check size={18} /> : <X size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-xs font-bold truncate ${enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {perm.split(':').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono truncate">{perm}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Last Config Update: {config?.metadata?.lastUpdated ? formatManilaTime(config.metadata.lastUpdated) : 'N/A'}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">PCI DSS v4.0</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">BSP Circular 808</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PermissionsMatrix
